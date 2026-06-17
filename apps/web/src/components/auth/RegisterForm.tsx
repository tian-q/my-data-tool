"use client";
import { useState } from "react";
import { z } from "zod";
import { registerApi } from "@/lib/api/auth";
import { type CodeToast, toastApiError } from "@/lib/http/errorMessages";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import { type ApplyAuthResult, PHONE_REGEX, SubmitButton } from "./shared";
import { phoneField, smsCodeField } from "./validation";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	applyAuthResult: ApplyAuthResult;
}

const REGISTER_ERRORS: Record<number, CodeToast> = {
	1002: { type: "error", message: "该账号已被占用" },
	1015: { type: "error", message: "验证码错误或已过期" },
	1017: { type: "error", message: "该手机号已被注册" },
	1020: { type: "error", message: "短信服务暂不可用,请稍后重试" },
	1030: { type: "error", message: "注册过于频繁,请稍后再试" },
	1001: {
		type: "error",
		message: "注册信息不合法,请检查输入",
		preferServerMessage: true,
	},
};

// Per the migration doc, register validation uses Zod (messages kept identical to
// the Vue `validateRegister`). Phone/code reuse the shared field validators; the
// password≠username cross-field rule is checked after parsing (simpler than superRefine).
const registerSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, "账号长度需为 3-50 位")
		.max(50, "账号长度需为 3-50 位")
		.refine((v) => !PHONE_REGEX.test(v), "账号不能是手机号格式"),
	password: z
		.string()
		.min(8, "密码长度需为 8-32 位")
		.max(32, "密码长度需为 8-32 位")
		.refine(
			(v) => /[A-Za-z]/.test(v) && /\d/.test(v),
			"密码必须同时包含字母和数字",
		),
	nickname: z.string().trim().max(50, "昵称最长 50 位"),
	phone: phoneField,
	code: smsCodeField,
});

export function RegisterForm({ loading, setLoading, applyAuthResult }: Props) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [nickname, setNickname] = useState("");
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading) return;
		const parsed = registerSchema.safeParse({
			username,
			password,
			nickname,
			phone,
			code,
		});
		if (!parsed.success) {
			toast.warning(parsed.error.issues[0]?.message || "注册信息不合法");
			return;
		}
		const data = parsed.data;
		if (data.password === data.username) {
			toast.warning("密码不能与账号相同");
			return;
		}
		setLoading(true);
		try {
			const result = await registerApi({
				username: data.username,
				password: data.password,
				phone: data.phone,
				code: data.code,
				nickname: data.nickname || undefined,
			});
			applyAuthResult(result, "注册成功");
		} catch (err) {
			toastApiError(err as ApiError, REGISTER_ERRORS, "注册失败,请稍后重试");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="px-form" noValidate onSubmit={onSubmit}>
			<TextField
				id="px-username"
				label="账号"
				value={username}
				onChange={setUsername}
				maxLength={50}
				autoComplete="username"
				trim
				autoFocus
			/>
			<TextField
				id="px-password"
				label="密码"
				type="password"
				value={password}
				onChange={setPassword}
				maxLength={32}
				autoComplete="new-password"
			/>
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
			/>
			<SmsCodeField
				value={code}
				onChange={setCode}
				phone={phone}
				scene="register"
			/>
			<TextField
				id="px-nickname"
				label="昵称（选填）"
				value={nickname}
				onChange={setNickname}
				maxLength={50}
				autoComplete="nickname"
				trim
			/>
			<p className="px-hint">密码 8-32 位，需含字母和数字</p>
			<SubmitButton loading={loading} text="创建账号" />
		</form>
	);
}
