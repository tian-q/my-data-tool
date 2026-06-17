"use client";
import type { ApiResponse } from "@/lib/http/types";
import type { AuthResult } from "@/types/auth";

// Shared auth-UI primitives and types. Keeps the six form components DRY without
// re-merging them into one file (the Vue source was a single 1700-line component).

/** Chinese-mainland mobile number, ported from the Vue `PHONE_REGEX`. */
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** The six dialog modes (Vue `mode` ref). First three are tabbed. */
export type LoginMode =
	| "login-password"
	| "login-sms"
	| "register"
	| "reset-password"
	| "wechat-qr"
	| "wechat-bind-phone";

/** Wechat two-step bind context, stashed in sessionStorage by the callback page. */
export interface WechatBindContext {
	ticket: string;
	nickname: string;
	avatar: string;
}

/** Applies a successful auth response: store token + user, toast, close dialog. */
export type ApplyAuthResult = (
	result: ApiResponse<AuthResult>,
	successText: string,
) => void;

/** Primary submit button with loading dots + arrow. `wx` switches to the green variant. */
export function SubmitButton({
	loading,
	text,
	wx = false,
}: {
	loading: boolean;
	text: string;
	wx?: boolean;
}) {
	return (
		<button
			type="submit"
			className={`px-submit${wx ? " px-submit--wx" : ""}`}
			disabled={loading}
		>
			{!loading && <span className="px-submit__text">{text}</span>}
			{loading && (
				<span className="px-submit__loader" role="status" aria-label="处理中">
					<i />
					<i />
					<i />
				</span>
			)}
			{!loading && (
				<span className="px-submit__arrow" aria-hidden="true">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M5 12h14M13 6l6 6-6 6" />
					</svg>
				</span>
			)}
		</button>
	);
}

/** "或 / 微信扫码登录" block shared by the password and SMS login forms. */
export function WechatLoginCta({
	disabled,
	onEnter,
}: {
	disabled: boolean;
	onEnter: () => void;
}) {
	return (
		<>
			<div className="px-divider">
				<span>或</span>
			</div>
			<button
				type="button"
				className={`px-wechat-cta${disabled ? " is-disabled" : ""}`}
				disabled={disabled}
				onClick={onEnter}
			>
				<span className="px-wechat-cta__icon" aria-hidden="true">
					<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8.5 4C4.91 4 2 6.42 2 9.4c0 1.69.94 3.2 2.42 4.21l-.6 1.95 2.27-1.14c.74.2 1.55.31 2.41.31.2 0 .4-.01.6-.02-.13-.4-.2-.83-.2-1.27 0-2.74 2.59-4.94 5.8-4.94.18 0 .35.01.52.02C14.83 5.79 12 4 8.5 4zM6.6 8.55a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7zm3.8 0a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7z" />
						<path d="M22 13.43c0-2.4-2.4-4.36-5.36-4.36-3.13 0-5.6 2.18-5.6 4.86 0 2.7 2.47 4.86 5.6 4.86.66 0 1.3-.1 1.9-.27l1.94.99-.51-1.66c1.27-.92 2.03-2.21 2.03-3.42zm-7.43-1.16a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4zm3.13 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z" />
					</svg>
				</span>
				<span className="px-wechat-cta__text">微信扫码登录</span>
			</button>
		</>
	);
}
