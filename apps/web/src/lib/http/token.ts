// In-memory access token holder, shared by the HTTP client and the auth store.
// Ported from the module-level `accessToken` + `auth:cleared` event in
// `utils/axios.js`. Kept in memory only (never localStorage) — the long-lived
// refresh token lives in an HttpOnly cookie, the access token is re-derived on
// boot via /v1/auth/refresh.

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

export function getAccessToken(): string | null {
	return accessToken;
}

export function clearAccessToken(): void {
	accessToken = null;
}

const AUTH_CLEARED_EVENT = "auth:cleared";

/**
 * Broadcast that auth was cleared (refresh failed / forced logout). The auth
 * store subscribes via `onAuthCleared` to drop user state. Mirrors the Vue
 * `window.dispatchEvent(new CustomEvent('auth:cleared'))`.
 */
export function notifyAuthCleared(): void {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent(AUTH_CLEARED_EVENT));
	}
}

/** Subscribe to the auth-cleared signal. Returns an unsubscribe function. */
export function onAuthCleared(handler: () => void): () => void {
	if (typeof window === "undefined") {
		return () => {};
	}
	const listener = () => handler();
	window.addEventListener(AUTH_CLEARED_EVENT, listener);
	return () => window.removeEventListener(AUTH_CLEARED_EVENT, listener);
}
