"use client";
import { useEffect, useState } from "react";

// Top navigation. Condenses after scrolling past ~5% of the first viewport
// (Vue `initNav` ScrollTrigger). The hide-over-soul behaviour depends on the
// pinned soul screen and is deferred to phase 5.

export function SiteNav({
	onOpenLogin,
	hidden = false,
}: {
	onOpenLogin: () => void;
	/** Hidden while the soul screen is pinned (Vue navHidden). */
	hidden?: boolean;
}) {
	const [condensed, setCondensed] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			setCondensed(window.scrollY > window.innerHeight * 0.05);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={`tk-nav${condensed ? " is-condensed" : ""}${hidden ? " is-hidden" : ""}`}
		>
			<div className="tk-nav__inner">
				<a className="tk-nav__brand" href="#hero">
					{/* biome-ignore lint/performance/noImgElement: small static brand mark */}
					<img className="tk-nav__mark" src="/logo.svg" alt="特会写" />
					<span className="tk-nav__name">特会写</span>
				</a>
				<nav className="tk-nav__actions">
					<button className="tk-nav__link" type="button" onClick={onOpenLogin}>
						登录
					</button>
					<button className="tk-nav__cta" type="button" onClick={onOpenLogin}>
						<span>注册</span>
						<span className="tk-nav__cta-dot" />
					</button>
				</nav>
			</div>
		</header>
	);
}
