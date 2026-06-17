import client from "@/lib/http/client";
import type {
	AuthResult,
	LoginPayload,
	RegisterPayload,
	ResetPasswordPayload,
	SmsPayload,
	SmsSendPayload,
	User,
	WechatBindPhonePayload,
} from "@/types/auth";

// Auth API, ported 1:1 from Vue `api/login.js`. Only `request(...)` → `client(...)`
// changed; JSDoc kept verbatim because the parameter constraints carry business
// meaning (validated against the backend).

/**
 * 注册（账号密码 + 手机号 + 验证码原子注册）
 * @param data.username   - 必填，3-50 字符，且不能是 11 位手机号格式
 * @param data.password   - 必填，8-32 字符，需同时含字母 + 数字
 * @param data.phone      - 必填，11 位中国大陆手机号
 * @param data.code       - 必填，4-8 位验证码（scene='register'）
 * @param data.nickname   - 选填，最长 50 字符
 */
export function registerApi(data: RegisterPayload) {
	return client<AuthResult>({ url: "/v1/auth/register", method: "post", data });
}

/**
 * 用户名 / 手机号 + 密码登录
 */
export function loginApi(data: LoginPayload) {
	return client<AuthResult>({ url: "/v1/auth/login", method: "post", data });
}

/**
 * 获取当前用户信息（Bearer 鉴权）
 */
export function getMeApi() {
	return client<User>({ url: "/v1/auth/me", method: "get" });
}

/**
 * 刷新 access_token（依赖 refresh_token HttpOnly Cookie）
 */
export function refreshTokenApi() {
	return client<{ access_token: string }>({
		url: "/v1/auth/refresh",
		method: "post",
	});
}

/**
 * 退出登录（依赖 refresh_token Cookie）
 */
export function logoutApi() {
	return client({ url: "/v1/auth/logout", method: "post" });
}

/**
 * 发送短信验证码
 * 后端永远返成功（防号码枚举），具体投递失败由 verify 阶段暴露
 * @param data.scene - 'login'|'register'|'bind'|'reset_password'
 */
export function sendSmsCode(data: SmsSendPayload) {
	return client({ url: "/v1/auth/sms/send", method: "post", data });
}

/**
 * 手机号 + 验证码登录（未注册自动建号）
 */
export function smsLogin(data: SmsPayload) {
	return client<AuthResult>({
		url: "/v1/auth/sms/login",
		method: "post",
		data,
	});
}

/**
 * 已登录用户绑定手机号（不返新 token，仅返最新 UserProfile）
 */
export function smsBindPhone(data: SmsPayload) {
	return client<User>({ url: "/v1/auth/sms/bind", method: "post", data });
}

/**
 * 通过手机验证码重置 / 设置密码
 * 成功后后端清 refresh cookie，前端必须立刻 clearAccessToken 并跳登录页
 */
export function resetPassword(data: ResetPasswordPayload) {
	return client({ url: "/v1/auth/password/reset", method: "post", data });
}

/**
 * 取微信扫码 URL（含一次性 state，TTL 5min）
 * purpose=login 公开；purpose=bind 必须 Bearer
 */
export function getWechatQrcodeUrl(
	params: { purpose?: "login" | "bind" } = {},
) {
	return client<{ url: string; [key: string]: unknown }>({
		url: "/v1/auth/wechat/qrcode_url",
		method: "get",
		params: { purpose: params.purpose || "login" },
	});
}

/**
 * 微信扫码后第二段：绑手机号 + 验证码完成注册/登录
 * 1024 冲突时复用同一 bind_ticket，带 conflict_resolution="merge" 再调一次
 */
export function bindWechatPhone(data: WechatBindPhonePayload) {
	return client<AuthResult>({
		url: "/v1/auth/wechat/bind_phone",
		method: "post",
		data,
	});
}

/**
 * 已登录用户解绑微信（不动 token / 不动 refresh cookie）
 */
export function unbindWechat() {
	return client<User>({ url: "/v1/auth/wechat/unbind", method: "post" });
}
