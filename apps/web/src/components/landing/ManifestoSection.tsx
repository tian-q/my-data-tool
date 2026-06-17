"use client";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { PACE_KICKERS, PACE_WORDS, rhythms, rules } from "@/constants/landing";
import { ArrowRight } from "./Icons";

// §04 Manifesto: rhythm switcher (segment control + cross-fade cards) and the
// numbered bottom-lines list with a sticky counter that tracks scroll position.

// Render a rule string ("…<em>关键词</em>…") as React nodes (replaces Vue v-html).
function renderEm(html: string) {
	return html
		.split(/<\/?em>/)
		.map((part, i) => (i % 2 === 1 ? <em key={part}>{part}</em> : part));
}

export function ManifestoSection({ onOpenLogin }: { onOpenLogin: () => void }) {
	// §04.1 Pace
	const [activePace, setActivePace] = useState(0);
	const [indicator, setIndicator] = useState({
		left: 0,
		width: 0,
		ready: false,
	});
	const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

	const syncIndicator = useCallback(() => {
		const btn = navRefs.current[activePace];
		if (!btn) return;
		setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true });
	}, [activePace]);

	useLayoutEffect(() => {
		syncIndicator();
	}, [syncIndicator]);

	useEffect(() => {
		const onResize = () => syncIndicator();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [syncIndicator]);

	// §04.2 Vow — active line = last item whose top has crossed the 45% viewport
	// line. Recomputed on every scroll so it tracks *both* directions (Vue
	// initVow: onEnter sets i, onLeaveBack falls back to i-1). The earlier
	// one-way Math.max meant scrolling back up never un-highlighted.
	const [activeVow, setActiveVow] = useState(0);
	const vowRefs = useRef<(HTMLLIElement | null)[]>([]);

	useEffect(() => {
		let raf = 0;
		const compute = () => {
			raf = 0;
			const line = window.innerHeight * 0.45;
			let next = 0;
			vowRefs.current.forEach((node, i) => {
				if (node && node.getBoundingClientRect().top <= line) next = i;
			});
			setActiveVow(next);
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

	const vowNum = String(Math.max(activeVow + 1, 1)).padStart(2, "0");

	return (
		<section id="manifesto" className="tk-mf">
			<div className="tk-mf__rhythm">
				<header className="tk-mf__header">
					<h2 className="tk-mf__title" data-reveal>
						节奏你定。
					</h2>
					<p className="tk-mf__sub" data-reveal>
						三种节奏,随时切换。从慢到快,从稳到放。
					</p>
				</header>

				<div className="tk-pace" data-reveal>
					<div className="tk-pace__nav" role="tablist" aria-label="选择节奏">
						<span
							className="tk-pace__indicator"
							style={{
								transform: `translateX(${indicator.left}px)`,
								width: `${indicator.width}px`,
								opacity: indicator.ready ? 1 : 0,
							}}
							aria-hidden="true"
						/>
						{rhythms.map((r, i) => (
							<button
								key={r.tag}
								ref={(el) => {
									navRefs.current[i] = el;
								}}
								type="button"
								role="tab"
								aria-selected={activePace === i}
								className={`tk-pace__nav-btn${activePace === i ? " is-active" : ""}`}
								onClick={() => setActivePace(i)}
							>
								<span className="tk-pace__nav-num">0{i + 1}</span>
								<span className="tk-pace__nav-word">{PACE_WORDS[i]}</span>
							</button>
						))}
					</div>

					<div className="tk-pace__stage">
						{rhythms.map((r, i) => (
							<article
								key={r.tag}
								className={`tk-pace__card tk-pace__card--${r.tag}${activePace === i ? " is-active" : ""}`}
								aria-hidden={activePace !== i}
							>
								<div className="tk-pace__face">
									<div className="tk-pace__index" aria-hidden="true">
										<span className="tk-pace__index-cur">0{i + 1}</span>
										<span className="tk-pace__index-divider" />
										<span className="tk-pace__index-total">03</span>
									</div>
								</div>

								<div className="tk-pace__copy">
									<span className="tk-pace__kicker">{PACE_KICKERS[i]}</span>
									<h3 className="tk-pace__name">{r.name}</h3>
									<p className="tk-pace__desc">{r.desc}</p>
									<div className="tk-pace__divider" aria-hidden="true" />
									<p className="tk-pace__fit-cap">适合</p>
									<ul className="tk-pace__fit">
										{r.fit.map((f) => (
											<li key={f}>{f}</li>
										))}
									</ul>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>

			<div className="tk-mf__rules">
				<header className="tk-mf__header">
					<h2 className="tk-mf__title" data-reveal>
						底线我们守。
					</h2>
					<p className="tk-mf__sub" data-reveal>
						不管哪种节奏,有些事我们永远不做。
					</p>
				</header>

				<div className="tk-vow">
					<aside className="tk-vow__rail">
						<div className="tk-vow__counter">
							<span className="tk-vow__counter-num">{vowNum}</span>
							<span className="tk-vow__counter-meta">
								<span
									className="tk-vow__counter-line"
									style={
										{
											"--vow-progress":
												Math.max(activeVow + 1, 0) / rules.length,
										} as CSSProperties
									}
								>
									<span className="tk-vow__counter-fill" />
								</span>
								<span className="tk-vow__counter-total">
									{String(rules.length).padStart(2, "0")}
								</span>
							</span>
						</div>
						<p className="tk-vow__rail-cap">PROMISE</p>
					</aside>

					<ol className="tk-vow__list">
						{rules.map((r, i) => (
							<li
								// biome-ignore lint/suspicious/noArrayIndexKey: fixed static copy list, order never changes
								key={i}
								ref={(el) => {
									vowRefs.current[i] = el;
								}}
								className={`tk-vow__item${activeVow >= i ? " is-active" : ""}${activeVow === i ? " is-current" : ""}`}
							>
								<span className="tk-vow__num" aria-hidden="true">
									{String(i + 1).padStart(2, "0")}
								</span>
								<p className="tk-vow__text">{renderEm(r)}</p>
							</li>
						))}
					</ol>
				</div>
			</div>

			<div className="tk-mf__cta" id="cta">
				<p className="tk-mf__lead" data-reveal>
					特会写,
					<br />
					是把你已经攒好的想法, 真正用起来。
				</p>
				<button
					className="tk-btn tk-btn--xl"
					type="button"
					data-reveal
					onClick={onOpenLogin}
				>
					<span className="tk-btn__label">从一句话开始</span>
					<span className="tk-btn__icon tk-btn__icon--xl" aria-hidden="true">
						<ArrowRight />
					</span>
				</button>
			</div>
		</section>
	);
}
