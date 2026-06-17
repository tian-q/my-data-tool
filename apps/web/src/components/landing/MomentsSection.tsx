"use client";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { moments } from "@/constants/landing";
import { ArrowRight } from "./Icons";

// §03 Four moments. Activation tracks scroll position *both ways* (Vue
// initMoments: scrub on .tk-timeline, start "top 85%" → end "top 55%"). Mapping
// the timeline's top edge from 0.85vh→0.55vh to progress 0→1, then thresholding,
// means scrolling back up lowers progress and the cards re-hide — unlike a
// one-way IntersectionObserver. The axis fill is written imperatively to avoid a
// re-render every frame.

export function MomentsSection({ onOpenLogin }: { onOpenLogin: () => void }) {
	const [active, setActive] = useState<boolean[]>(() =>
		moments.map(() => false),
	);
	const timelineRef = useRef<HTMLDivElement | null>(null);
	const axisRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let raf = 0;
		const compute = () => {
			raf = 0;
			const tl = timelineRef.current;
			if (!tl) return;
			const vh = window.innerHeight;
			const top = tl.getBoundingClientRect().top;
			const p = Math.max(0, Math.min(1, (0.85 * vh - top) / (0.3 * vh)));
			const next = [p > 0.05, p > 0.22, p > 0.38, p > 0.55];
			setActive((prev) =>
				prev.length === next.length && prev.every((v, i) => v === next[i])
					? prev
					: next,
			);
			axisRef.current?.style.setProperty(
				"--axis-progress",
				String(Math.min(1, p / 0.6)),
			);
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(compute);
		};
		compute();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	return (
		<section id="moments" className="tk-moments">
			<header className="tk-moments__header">
				<h2 className="tk-moments__title" data-reveal>
					从想法到成品,
					<br />
					你会经过 4 个时刻
				</h2>
				<p className="tk-moments__sub" data-reveal>
					每个<em>时刻</em>、每种<em>文体</em>, 特会写都接得住
				</p>
			</header>

			<div className="tk-timeline" ref={timelineRef}>
				<div className="tk-timeline__axis" aria-hidden="true" ref={axisRef}>
					{moments.map((m, i) => (
						<span
							key={`node-${m.id}`}
							className={`tk-timeline__node${active[i] ? " is-active" : ""}`}
							style={{ "--i": i } as CSSProperties}
						/>
					))}
					<span
						className={`tk-timeline__arrow${active[3] ? " is-active" : ""}`}
						aria-hidden="true"
					>
						<svg
							aria-hidden="true"
							viewBox="0 0 14 10"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.2}
						>
							<path
								d="M1 5h12M9 1l4 4-4 4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</span>
				</div>

				<ol className="tk-timeline__list">
					{moments.map((m, i) => (
						<li
							key={m.id}
							className={`tk-moment${active[i] ? " is-active" : ""}`}
							style={{ "--i": i } as CSSProperties}
						>
							<span className="tk-moment__index">{m.id}</span>
							<h3 className="tk-moment__name">{m.name}</h3>
							<p className="tk-moment__state">{m.state}</p>
							<p className="tk-moment__product">{m.product}</p>
						</li>
					))}
				</ol>
			</div>

			<footer className="tk-moments__foot" data-reveal>
				<button
					className="tk-btn tk-btn--ghost"
					type="button"
					onClick={onOpenLogin}
				>
					<span className="tk-btn__label">试试看</span>
					<span className="tk-btn__icon" aria-hidden="true">
						<ArrowRight />
					</span>
				</button>
			</footer>
		</section>
	);
}
