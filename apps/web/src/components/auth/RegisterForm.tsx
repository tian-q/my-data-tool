"use client";
import { useState } from "react";
import { z } from "zod";
import { registerApi } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import { type ApplyAuthResult, PHONE_REGEX, SubmitButton } from "./shared";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	applyAuthResult: ApplyAuthResult;
}

// Per the migration doc, register validation uses Zod (messages kept identical to
// the Vue `validateRegister`). The password≠username cross-field rule is checked
// separately after parsing (simpler than superRefine).
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
	phone: z.string().trim().regex(PHONE_REGEX, "请输入正确的手机号"),
	code: z
		.string()
		.trim()
		.regex(/^\d{4,8}$/, "请输入 4-8 位验证码"),
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
			const error = err as ApiError;
			const errCode = error?.code;
			if (errCode === 1002) toast.error("该账号已被占用");
			else if (errCode === 1015) toast.error("验证码错误或已过期");
			else if (errCode === 1017) toast.error("该手机号已被注册");
			else if (errCode === 1020) toast.error("短信服务暂不可用,请稍后重试");
			else if (errCode === 1030) toast.error("注册过于频繁,请稍后再试");
			else if (errCode === 1001)
				toast.error(error?.message || "注册信息不合法,请检查输入");
			else toast.error(error?.message || "注册失败,请稍后重试");
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
