"use client";
import { useEffect } from "react";

// Entrance reveal for `[data-reveal]` elements, ported from Vue `initReveal`.
// Uses IntersectionObserver instead of GSAP/ScrollTrigger: lighter, no extra dep,
// and the blur/translate transition lives in CSS (see below). Hero elements
// (inside `[data-reveal-hero]`) reveal immediately with a small stagger.

const BASE_STYLE = "opacity:0;transform:translateY(40px);filter:blur(8px);";
const REVEAL_STYLE =
	"opacity:1;transform:none;filter:blur(0px);transition:opacity 1.2s cubic-bezier(0.16,1,0.3,1),transform 1.2s cubic-bezier(0.16,1,0.3,1),filter 1.2s cubic-bezier(0.16,1,0.3,1);";

export function useScrollReveal(rootRef: React.RefObject<HTMLElement | null>) {
	useEffect(() => {
		const root = rootRef.current;
		if (!root || typeof window === "undefined") return;

		const reduce = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches;
		const nodes = Array.from(
			root.querySelectorAll<HTMLElement>("[data-reveal]"),
		);

		if (reduce) {
			// No motion: just make everything visible.
			for (const el of nodes) el.style.cssText = "";
			return;
		}

		const reveal = (el: HTMLElement) => {
			el.style.cssText = REVEAL_STYLE;
		};

		// Hero nodes reveal on mount with a stagger (Vue gsap.to with stagger 0.15).
		const heroHost = root.querySelector("[data-reveal-hero]");
		const heroNodes = nodes.filter((el) => heroHost?.contains(el));
		const restNodes = nodes.filter((el) => !heroHost?.contains(el));

		for (const el of nodes) el.style.cssText = BASE_STYLE;

		const timers: ReturnType<typeof setTimeout>[] = [];
		heroNodes.forEach((el, i) => {
			timers.push(setTimeout(() => reveal(el), 200 + i * 150));
		});

		const observer = new IntersectionObserver(
			(entries, obs) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						reveal(entry.target as HTMLElement);
						obs.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: "0px 0px -15% 0px" },
		);
		for (const el of restNodes) observer.observe(el);

		return () => {
			observer.disconnect();
			for (const t of timers) clearTimeout(t);
		};
		// rootRef is a stable ref object; run once on mount.
	}, [rootRef]);
}
