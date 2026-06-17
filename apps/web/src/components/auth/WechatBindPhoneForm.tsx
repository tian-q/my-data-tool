"use client";
import { useState } from "react";
import { bindWechatPhone, getMeApi } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/auth/useAuth";
import { SmsCodeField } from "./fields/SmsCodeField";
import { TextField } from "./fields/TextField";
import {
	type ApplyAuthResult,
	PHONE_REGEX,
	SubmitButton,
	type WechatBindContext,
} from "./shared";

interface Props {
	context: WechatBindContext;
	loading: boolean;
	setLoading: (v: boolean) => void;
	applyAuthResult: ApplyAuthResult;
	onClose: () => void;
	onBackToWechatQr: () => void;
	setWechatDisabled: (v: boolean) => void;
}

interface MergeInfo {
	masked_phone: string;
	masked_nickname: string;
	has_password: boolean | null;
}

export function WechatBindPhoneForm({
	context,
	loading,
	setLoading,
	applyAuthResult,
	onClose,
	onBackToWechatQr,
	setWechatDisabled,
}: Props) {
	const { setUser } = useAuth();
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");
	const [mergeVisible, setMergeVisible] = useState(false);
	const [mergeSubmitting, setMergeSubmitting] = useState(false);
	const [mergeInfo, setMergeInfo] = useState<MergeInfo>({
		masked_phone: "",
		masked_nickname: "",
		has_password: null,
	});

	const handleBindError = async (error: ApiError) => {
		const errCode = error?.code;
		if (errCode === 1015) {
			toast.error("验证码错误或已过期");
			return;
		}
		if (errCode === 1017) {
			toast.warning("账号状态冲突,请稍后重试");
			return;
		}
		if (errCode === 1023) {
			toast.error("本次扫码会话已过期,请重新扫码");
			onBackToWechatQr();
			return;
		}
		if (errCode === 1024) {
			const conflict =
				(error?.data as { conflict?: Partial<MergeInfo> })?.conflict || {};
			setMergeInfo({
				masked_phone: conflict.masked_phone || "",
				masked_nickname: conflict.masked_nickname || "",
				has_password: conflict.has_password ?? null,
			});
			setMergeVisible(true);
			return;
		}
		if (errCode === 1025) {
			toast.error("该手机号已绑定其它微信,请使用对应微信扫码登录");
			return;
		}
		if (errCode === 1026) {
			try {
				const me = await getMeApi();
				if (me?.data) {
					setUser(me.data);
					toast.success("登录成功");
					onClose();
					return;
				}
			} catch {}
			toast.error("绑定冲突,请刷新后重试");
			return;
		}
		if (errCode === 1028) {
			setWechatDisabled(true);
			toast.error("微信登录暂未开通");
			return;
		}
		if (errCode === 1031) {
			toast.error("操作过于频繁,请稍后再试");
			return;
		}
		if (errCode === 1001) {
			toast.error(error?.message || "参数错误,请检查输入");
			return;
		}
		toast.error(error?.message || "微信绑定失败,请稍后重试");
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading) return;
		if (!context.ticket) {
			toast.error("本次扫码会话已失效,请回到扫码页重新扫码");
			return;
		}
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
			const result = await bindWechatPhone({
				bind_ticket: context.ticket,
				phone: p,
				code: c,
			});
			applyAuthResult(result, "登录成功");
		} catch (err) {
			await handleBindError(err as ApiError);
		} finally {
			setLoading(false);
		}
	};

	const confirmMerge = async () => {
		if (mergeSubmitting) return;
		if (!context.ticket) {
			toast.error("本次扫码会话已失效,请重新扫码");
			setMergeVisible(false);
			onBackToWechatQr();
			return;
		}
		setMergeSubmitting(true);
		try {
			const result = await bindWechatPhone({
				bind_ticket: context.ticket,
				phone: phone.trim(),
				code: code.trim(),
				conflict_resolution: "merge",
			});
			applyAuthResult(result, "已合并到现有账号并登录");
			setMergeVisible(false);
		} catch (err) {
			await handleBindError(err as ApiError);
		} finally {
			setMergeSubmitting(false);
		}
	};

	const cancelMerge = () => {
		setMergeVisible(false);
		setPhone("");
		setCode("");
	};

	return (
		<form className="px-form" noValidate onSubmit={onSubmit}>
			<div className="px-wxhello">
				<span className="px-wxhello__avatar">
					{context.avatar ? (
						// biome-ignore lint/performance/noImgElement: external WeChat avatar, not a static asset
						<img src={context.avatar} alt="" referrerPolicy="no-referrer" />
					) : (
						<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8.5 13.5c-2.7 0-4.93-1.66-5.4-3.84a.5.5 0 0 1 .7-.56l1.6.8a.5.5 0 0 0 .54-.06l1.4-1.16a.5.5 0 0 1 .58-.03l1.3.83a.5.5 0 0 0 .55-.01l1.36-.93a.5.5 0 0 1 .61.06l1.27 1.18a.5.5 0 0 0 .58.08l1.4-.81a.5.5 0 0 1 .69.62C13.6 11.94 11.27 13.5 8.5 13.5z" />
							<circle cx="6.5" cy="10" r="0.7" fill="#fff" />
							<circle cx="10.5" cy="10" r="0.7" fill="#fff" />
						</svg>
					)}
				</span>
				<div className="px-wxhello__text">
					<span className="px-wxhello__greet">通过微信继续</span>
					<span className="px-wxhello__name">
						{context.nickname || "微信用户"}
					</span>
				</div>
				<span className="px-wxhello__badge" aria-hidden="true">
					<svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">
						<path d="M6.5 11.5l-3-3 1.06-1.06L6.5 9.38l4.94-4.94L12.5 5.5z" />
					</svg>
				</span>
			</div>

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
				scene="bind"
			/>
			<p className="px-hint px-hint--wx">未注册的手机号将自动建号并完成登录</p>

			<SubmitButton loading={loading} text="完成绑定并登录" wx />

			<div className="px-back">
				<button type="button" className="px-link" onClick={onBackToWechatQr}>
					换个微信号
				</button>
			</div>

			{mergeVisible && (
				<div className="px-merge">
					<div className="px-merge__card" role="dialog" aria-modal="true">
						<div className="px-merge__icon" aria-hidden="true">
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.6}
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M7 7h10v10H7z" />
								<path d="M3 11l4-4 4 4M21 13l-4 4-4-4" />
							</svg>
						</div>
						<h3 className="px-merge__title">该手机号已注册过账号</h3>
						<p className="px-merge__desc">
							手机号 <strong>{mergeInfo.masked_phone || "——"}</strong>
							{mergeInfo.masked_nickname && (
								<>
									{" "}
									已绑定账号「<strong>{mergeInfo.masked_nickname}</strong>」
								</>
							)}
							。是否把本次微信绑定到该账号?
						</p>
						{mergeInfo.has_password === false && (
							<p className="px-merge__note">
								该账号尚未设密码,合并后建议在登录后设置密码。
							</p>
						)}
						<div className="px-merge__actions">
							<button
								type="button"
								className="px-merge__btn px-merge__btn--ghost"
								disabled={mergeSubmitting}
								onClick={cancelMerge}
							>
								换个手机号
							</button>
							<button
								type="button"
								className="px-merge__btn px-merge__btn--primary"
								disabled={mergeSubmitting}
								onClick={confirmMerge}
							>
								{mergeSubmitting ? "合并中…" : "合并到该账号"}
							</button>
						</div>
					</div>
				</div>
			)}
		</form>
	);
}
