"use client";
import { ArrowRight } from "./Icons";

// §01 Hero. `data-reveal-hero` marks the host whose `[data-reveal]` children
// reveal on mount with a stagger (useScrollReveal); the rest reveal on scroll.

export function HeroSection({ onOpenLogin }: { onOpenLogin: () => void }) {
	return (
		<section id="hero" className="tk-hero" data-reveal-hero>
			<div className="tk-hero__ambient tk-hero__ambient--1" />
			<div className="tk-hero__ambient tk-hero__ambient--2" />
			<div className="tk-hero__grid-minimal" aria-hidden="true" />

			<div className="tk-hero__stage">
				<h1 className="tk-hero__title">
					<span className="tk-hero__line" data-reveal>
						把模糊的写作冲动,
					</span>
					<span className="tk-hero__line tk-hero__line--accent" data-reveal>
						理成完整的文章。
					</span>
				</h1>

				<p className="tk-hero__sub" data-reveal>
					因为会问，所以会写
				</p>

				<div className="tk-hero__cta" data-reveal>
					<button
						className="tk-btn tk-btn--primary"
						type="button"
						onClick={onOpenLogin}
					>
						<span className="tk-btn__label">从一句话开始</span>
						<span className="tk-btn__icon" aria-hidden="true">
							<ArrowRight />
						</span>
					</button>
				</div>

				<a className="tk-hero__scroll" href="#soul" data-reveal>
					<span className="tk-hero__scroll-line" />
					<span className="tk-hero__scroll-label" style={{ opacity: 0 }}>
						继续了解
					</span>
				</a>
			</div>
		</section>
	);
}
