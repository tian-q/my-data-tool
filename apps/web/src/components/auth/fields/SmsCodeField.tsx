"use client";
import { useState } from "react";
import { useCooldown } from "@/hooks/useCooldown";
import { sendSmsCode } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import type { SmsScene } from "@/types/auth";
import { PHONE_REGEX } from "../shared";

// Verification-code input + send button. Owns the send request, the 60s cooldown
// and the send-error toasts (Vue `handleSendCode` / `handleSmsSendError`).

interface SmsCodeFieldProps {
	value: string;
	onChange: (value: string) => void;
	/** Current phone — gates the send button and is the SMS target. */
	phone: string;
	scene: SmsScene;
}

export function SmsCodeField({
	value,
	onChange,
	phone,
	scene,
}: SmsCodeFieldProps) {
	const [focused, setFocused] = useState(false);
	const [sending, setSending] = useState(false);
	const cooldown = useCooldown();

	const active = focused || value.length > 0;
	const canSend = PHONE_REGEX.test(phone);
	const buttonText = sending
		? "发送中..."
		: cooldown.remaining > 0
			? `${cooldown.remaining} 秒后重发`
			: "发送验证码";

	const handleSend = async () => {
		if (sending || cooldown.remaining > 0) return;
		if (!PHONE_REGEX.test(phone)) {
			toast.warning("请输入正确的手机号");
			return;
		}
		setSending(true);
		try {
			await sendSmsCode({ phone, scene });
			toast.success("验证码已发送");
			cooldown.start(60);
		} catch (err) {
			const error = err as ApiError;
			const code = error?.code;
			if (code === 1016) {
				toast.warning(error?.message || "验证码发送过于频繁,请稍后再试");
			} else if (code === 1020) {
				toast.error("短信服务暂不可用,请稍后重试");
			} else if (code === 1001) {
				toast.warning(error?.message || "手机号或场景参数错误");
			} else {
				toast.error(error?.message || "验证码发送失败");
			}
		} finally {
			setSending(false);
		}
	};

	return (
		<div className={`px-field px-field--code${active ? " is-active" : ""}`}>
			<label className="px-field__label" htmlFor="px-code">
				验证码
			</label>
			<input
				id="px-code"
				className="px-field__input"
				type="text"
				value={value}
				maxLength={8}
				inputMode="numeric"
				autoComplete="one-time-code"
				onChange={(e) => onChange(e.target.value.trim())}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>
			<button
				type="button"
				className="px-field__code-btn"
				disabled={cooldown.remaining > 0 || sending || !canSend}
				onClick={handleSend}
			>
				{buttonText}
			</button>
			<span className="px-field__line" aria-hidden="true" />
		</div>
	);
}
