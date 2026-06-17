"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getWechatQrcodeUrl } from "@/lib/api/auth";
import type { ApiError } from "@/lib/http/types";
import type { LoginMode } from "./shared";

// Wechat scan-to-login panel, ported from `WechatQrCard.vue`. Loads a qrconnect
// URL into a sandboxed iframe, runs a 300s TTL countdown, and keeps a single
// loading layer until the iframe content settles (avoids flicker).

type QrState = "loading" | "ready" | "expired" | "error" | "unavailable";

const TTL_SECONDS = 300;
// qrconnect supports an `href` param pointing at a public HTTPS CSS that strips
// WeChat's default chrome, leaving a clean QR. Must be absolute HTTPS.
const QR_STYLE_HREF = "https://tehuixie.com/wechat-qr.css";

function withCustomStyle(rawUrl: string): string {
	if (!rawUrl || rawUrl.includes("href=")) return rawUrl;
	const hashIndex = rawUrl.indexOf("#");
	const base = hashIndex >= 0 ? rawUrl.slice(0, hashIndex) : rawUrl;
	const hash = hashIndex >= 0 ? rawUrl.slice(hashIndex) : "";
	const sep = base.includes("?") ? "&" : "?";
	return `${base}${sep}href=${encodeURIComponent(QR_STYLE_HREF)}${hash}`;
}

interface Props {
	onUnavailable: () => void;
	setMode: (m: LoginMode) => void;
}

export function WechatQrPanel({ onUnavailable, setMode }: Props) {
	const [state, setState] = useState<QrState>("loading");
	const [qrUrl, setQrUrl] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [remaining, setRemaining] = useState(0);
	const [frameReady, setFrameReady] = useState(false);

	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Keep onUnavailable in a ref so `load`/the mount effect don't re-subscribe
	// when the parent re-renders (LoginDialog re-renders on every parallax move).
	const onUnavailableRef = useRef(onUnavailable);
	onUnavailableRef.current = onUnavailable;

	const clearCountdown = useCallback(() => {
		if (countdownRef.current) {
			clearInterval(countdownRef.current);
			countdownRef.current = null;
		}
	}, []);

	const startCountdown = useCallback(() => {
		clearCountdown();
		setRemaining(TTL_SECONDS);
		countdownRef.current = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearCountdown();
					setState("expired");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	}, [clearCountdown]);

	const load = useCallback(async () => {
		setState("loading");
		setErrorMsg("");
		setQrUrl("");
		setFrameReady(false);
		if (settleRef.current) clearTimeout(settleRef.current);
		clearCountdown();
		try {
			const res = await getWechatQrcodeUrl({ purpose: "login" });
			const url = res?.data?.url;
			if (!url) {
				setState("error");
				setErrorMsg("返回数据缺少 URL");
				return;
			}
			setQrUrl(withCustomStyle(url));
			setState("ready");
			startCountdown();
		} catch (err) {
			const error = err as ApiError;
			const code = error?.code;
			if (code === 1028) {
				setState("unavailable");
				onUnavailableRef.current();
				return;
			}
			if (code === 1008 || code === 1005) {
				setState("error");
				setErrorMsg("请先登录后再绑定微信");
				return;
			}
			setState("error");
			setErrorMsg(error?.message || "加载失败");
		}
	}, [clearCountdown, startCountdown]);

	// Load once on mount; tear timers down on unmount.
	useEffect(() => {
		void load();
		return () => {
			clearCountdown();
			if (settleRef.current) clearTimeout(settleRef.current);
		};
	}, [load, clearCountdown]);

	const onFrameLoad = () => {
		if (state !== "ready" || frameReady) return;
		if (settleRef.current) clearTimeout(settleRef.current);
		settleRef.current = setTimeout(() => setFrameReady(true), 320);
	};

	const isPreparing = state === "loading" || (state === "ready" && !frameReady);

	let statusText = "正在准备扫码…";
	if (state === "unavailable") statusText = "微信登录暂未开通";
	else if (state === "error") statusText = "加载失败,请稍后再试";
	else if (state === "expired") statusText = "二维码已过期,请刷新";
	else if (!frameReady) statusText = "正在准备扫码…";
	else if (remaining <= 0) statusText = "请使用微信扫描二维码";
	else {
		const m = Math.floor(remaining / 60);
		const s = String(remaining % 60).padStart(2, "0");
		statusText = `请使用微信扫描 · ${m}:${s} 后过期`;
	}

	const alertIcon = (
		<div className="wxqr__alert-icon" aria-hidden="true">
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 8v5" strokeLinecap="round" />
				<circle cx="12" cy="16" r="0.8" fill="currentColor" />
			</svg>
		</div>
	);

	return (
		<div className="px-wxpane">
			<div className={`wxqr wxqr--login wxqr--state-${state}`}>
				<div className="wxqr__stage">
					{state === "unavailable" ? (
						<div className="wxqr__alert">
							{alertIcon}
							<p className="wxqr__alert-title">微信登录暂未开通</p>
							<p className="wxqr__alert-desc">
								请使用其它登录方式,或稍后再来。
							</p>
						</div>
					) : state === "error" ? (
						<div className="wxqr__alert">
							{alertIcon}
							<p className="wxqr__alert-title">二维码加载失败</p>
							<p className="wxqr__alert-desc">
								{errorMsg || "请检查网络后重试。"}
							</p>
							<button type="button" className="wxqr__retry-btn" onClick={load}>
								重新加载
							</button>
						</div>
					) : (
						<div className="wxqr__frame-wrap">
							{qrUrl && (
								// biome-ignore lint/a11y/useIframeTitle: WeChat qrconnect frame, title adds no value
								<iframe
									className={`wxqr__frame${frameReady ? " is-shown" : ""}`}
									src={qrUrl}
									sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation"
									scrolling="no"
									referrerPolicy="no-referrer"
									onLoad={onFrameLoad}
								/>
							)}
							{state === "expired" && (
								<div className="wxqr__expired">
									<div className="wxqr__expired-mask" />
									<div className="wxqr__expired-inner">
										<span className="wxqr__expired-icon" aria-hidden="true">
											<svg
												aria-hidden="true"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth={1.6}
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M21 12a9 9 0 1 1-3.5-7.1" />
												<path d="M21 4v5h-5" />
											</svg>
										</span>
										<p className="wxqr__expired-text">二维码已过期</p>
										<button
											type="button"
											className="wxqr__expired-btn"
											onClick={load}
										>
											点击刷新
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{isPreparing && (
						<div
							className="wxqr__skeleton"
							role="status"
							aria-label="二维码加载中"
						>
							<div className="wxqr__spinner" aria-hidden="true">
								<span />
								<span />
								<span />
								<span />
							</div>
							<p className="wxqr__skeleton-text">正在生成二维码…</p>
						</div>
					)}
				</div>

				<div
					className={`wxqr__status${state === "expired" ? " is-expired" : ""}`}
				>
					<span className="wxqr__brand-dot" aria-hidden="true" />
					<span className="wxqr__status-text">{statusText}</span>
				</div>
			</div>

			<div className="px-wxpane__back">
				<button
					type="button"
					className="px-link"
					onClick={() => setMode("login-password")}
				>
					使用其它方式登录
				</button>
			</div>
		</div>
	);
}
