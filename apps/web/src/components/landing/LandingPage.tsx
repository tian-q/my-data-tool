"use client";
import { useEffect, useRef, useState } from "react";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { useLenis } from "@/hooks/useLenis";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import "./landing.css";
import { FloatCta } from "./FloatCta";
import { HeroSection } from "./HeroSection";
import { ManifestoSection } from "./ManifestoSection";
import { MomentsSection } from "./MomentsSection";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";
import { SoulSection } from "./soul/SoulSection";

// Top-level landing composition: assembles every screen, mounts smooth scroll +
// reveal, and owns the login dialog. `openLogin` is the single CTA entry point
// (Vue `enter`). Per §0.3 it just opens the dialog — no router push; redirect /
// query-trigger handling lands in phase 6.

export function LandingPage() {
	const rootRef = useRef<HTMLDivElement>(null);
	const [loginOpen, setLoginOpen] = useState(false);
	const [navHidden, setNavHidden] = useState(false);
	const [redirectTo, setRedirectTo] = useState<string | null>(null);
	const openLogin = () => setLoginOpen(true);

	useLenis();
	useScrollReveal(rootRef);

	// Force the top on mount/refresh (belt-and-suspenders alongside the layout's
	// scrollRestoration='manual' and Lenis's own reset).
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	// Query triggers (Vue watch(route.query)): open the dialog on ?auth=1 /
	// ?login=1 / ?wechat_bind=1, capture a valid ?redirect (login success only
	// pushes there per §0.3), then strip the transient params from the URL.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const r = params.get("redirect");
		if (r && r.startsWith("/") && r !== "/") setRedirectTo(r);
		if (
			params.get("auth") === "1" ||
			params.get("login") === "1" ||
			params.get("wechat_bind") === "1"
		) {
			setLoginOpen(true);
		}
		if (
			params.has("auth") ||
			params.has("login") ||
			params.has("wechat_bind")
		) {
			params.delete("auth");
			params.delete("login");
			params.delete("wechat_bind");
			const qs = params.toString();
			window.history.replaceState(
				null,
				"",
				qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
			);
		}
	}, []);

	return (
		<div className="tk" ref={rootRef}>
			<div className="tk-grain" aria-hidden="true" />
			<SiteNav onOpenLogin={openLogin} hidden={navHidden} />
			<HeroSection onOpenLogin={openLogin} />
			<SoulSection onOpenLogin={openLogin} onActiveChange={setNavHidden} />
			<MomentsSection onOpenLogin={openLogin} />
			<ManifestoSection onOpenLogin={openLogin} />
			<SiteFooter />
			<FloatCta onOpenLogin={openLogin} />
			<LoginDialog
				open={loginOpen}
				onOpenChange={setLoginOpen}
				redirectTo={redirectTo}
			/>
		</div>
	);
}
