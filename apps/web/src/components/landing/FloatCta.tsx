"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "./Icons";

// Bottom-right floating CTA, shown after scrolling past the hero, dismissible.

export function FloatCta({ onOpenLogin }: { onOpenLogin: () => void }) {
	const [visible, setVisible] = useState(false);
	const [closed, setClosed] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			setVisible(window.scrollY > window.innerHeight * 0.8);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	if (!visible || closed) return null;

	return (
		// biome-ignore lint/a11y/useSemanticElements: a nested close <button> prevents using a native <button> here
		<div
			className="tk-float"
			role="button"
			tabIndex={0}
			onClick={onOpenLogin}
			onKeyUp={(e) => {
				if (e.key === "Enter") onOpenLogin();
			}}
		>
			<span className="tk-float__label">试试看</span>
			<span className="tk-float__icon" aria-hidden="true">
				<ArrowRight />
			</span>
			<button
				type="button"
				className="tk-float__close"
				aria-label="关闭"
				onClick={(e) => {
					e.stopPropagation();
					setClosed(true);
				}}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
				</svg>
			</button>
		</div>
	);
}
