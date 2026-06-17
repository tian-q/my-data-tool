"use client";
import { useRouter } from "next/navigation";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { setAccessToken } from "@/lib/http/token";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/auth/useAuth";
import "./loginDialog.css";
import { PasswordLoginForm } from "./PasswordLoginForm";
import { RegisterForm } from "./RegisterForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SmsLoginForm } from "./SmsLoginForm";
import type { ApplyAuthResult, LoginMode, WechatBindContext } from "./shared";
import { WechatBindPhoneForm } from "./WechatBindPhoneForm";
import { WechatQrPanel } from "./WechatQrPanel";

interface LoginDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** §0.3: on success, push here only if set (valid `?redirect`); else just close. */
	redirectTo?: string | null;
}

const TITLES: Record<LoginMode, { title: string; subtitle: string }> = {
	"login-password": { title: "欢迎回来", subtitle: "继续创作下一篇" },
	"login-sms": { title: "欢迎回来", subtitle: "继续创作下一篇" },
	register: { title: "创建账号", subtitle: "一分钟创建账号,开始写" },
	"reset-password": { title: "重置密码", subtitle: "通过手机验证码设置新密码" },
	"wechat-qr": {
		title: "微信扫码登录",
		subtitle: "打开微信「扫一扫」,即刻进入",
	},
	"wechat-bind-phone": {
		title: "绑定手机号",
		subtitle: "完成最后一步,绑定后即可登录",
	},
};

function readWechatBindFromSession(): WechatBindContext | null {
	try {
		if (sessionStorage.getItem("wechat_bind_intent") !== "1") return null;
		const ticket = sessionStorage.getItem("wechat_bind_ticket") || "";
		const nickname = sessionStorage.getItem("wechat_bind_nickname") || "";
		const avatar = sessionStorage.getItem("wechat_bind_avatar") || "";
		for (const k of [
			"wechat_bind_intent",
			"wechat_bind_ticket",
			"wechat_bind_nickname",
			"wechat_bind_avatar",
		]) {
			sessionStorage.removeItem(k);
		}
		if (!ticket) return null;
		return { ticket, nickname, avatar };
	} catch {
		return null;
	}
}

export function LoginDialog({
	open,
	onOpenChange,
	redirectTo,
}: LoginDialogProps) {
	const router = useRouter();
	const { setUser } = useAuth();
	const [mode, setModeState] = useState<LoginMode>("login-password");
	const [entered, setEntered] = useState(false);
	const [loading, setLoading] = useState(false);
	const [wechatDisabled, setWechatDisabled] = useState(false);
	const [bindContext, setBindContext] = useState<WechatBindContext | null>(
		null,
	);
	const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 });

	const cardRef = useRef<HTMLDivElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	// Height captured when a mode switch is requested (old content still on
	// screen), so the layout effect can ease body height from old → new.
	const pendingFromHeight = useRef<number | null>(null);
	const loadingRef = useRef(false);
	loadingRef.current = loading;

	const close = useCallback(() => onOpenChange(false), [onOpenChange]);

	const setMode = useCallback((m: LoginMode) => {
		// Snapshot current body height before the content swaps (smooth height).
		const el = bodyRef.current;
		if (el) pendingFromHeight.current = el.offsetHeight;
		// Leaving the bind flow drops its ticket/nickname/avatar (Vue clearWechatBindContext).
		if (m !== "wechat-bind-phone") setBindContext(null);
		setModeState(m);
	}, []);

	// Ease the dialog body height across mode changes (Vue smoothed this with its
	// per-field <transition>s; here one height tween covers any field-set swap).
	// Only runs when a switch was requested via setMode (pendingFromHeight set) —
	// the initial open is handled by the card's enter animation instead.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `mode` is the intended trigger — re-measure layout after the mode-driven content swap (it's read via the DOM, not lexically)
	useLayoutEffect(() => {
		const el = bodyRef.current;
		const from = pendingFromHeight.current;
		pendingFromHeight.current = null;
		if (!el || from == null) return;
		const to = el.offsetHeight;
		if (from === to) return;
		el.style.overflow = "hidden";
		el.style.height = `${from}px`;
		void el.offsetHeight; // force reflow so the next height starts a transition
		el.style.transition = "height 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
		el.style.height = `${to}px`;
		const onEnd = (e: TransitionEvent) => {
			if (e.propertyName !== "height") return;
			el.style.height = "";
			el.style.transition = "";
			el.style.overflow = "";
			el.removeEventListener("transitionend", onEnd);
		};
		el.addEventListener("transitionend", onEnd);
		return () => el.removeEventListener("transitionend", onEnd);
	}, [mode]);

	const applyAuthResult = useCallback<ApplyAuthResult>(
		(result, successText) => {
			const token = result?.data?.access_token;
			if (!token) {
				toast.error("操作成功,但未返回 access_token");
				return;
			}
			setAccessToken(token);
			setUser(result?.data?.user ?? null);
			toast.success(successText);
			close();
			// 登录成功跳工作台：默认去占位页 /workspace（将来迁 Vue 工作台）；
			// URL 带合法 ?redirect 时优先跳该地址。
			router.push(redirectTo || "/workspace");
		},
		[setUser, close, redirectTo, router],
	);

	const enterWechatQr = useCallback(() => {
		if (wechatDisabled) {
			toast.info("微信登录暂未开通");
			return;
		}
		setMode("wechat-qr");
	}, [wechatDisabled, setMode]);

	const resetTilt = useCallback(
		() => setTilt({ x: 0, y: 0, gx: 50, gy: 50 }),
		[],
	);

	const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const card = cardRef.current;
		if (!card) return;
		const rect = card.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		setTilt({
			y: (x - 0.5) * 12,
			x: (0.5 - y) * 10,
			gx: x * 100,
			gy: y * 100,
		});
	};

	// Open lifecycle: reset state, read a pending wechat-bind intent, lock scroll,
	// wire ESC-to-close, and run the entrance after first paint. Mirrors the Vue
	// `watch(modelValue)` block.
	useEffect(() => {
		if (!open) return;
		setModeState("login-password");
		setWechatDisabled(false);
		setLoading(false);
		resetTilt();
		setEntered(false);

		const ctx = readWechatBindFromSession();
		if (ctx) {
			setBindContext(ctx);
			setModeState("wechat-bind-phone");
		} else {
			setBindContext(null);
		}

		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !loadingRef.current) onOpenChange(false);
		};
		document.addEventListener("keydown", onKey);
		const raf = requestAnimationFrame(() => setEntered(true));

		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
			cancelAnimationFrame(raf);
		};
	}, [open, onOpenChange, resetTilt]);

	if (!open) return null;

	const showTabs =
		mode === "login-password" || mode === "login-sms" || mode === "register";
	const tabIndex = mode === "login-sms" ? 1 : mode === "register" ? 2 : 0;
	const { title, subtitle } = TITLES[mode];

	const cardStyle: CSSProperties = entered
		? ({
				transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
				"--gloss-x": `${tilt.gx}%`,
				"--gloss-y": `${tilt.gy}%`,
			} as CSSProperties)
		: {};

	return (
		<div className="px-mask">
			<div
				ref={cardRef}
				className={`px-card${entered ? " is-enter" : ""} px-card--${mode}`}
				style={cardStyle}
				role="dialog"
				aria-modal="true"
				aria-label="登录到 特会写"
				onMouseMove={onMove}
				onMouseLeave={resetTilt}
			>
				<span className="px-deep-text" aria-hidden="true">
					特会写
				</span>

				<button
					type="button"
					className="px-close"
					aria-label="关闭"
					disabled={loading}
					onClick={() => !loading && onOpenChange(false)}
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.6}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>

				<header className="px-brand">
					{/* biome-ignore lint/performance/noImgElement: small static brand mark, next/image adds no value here */}
					<img
						className="px-brand__mark"
						src="/logo.svg"
						alt=""
						aria-hidden="true"
					/>
					<span className="px-brand__name">特会写</span>
				</header>

				<div className="px-titleblock" key={mode}>
					<h2 className="px-title">{title}</h2>
					<p className="px-subtitle">{subtitle}</p>
				</div>

				<div className="px-body" ref={bodyRef}>
					{showTabs && (
						<div className="px-tabs px-tabs--three">
							<span
								className="px-tabs__pill"
								style={{ transform: `translateX(${tabIndex * 100}%)` }}
								aria-hidden="true"
							/>
							<button
								type="button"
								className={`px-tab${mode === "login-password" ? " is-active" : ""}`}
								onClick={() => setMode("login-password")}
							>
								密码登录
							</button>
							<button
								type="button"
								className={`px-tab${mode === "login-sms" ? " is-active" : ""}`}
								onClick={() => setMode("login-sms")}
							>
								短信登录
							</button>
							<button
								type="button"
								className={`px-tab${mode === "register" ? " is-active" : ""}`}
								onClick={() => setMode("register")}
							>
								注册
							</button>
						</div>
					)}

					{mode === "login-password" && (
						<PasswordLoginForm
							loading={loading}
							setLoading={setLoading}
							applyAuthResult={applyAuthResult}
							setMode={setMode}
							wechatDisabled={wechatDisabled}
							onEnterWechat={enterWechatQr}
						/>
					)}
					{mode === "login-sms" && (
						<SmsLoginForm
							loading={loading}
							setLoading={setLoading}
							applyAuthResult={applyAuthResult}
							wechatDisabled={wechatDisabled}
							onEnterWechat={enterWechatQr}
						/>
					)}
					{mode === "register" && (
						<RegisterForm
							loading={loading}
							setLoading={setLoading}
							applyAuthResult={applyAuthResult}
						/>
					)}
					{mode === "reset-password" && (
						<ResetPasswordForm
							loading={loading}
							setLoading={setLoading}
							setMode={setMode}
						/>
					)}
					{mode === "wechat-bind-phone" && bindContext && (
						<WechatBindPhoneForm
							context={bindContext}
							loading={loading}
							setLoading={setLoading}
							applyAuthResult={applyAuthResult}
							onClose={close}
							onBackToWechatQr={() => setMode("wechat-qr")}
							setWechatDisabled={setWechatDisabled}
						/>
					)}
					{mode === "wechat-qr" && (
						<WechatQrPanel
							onUnavailable={() => setWechatDisabled(true)}
							setMode={setMode}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
