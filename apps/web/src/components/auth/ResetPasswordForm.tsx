"use client";
import { useState } from "react";
import { resetPassword } from "@/lib/api/auth";
import { type CodeToast, toastApiError } from "@/lib/http/errorMessages";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/auth/useAuth";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import { type LoginMode, SubmitButton } from "./shared";
import { validateNewPassword, validatePhoneCode } from "./validation";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	setMode: (m: LoginMode) => void;
}

const RESET_ERRORS: Record<number, CodeToast> = {
	1004: { type: "error", message: "账号已被禁用" },
	1015: { type: "error", message: "验证码错误或已过期" },
	1020: { type: "error", message: "短信服务暂不可用,请稍后重试" },
	1031: { type: "error", message: "密码重置过于频繁,请稍后再试" },
	1001: {
		type: "error",
		message: "参数错误,请检查输入",
		preferServerMessage: true,
	},
};

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
		const invalid = validatePhoneCode(p, c) || validateNewPassword(newPassword);
		if (invalid) {
			toast.warning(invalid);
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
			toastApiError(err as ApiError, RESET_ERRORS, "密码重置失败,请稍后重试");
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
