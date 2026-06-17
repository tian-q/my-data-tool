import { z } from "zod";
import { PHONE_REGEX } from "./shared";

// Shared auth field validators. Messages match the Vue originals verbatim so the
// SMS/reset/wechat-bind/register forms stop hand-rolling the same regex checks.

export const phoneField = z
	.string()
	.trim()
	.regex(PHONE_REGEX, "请输入正确的手机号");

export const smsCodeField = z
	.string()
	.trim()
	.regex(/^\d{4,8}$/, "请输入 4-8 位验证码");

/** Validate phone + SMS code; returns the first error message, or null when both pass. */
export function validatePhoneCode(phone: string, code: string): string | null {
	const p = phoneField.safeParse(phone);
	if (!p.success) return p.error.issues[0]?.message ?? "请输入正确的手机号";
	const c = smsCodeField.safeParse(code);
	if (!c.success) return c.error.issues[0]?.message ?? "请输入 4-8 位验证码";
	return null;
}

/** Reset/new-password rule: 8-32 chars, letters + digits (single Vue message). */
export function validateNewPassword(password: string): string | null {
	const ok =
		password.length >= 8 &&
		password.length <= 32 &&
		/[A-Za-z]/.test(password) &&
		/\d/.test(password);
	return ok ? null : "新密码 8-32 位，需含字母和数字";
}
