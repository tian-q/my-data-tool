"use client";
import { useState } from "react";
import { smsLogin } from "@/lib/api/auth";
import { type CodeToast, toastApiError } from "@/lib/http/errorMessages";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import { type ApplyAuthResult, SubmitButton, WechatLoginCta } from "./shared";
import { validatePhoneCode } from "./validation";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	applyAuthResult: ApplyAuthResult;
	wechatDisabled: boolean;
	onEnterWechat: () => void;
}

const SMS_LOGIN_ERRORS: Record<number, CodeToast> = {
	1004: { type: "error", message: "账号已被禁用" },
	1009: { type: "error", message: "账号已被锁定" },
	1015: { type: "error", message: "验证码错误或已过期" },
	1017: { type: "warning", message: "账号状态冲突,请稍后重试" },
	1020: { type: "error", message: "短信服务暂不可用,请稍后重试" },
	1001: {
		type: "error",
		message: "参数错误,请检查输入",
		preferServerMessage: true,
	},
};

export function SmsLoginForm({
	loading,
	setLoading,
	applyAuthResult,
	wechatDisabled,
	onEnterWechat,
}: Props) {
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading) return;
		const p = phone.trim();
		const c = code.trim();
		const invalid = validatePhoneCode(p, c);
		if (invalid) {
			toast.warning(invalid);
			return;
		}
		setLoading(true);
		try {
			const result = await smsLogin({ phone: p, code: c });
			applyAuthResult(result, "登录成功");
		} catch (err) {
			toastApiError(
				err as ApiError,
				SMS_LOGIN_ERRORS,
				"短信登录失败,请稍后重试",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="px-form" noValidate onSubmit={onSubmit}>
			<TextField
				id="px-phone"
				label="手机号"
				type="tel"
				value={phone}
				onChange={setPhone}
				maxLength={11}
				inputMode="numeric"
				autoComplete="tel"
				trim
				autoFocus
			/>
			<SmsCodeField
				value={code}
				onChange={setCode}
				phone={phone}
				scene="login"
			/>
			<SubmitButton loading={loading} text="验证码登录" />
			<WechatLoginCta disabled={wechatDisabled} onEnter={onEnterWechat} />
		</form>
	);
}
