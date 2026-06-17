// Shared auth types. The backend `User`/UserProfile shape is loosely typed —
// only the fields the UI actually reads are named; the index signature keeps
// extra server fields without fighting the compiler.

export interface User {
	id?: number | string;
	username?: string;
	nickname?: string;
	email?: string;
	phone?: string;
	avatar_url?: string;
	has_password?: boolean;
	wechat_bound?: boolean;
	/** Some endpoints nest the profile under `user`; see `isUserLoggedIn`. */
	user?: User;
	[key: string]: unknown;
}

/** Payload returned by login/register/sms-login/wechat-bind — token + profile. */
export interface AuthResult {
	access_token: string;
	user: User;
}

/** SMS verification scenes accepted by `/v1/auth/sms/send`. */
export type SmsScene = "login" | "register" | "bind" | "reset_password";

export interface LoginPayload {
	username: string;
	password: string;
}

export interface RegisterPayload {
	username: string;
	password: string;
	phone: string;
	code: string;
	nickname?: string;
}

export interface SmsSendPayload {
	phone: string;
	scene: SmsScene;
}

export interface SmsPayload {
	phone: string;
	code: string;
}

export interface ResetPasswordPayload {
	phone: string;
	code: string;
	new_password: string;
}

export interface WechatBindPhonePayload {
	bind_ticket: string;
	phone: string;
	code: string;
	conflict_resolution?: "merge";
}

export interface AuthState {
	user: User | null;
	setUser: (user: User | null) => void;
	clearAuth: () => void;
}

/**
 * Logged-in iff the profile carries any identifying field. Unwraps a nested
 * `user` first, mirroring the Vue `isAuthenticated` (`userInfo.user || userInfo`).
 */
export function isUserLoggedIn(user: User | null | undefined): boolean {
	const profile = (user?.user ?? user) as User | null | undefined;
	return Boolean(
		profile?.id || profile?.username || profile?.nickname || profile?.email,
	);
}
