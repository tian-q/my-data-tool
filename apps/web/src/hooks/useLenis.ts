"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

// Lenis smooth scroll wired to GSAP ScrollTrigger, ported from Vue `initLenis`.
// Driving lenis from gsap.ticker (and pushing ScrollTrigger.update on scroll)
// keeps the soul-screen pin in sync with the smoothed scroll position. All
// imperative work lives in the effect with a cleanup (React Compiler-safe).

export function useLenis() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		// Respect reduced-motion: skip smooth scroll. ScrollTrigger still works off
		// native scroll, so the soul screen keeps functioning.
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

		gsap.registerPlugin(ScrollTrigger);
		const lenis = new Lenis({
			duration: 1.1,
			easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
			smoothWheel: true,
		});

		// Start at the top on mount: with scrollRestoration disabled, also reset
		// Lenis's own position (a bare window.scrollTo is swallowed once Lenis runs).
		lenis.scrollTo(0, { immediate: true });

		lenis.on("scroll", ScrollTrigger.update);
		const raf = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(raf);
		gsap.ticker.lagSmoothing(0);

		return () => {
			gsap.ticker.remove(raf);
			lenis.off("scroll", ScrollTrigger.update);
			lenis.destroy();
		};
	}, []);
}
