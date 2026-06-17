"use client";
import { useState } from "react";
import { resetPassword } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/auth/useAuth";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import { type LoginMode, PHONE_REGEX, SubmitButton } from "./shared";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	setMode: (m: LoginMode) => void;
}

export function ResetPasswordForm({ loading, setLoading, setMode }: Props) {
	const { clearAuth } = useAuth();
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");

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
		if (
			!newPassword ||
			newPassword.length < 8 ||
			newPassword.length > 32 ||
			!/[A-Za-z]/.test(newPassword) ||
			!/\d/.test(newPassword)
		) {
			toast.warning("新密码 8-32 位，需含字母和数字");
			return;
		}
		setLoading(true);
		try {
			await resetPassword({ phone: p, code: c, new_password: newPassword });
			// Backend clears the refresh cookie on success; drop local auth and
			// send the user back to password login (Vue `handleSubmit` reset branch).
			clearAuth();
			toast.success("密码已重置,请用新密码登录");
			setMode("login-password");
		} catch (err) {
			const error = err as ApiError;
			const errCode = error?.code;
			if (errCode === 1004) toast.error("账号已被禁用");
			else if (errCode === 1015) toast.error("验证码错误或已过期");
			else if (errCode === 1020) toast.error("短信服务暂不可用,请稍后重试");
			else if (errCode === 1031) toast.error("密码重置过于频繁,请稍后再试");
			else if (errCode === 1001)
				toast.error(error?.message || "参数错误,请检查输入");
			else toast.error(error?.message || "密码重置失败,请稍后重试");
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
				scene="reset_password"
			/>
			<TextField
				id="px-new-password"
				label="新密码"
				type="password"
				value={newPassword}
				onChange={setNewPassword}
				maxLength={32}
				autoComplete="new-password"
			/>
			<p className="px-hint">新密码 8-32 位，需含字母和数字</p>
			<SubmitButton loading={loading} text="重置密码" />
			<div className="px-back">
				<button
					type="button"
					className="px-link"
					onClick={() => setMode("login-password")}
				>
					返回登录
				</button>
			</div>
		</form>
	);
}
