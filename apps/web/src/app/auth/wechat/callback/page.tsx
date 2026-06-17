"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMeApi } from "@/lib/api/auth";
import { setAccessToken } from "@/lib/http/token";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/auth/useAuth";
import "./callback.css";

// 微信扫码回调页，1:1 移植自 Vue auth/wechatCallback.vue。
// 落点适配 §0.3：工作台/设置未迁，logged_in / bound 改落地到 "/"（原 /home、
// /home/settings）；need_bind_phone 仍回 "/?wechat_bind=1" 触发绑手机弹窗。

type VisualStatus = "pending" | "success" | "error";

const ERROR_COPY: Record<number, { title: string; desc: string }> = {
	1004: { title: "账号已被禁用", desc: "请联系管理员解除限制。" },
	1009: { title: "账号已被锁定", desc: "请联系管理员解除锁定。" },
	1021: { title: "二维码已过期", desc: "请回到登录页重新扫码。" },
	1022: { title: "微信登录失败", desc: "与微信服务器通讯异常,请稍后重试。" },
	1023: { title: "本次扫码会话已过期", desc: "请回到登录页重新扫码。" },
	1024: {
		title: "需要确认账号合并",
		desc: "请回到登录页重新扫码并按提示操作。",
	},
	1025: { title: "该手机号已绑定其它微信", desc: "请使用对应微信扫码登录。" },
	1026: { title: "该微信已绑定其它账号", desc: "请用绑定该微信的账号登录。" },
	1027: { title: "当前账号已绑微信", desc: "如需换绑请先在账号设置中解绑。" },
	1028: { title: "微信登录暂未开通", desc: "请改用其它方式登录。" },
	1030: { title: "操作过于频繁", desc: "请稍后再试。" },
};

export default function WechatCallbackPage() {
	const router = useRouter();
	const { setUser } = useAuth();
	const [status, setStatus] = useState<VisualStatus>("pending");
	const [title, setTitle] = useState("微信登录中…");
	const [desc, setDesc] = useState("正在确认你的身份,请稍候");
	const [autoRedirect, setAutoRedirect] = useState(true);

	useEffect(() => {
		// 二维码在登录弹窗 iframe 内加载微信 qrconnect（self_redirect），扫码后微信把
		// iframe 自身导航到本回调页。若只在 iframe 内跳转，顶层窗口会停在扫码弹窗上。
		// 先把同一回调 URL 顶到顶层窗口重载，后续逻辑全部跑在顶层。
		if (window.top && window.top !== window.self) {
			try {
				window.top.location.replace(window.location.href);
				return;
			} catch {
				// allow-top-navigation 理论放行；万一被拦，降级在当前窗口处理。
			}
		}

		const q = new URLSearchParams(window.location.search);
		const kind = q.get("status") || "";

		const fail = (t: string, d: string) => {
			setStatus("error");
			setAutoRedirect(false);
			setTitle(t);
			setDesc(d);
		};

		if (kind === "logged_in") {
			const token = q.get("access_token") || "";
			if (!token) {
				fail("登录失败", "未收到登录凭证,请重试。");
				return;
			}
			setAccessToken(token);
			(async () => {
				try {
					const me = await getMeApi();
					setUser(me?.data ?? null);
				} catch {}
				setStatus("success");
				setTitle("登录成功");
				setDesc("正在为你跳转…");
				toast.success("微信登录成功");
				setTimeout(() => router.replace("/workspace"), 600);
			})();
			return;
		}

		if (kind === "need_bind_phone") {
			const ticket = q.get("bind_ticket") || "";
			const nickname = q.get("wx_nickname") || "";
			const avatar = q.get("wx_avatar_url") || "";
			if (!ticket) {
				fail("登录失败", "未收到绑定凭证,请重新扫码。");
				return;
			}
			try {
				sessionStorage.setItem("wechat_bind_intent", "1");
				sessionStorage.setItem("wechat_bind_ticket", ticket);
				sessionStorage.setItem("wechat_bind_nickname", nickname);
				sessionStorage.setItem("wechat_bind_avatar", avatar);
			} catch {}
			setStatus("success");
			setTitle("扫码成功");
			setDesc("即将引导你绑定手机号…");
			setTimeout(() => router.replace("/?wechat_bind=1"), 600);
			return;
		}

		if (kind === "bound") {
			setStatus("success");
			setTitle("微信绑定成功");
			setDesc("正在返回…");
			toast.success("微信账号已绑定");
			setTimeout(() => router.replace("/workspace"), 600);
			return;
		}

		if (kind === "error") {
			const code = Number(q.get("code") || 0);
			const message = q.get("message") || "";
			const copy = ERROR_COPY[code] || {
				title: "微信登录失败",
				desc: message || "请稍后重试。",
			};
			fail(copy.title, copy.desc);
			return;
		}

		fail("未识别的回调", "请回到登录页重新扫码。");
	}, [router, setUser]);

	return (
		<div className="wxcb">
			<div className={`wxcb__card wxcb__card--${status}`}>
				<div className="wxcb__icon" aria-hidden="true">
					{status === "pending" ? (
						<span className="wxcb__spinner">
							<span />
							<span />
							<span />
							<span />
						</span>
					) : status === "success" ? (
						<svg
							aria-hidden="true"
							viewBox="0 0 32 32"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="16" cy="16" r="14" />
							<path d="M10 16l4 4 8-9" />
						</svg>
					) : (
						<svg
							aria-hidden="true"
							viewBox="0 0 32 32"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="16" cy="16" r="14" />
							<path d="M12 12l8 8M20 12l-8 8" />
						</svg>
					)}
				</div>

				<div className="wxcb__textblock">
					<h2 className="wxcb__title">{title}</h2>
					<p className="wxcb__desc">{desc}</p>
				</div>

				{!autoRedirect && (
					<div className="wxcb__actions">
						<button
							type="button"
							className="wxcb__btn"
							onClick={() => router.replace("/")}
						>
							返回首页
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
