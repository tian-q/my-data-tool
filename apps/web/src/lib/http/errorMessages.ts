import type { ApiError } from "./types";

/**
 * Generic error code → Chinese fallback copy. Ported 1:1 from
 * `utils/errorMessage.js` (`GENERIC_ERROR_MESSAGES`). Business modules with a
 * more precise message for a given code should override it locally; this is the
 * global fallback used by `resolveGenericError` in `catch` blocks.
 *
 * Note: distinct from `ERROR_TOAST_MAP` in `types.ts` — that set is auto-toasted
 * by the interceptor; this set is looked up on demand by business code.
 */
export const GENERIC_ERROR_MESSAGES: Record<number, string> = {
	// 鉴权 - SMS / 登录·注册·密码重置限流
	1015: "验证码错误或已过期",
	1016: "短信获取过于频繁,请稍后再试",
	1019: "该手机号尚未设置密码",
	1029: "登录尝试过于频繁,请稍后再试",
	1030: "注册过于频繁,请稍后再试",
	1031: "密码重置过于频繁,请稍后再试",

	// 限流(chat / SMS / materials / images / writing 等多源共用)
	3001: "服务暂不可用,请稍后重试",
	3002: "上游服务异常,请稍后重试",
	3003: "操作过于频繁,请稍后再试",

	// folder / material 业务冲突
	3010: "文件夹不存在或已被删除",
	3011: "无权访问该文件夹",
	3017: "术语条目不存在",
	3018: "该术语名称已存在",
	3019: "文件夹层级不合法(深度超限或形成环)",
	3020: "父级文件夹已被删除,无法新建子项",
	3023: "同层级已存在同名文件夹",
	3024: "不支持的删除模式",
	3025: "移动文件夹需要先确认字段重算",
	3031: "不支持的文件类型",
	3032: "分析任务冲突,请稍后重试",
	3033: "分析任务冲突,请稍后重试",
	3034: "分析任务冲突,请稍后重试",
	3048: "搜索过于频繁,请稍后再试",

	// 二进制上传通用限制
	3046: "单次最多上传 10 个文件",
	3047: "总大小超过 100MB",

	// 回收站
	2031: "撤销已过期或已被使用",
	2032: "回收站类型参数非法",
	2033: "回收站中未找到该项",
	2034: "请输入「清空」二字以确认",

	// 跨 scope / 批量上限
	4053: "文档与素材不能跨区移动",
	4061: "批量操作每次最多 100 条",
};

/** Look up a friendly message for an error code, falling back to the raw message. */
export function resolveGenericError(
	error: Pick<ApiError, "code" | "message"> | null | undefined,
	fallback = "请求失败",
): string {
	const code = Number(error?.code);
	if (code && code in GENERIC_ERROR_MESSAGES) {
		return GENERIC_ERROR_MESSAGES[code];
	}
	return error?.message || fallback;
}
