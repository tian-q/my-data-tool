// HTTP layer contracts, ported from the Vue client (`utils/axios.js`).
// Framework-agnostic: no React, no axios types leak out of here.

/** Backend envelope. Every response is `{ code, message, data }`; `code === 0` is success. */
export interface ApiResponse<T = unknown> {
	code: number;
	message: string;
	data: T;
}

/** Success sentinel — `code === 0` means OK (matches the Vue convention). */
export const API_OK = 0;

/**
 * Normalized error rejected by the client interceptor. Business `catch` blocks
 * read `.code` for friendly messaging and `.toasted` to skip double-toasting.
 */
export interface ApiError {
	status?: number;
	code?: number;
	message: string;
	data?: unknown;
	/** X-Request-ID echoed by the backend; surfaced in toasts for support/grep. */
	requestId?: string;
	/** Set by the interceptor when it already showed a toast for this error. */
	toasted?: boolean;
}

// --- Auth business codes (from `utils/axios.js`) -------------------------------
// 401 + these → access token expired/invalid → try a silent refresh + replay.
export const AUTH_TOKEN_EXPIRED = 1005;
export const AUTH_TOKEN_INVALID = 1008;
// 401 + these → refresh would be rejected the same way → clear auth, no refresh.
//   1010 = refresh token revoked (logout, blacklisted in Redis)
//   1014 = admin forced logout (tokens_invalid_before > token.iat)
export const AUTH_REVOKED = 1010;
export const AUTH_FORCED_LOGOUT = 1014;

/**
 * Codes the interceptor auto-toasts (then sets `toasted=true`). Ported 1:1 from
 * `ERROR_TOAST_MAP` in `utils/axios.js`. Business code need not toast these again.
 */
export const ERROR_TOAST_MAP: Record<
	number,
	{ type: "info" | "warning" | "error" | "success"; message: string }
> = {
	2030: { type: "info", message: "请输入搜索关键字" },
	2031: { type: "warning", message: "撤销窗口已过,请到回收站恢复" },
	3003: { type: "warning", message: "请求过于频繁,请稍候再试" },
	3048: { type: "warning", message: "搜索过于频繁,请稍候再试" },
};
