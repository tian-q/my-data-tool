import axios, {
	type AxiosError,
	type AxiosRequestConfig,
	type InternalAxiosRequestConfig,
} from "axios";
import { env } from "../../../env.mjs";
import { toast } from "../toast";
import {
	clearAccessToken,
	getAccessToken,
	notifyAuthCleared,
	setAccessToken,
} from "./token";
import {
	API_OK,
	type ApiError,
	type ApiResponse,
	AUTH_FORCED_LOGOUT,
	AUTH_REVOKED,
	AUTH_TOKEN_EXPIRED,
	AUTH_TOKEN_INVALID,
	ERROR_TOAST_MAP,
} from "./types";

// HTTP client + interceptors, ported 1:1 from `utils/axios.js`. Behaviour kept
// identical: `code === 0` unwraps to the envelope, 401+1005/1008 triggers a
// single silent refresh with a replay queue, 401+1010/1014 clears auth outright.

/** Request config flag marking a request that has already been retried post-refresh. */
interface RetryableConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

let isRefreshing = false;
let requestQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null = null): void {
	requestQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
			return;
		}
		resolve(token as string);
	});
	requestQueue = [];
}

const http = axios.create({
	// Unified `/api` prefix: dev rewrites it (next.config.mjs), prod via Nginx.
	baseURL: env.NEXT_PUBLIC_API_BASE,
	timeout: 100000,
	withCredentials: true, // refresh cookie must ride along
});

// --- request: inject Bearer token ---------------------------------------------
http.interceptors.request.use(
	(config) => {
		const token = getAccessToken();
		if (token && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// --- response: unwrap envelope, refresh-and-replay on 401 ---------------------
http.interceptors.response.use(
	(response) => {
		const res = response.data as ApiResponse;
		if (res?.code === API_OK) {
			// Resolve to the envelope itself (callers read `.data`), matching Vue.
			return res as unknown as typeof response;
		}
		const apiError: ApiError = {
			status: response.status,
			code: res?.code,
			message: res?.message || "请求失败",
			data: res?.data,
		};
		return Promise.reject(apiError);
	},
	async (error: AxiosError<ApiResponse>) => {
		const originalRequest = (error?.config || {}) as RetryableConfig;
		const response = error?.response;
		const status = response?.status;
		const serverData = (response?.data || {}) as Partial<ApiResponse>;
		const code = serverData?.code;

		// X-Request-ID echoed by the backend; surfaced in toasts for support/grep.
		const requestId = response?.headers?.["x-request-id"] as string | undefined;

		const apiError: ApiError = {
			status,
			code,
			message: serverData?.message || error?.message || "请求失败",
			data: serverData?.data,
			requestId,
		};

		// Auto-toast known codes, then mark toasted so business catch can skip it.
		const toastSpec = code != null ? ERROR_TOAST_MAP[code] : undefined;
		if (toastSpec) {
			try {
				toast[toastSpec.type](toastSpec.message, { requestId });
				apiError.toasted = true;
			} catch {}
		}

		const isRefreshApi = originalRequest?.url?.includes("/v1/auth/refresh");

		// 1010/1014 would be rejected by refresh too → clear auth, avoid a loop.
		if (
			status === 401 &&
			(code === AUTH_REVOKED || code === AUTH_FORCED_LOGOUT)
		) {
			clearAccessToken();
			notifyAuthCleared();
			return Promise.reject(apiError);
		}

		const shouldRefresh =
			status === 401 &&
			(code === AUTH_TOKEN_EXPIRED || code === AUTH_TOKEN_INVALID) &&
			!isRefreshApi &&
			!originalRequest._retry;

		if (!shouldRefresh) {
			return Promise.reject(apiError);
		}

		// A refresh is already in flight: queue this request and replay it after.
		if (isRefreshing) {
			return new Promise<string>((resolve, reject) => {
				requestQueue.push({ resolve, reject });
			}).then((token) => {
				originalRequest.headers.Authorization = `Bearer ${token}`;
				return http(originalRequest);
			});
		}

		originalRequest._retry = true;
		isRefreshing = true;

		try {
			// Success interceptor returns the envelope `{ code, message, data }`.
			const refreshResult = (await http.post(
				"/v1/auth/refresh",
			)) as unknown as ApiResponse<{ access_token?: string }>;
			const newToken = refreshResult?.data?.access_token;
			if (!newToken) {
				throw {
					status: 401,
					code: refreshResult?.code,
					message: refreshResult?.message || "刷新 token 失败",
					data: refreshResult?.data,
				} satisfies ApiError;
			}

			setAccessToken(newToken);
			flushQueue(null, newToken);

			originalRequest.headers.Authorization = `Bearer ${newToken}`;
			return http(originalRequest);
		} catch (refreshError) {
			clearAccessToken();
			notifyAuthCleared();
			flushQueue(refreshError, null);
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	},
);

/**
 * Typed request helper. Resolves to the backend envelope (the success
 * interceptor unwraps `response.data`), so callers read `.data`. Replaces the
 * Vue `request(...)` call sites 1:1.
 */
export function client<T = unknown>(
	config: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
	return http.request(config) as unknown as Promise<ApiResponse<T>>;
}

export default client;
