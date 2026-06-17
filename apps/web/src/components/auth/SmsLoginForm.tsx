"use client";
import { useState } from "react";
import { smsLogin } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import {
	type ApplyAuthResult,
	PHONE_REGEX,
	SubmitButton,
	WechatLoginCta,
} from "./shared";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	applyAuthResult: ApplyAuthResult;
	wechatDisabled: boolean;
	onEnterWechat: () => void;
}

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
		if (!PHONE_REGEX.test(p)) {
			toast.warning("请输入正确的手机号");
			return;
		}
		if (!/^\d{4,8}$/.test(c)) {
			toast.warning("请输入 4-8 位验证码");
			return;
		}
		setLoading(true);
		try {
			const result = await smsLogin({ phone: p, code: c });
			applyAuthResult(result, "登录成功");
		} catch (err) {
			const error = err as ApiError;
			const errCode = error?.code;
			if (errCode === 1004) toast.error("账号已被禁用");
			else if (errCode === 1009) toast.error("账号已被锁定");
			else if (errCode === 1015) toast.error("验证码错误或已过期");
			else if (errCode === 1017) toast.warning("账号状态冲突,请稍后重试");
			else if (errCode === 1020) toast.error("短信服务暂不可用,请稍后重试");
			else if (errCode === 1001)
				toast.error(error?.message || "参数错误,请检查输入");
			else toast.error(error?.message || "短信登录失败,请稍后重试");
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
