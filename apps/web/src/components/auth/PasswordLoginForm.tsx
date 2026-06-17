"use client";
import { useState } from "react";
import { loginApi } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { TextField } from "./fields/TextField";
import {
	type ApplyAuthResult,
	type LoginMode,
	SubmitButton,
	WechatLoginCta,
} from "./shared";

interface Props {
	loading: boolean;
	setLoading: (v: boolean) => void;
	applyAuthResult: ApplyAuthResult;
	setMode: (m: LoginMode) => void;
	wechatDisabled: boolean;
	onEnterWechat: () => void;
}

export function PasswordLoginForm({
	loading,
	setLoading,
	applyAuthResult,
	setMode,
	wechatDisabled,
	onEnterWechat,
}: Props) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading) return;
		const u = username.trim();
		if (!u) {
			toast.warning("请输入账号");
			return;
		}
		if (!password.trim()) {
			toast.warning("请输入密码");
			return;
		}
		setLoading(true);
		try {
			const result = await loginApi({ username: u, password });
			applyAuthResult(result, "登录成功");
		} catch (err) {
			const error = err as ApiError;
			const code = error?.code;
			if (code === 1003) toast.error("用户名或密码错误");
			else if (code === 1004) toast.error("账号已被禁用");
			else if (code === 1009) toast.error("账号已被锁定");
			else if (code === 1019) {
				toast.warning("该账号未设置密码,正在切换到短信登录");
				setMode("login-sms");
			} else if (code === 1029) toast.error("登录失败次数过多,请稍后再试");
			else if (code === 1001)
				toast.error(error?.message || "参数错误,请检查输入");
			else toast.error(error?.message || "登录失败,请稍后重试");
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
				autoComplete="current-password"
			/>

			<div className="px-extra">
				<label className="px-checkbox">
					<input
						type="checkbox"
						className="px-checkbox__input"
						checked={remember}
						onChange={(e) => setRemember(e.target.checked)}
					/>
					<span className="px-checkbox__box" aria-hidden="true">
						<svg
							aria-hidden="true"
							viewBox="0 0 14 14"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M3 7.5l3 3 5-6" />
						</svg>
					</span>
					<span className="px-checkbox__text">7 天免登录</span>
				</label>
				<button
					type="button"
					className="px-link"
					onClick={() => setMode("reset-password")}
				>
					忘记密码？
				</button>
			</div>

			<SubmitButton loading={loading} text="登 录" />
			<WechatLoginCta disabled={wechatDisabled} onEnter={onEnterWechat} />
		</form>
	);
}
