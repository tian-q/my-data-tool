"use client";
// React Compiler off for this subtree: it is heavy imperative GSAP/ScrollTrigger
// + ref DOM manipulation; the compiler's auto-memoization must not interfere.
"use no memo";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { P_TEXTS, TITLE_TEXT } from "@/constants/landing";
import { clamp, curve, eo, R, setBeamWindow, sub } from "./soulTimeline";

// §02 灵魂屏 —— 滚动进度驱动的三栏协作叙事 + SVG 光束。1:1 移植自 index.vue 的
// initSoul：pin 住整屏，把滚动映射成 progress 0→1，逐帧驱动卡片/对话/打字/光束。

interface Props {
	onOpenLogin: () => void;
	/** soul 屏 pin 期间隐藏顶栏（对应 Vue initNav 的 navHidden）。 */
	onActiveChange?: (active: boolean) => void;
}

export function SoulSection({ onOpenLogin, onActiveChange }: Props) {
	const sectionRef = useRef<HTMLElement | null>(null);
	const stickyRef = useRef<HTMLDivElement | null>(null);
	const stageRef = useRef<HTMLDivElement | null>(null);
	const svgRef = useRef<SVGSVGElement | null>(null);
	const el = useRef<Record<string, HTMLElement | null>>({});
	const beams = useRef<Record<string, SVGPathElement | null>>({});
	const outRows = useRef<(HTMLElement | null)[]>([]);
	const docParas = useRef<(HTMLElement | null)[]>([]);
	const docTexts = useRef<(HTMLElement | null)[]>([]);
	const waveMarks = useRef<(HTMLElement | null)[]>([]);

	const onActiveRef = useRef(onActiveChange);
	onActiveRef.current = onActiveChange;

	useEffect(() => {
		gsap.registerPlugin(ScrollTrigger);
		const section = sectionRef.current;
		const sticky = stickyRef.current;
		const stage = stageRef.current;
		if (!section || !sticky || !stage) return;
		const E = el.current;
		const B = beams.current;

		const showChat = (node: HTMLElement | null, t: number) => {
			if (!node) return;
			if (t <= 0) {
				node.style.display = "none";
				node.style.opacity = "0";
			} else {
				node.style.display = "";
				node.style.transform = `translateY(${16 * (1 - eo(t))}px)`;
				node.style.opacity = String(eo(t));
			}
		};
		const showCard = (node: HTMLElement | null, t: number) => {
			if (!node) return;
			node.style.transform = `translateY(${16 * (1 - eo(t))}px)`;
			node.style.opacity = String(Math.max(0, eo(t)));
		};
		const textCache = new WeakMap<HTMLElement, boolean>();
		const setFill = (
			node: HTMLElement | null,
			text: string,
			shouldShow: boolean,
		) => {
			if (!node) return;
			const current = textCache.get(node) || false;
			if (current !== shouldShow) {
				node.textContent = shouldShow ? text : "";
				textCache.set(node, shouldShow);
			}
		};
		const setText = (node: HTMLElement | null, fullText: string, t: number) => {
			if (!node) return;
			node.textContent = fullText.slice(0, Math.floor(fullText.length * t));
		};

		let leftScroll = 0;
		let chatScroll = 0;
		let rightScroll = 0;

		const recomputeBeamPaths = () => {
			if (!stageRef.current || !svgRef.current) return;
			const stageRect = stageRef.current.getBoundingClientRect();
			svgRef.current.setAttribute(
				"viewBox",
				`0 0 ${stageRect.width} ${stageRect.height}`,
			);
			const getPos = (node: HTMLElement | null, isRightSide = false) => {
				if (!node) return null;
				const r = node.getBoundingClientRect();
				if (r.width === 0 && r.height === 0) return null;
				return {
					x: isRightSide ? r.right - stageRect.left : r.left - stageRect.left,
					y: r.top - stageRect.top + r.height / 2,
				};
			};
			const drawBeam = (
				path: SVGPathElement | null,
				start: { x: number; y: number } | null,
				end: { x: number; y: number } | null,
			) => {
				if (!path || !start || !end) return;
				path.setAttribute("d", curve(start.x, start.y, end.x, end.y));
			};

			if (E.ch_step3 && E.c_goal && E.c_view) {
				const s = getPos(E.ch_step3, false);
				const eg = getPos(E.c_goal, true);
				const ev = getPos(E.c_view, true);
				if (s && eg && ev) {
					s.x += 80;
					drawBeam(B.beam1, s, {
						x: (eg.x + ev.x) / 2 - 6,
						y: (eg.y + ev.y) / 2,
					});
				}
			}
			if (E.ch_step4 && E.c_outline) {
				const s = getPos(E.ch_step4, false);
				const e = getPos(E.c_outline, true);
				if (s && e) {
					s.x += 80;
					e.x -= 6;
					drawBeam(B.beam3, s, e);
				}
			}
			if (E.ch_step5b && E.docTitle) {
				const s = getPos(E.ch_step5b, true);
				const e = getPos(E.docTitle, false);
				if (s && e) {
					s.x -= 80;
					e.x += 6;
					e.y += 24;
					drawBeam(B.beam4, s, e);
				}
			}
			if (E.ch_step8 && E.c_review) {
				const s = getPos(E.ch_step8, false);
				const e = getPos(E.c_review, true);
				if (s && e) {
					s.x += 80;
					e.x -= 6;
					drawBeam(B.beam5, s, e);
				}
			}
			if (E.c_review && docParas.current[2]) {
				const s = getPos(E.c_review, true);
				const e = getPos(docParas.current[2], false);
				if (s && e) {
					s.x -= 20;
					e.x += 6;
					drawBeam(B.beam6, s, e);
				}
			}
			for (const b of [B.beam1, B.beam3, B.beam4, B.beam5, B.beam6]) {
				if (b) b.dataset.inited = "";
			}
		};

		const toggle = (node: HTMLElement | null, cls: string, on: boolean) => {
			node?.classList.toggle(cls, on);
		};
		const setDot = (opt: HTMLElement | null, done: boolean) => {
			const dot = opt?.querySelector(".tk-dot");
			if (dot)
				dot.className = done ? "tk-dot tk-dot--done" : "tk-dot tk-dot--todo";
		};

		const onUpdate = (self: { progress: number }) => {
			const p = self.progress;
			showCard(E.c_bg, sub(p, R.s1_user[0], R.s1_user[1]));
			const land3 = sub(p, R.s3_land[0], R.s3_land[1]);
			showCard(E.c_goal, land3);
			showCard(E.c_view, land3);
			toggle(E.c_goal, "is-hit-soft", p >= R.s3_land[0] && p < R.s4o_ask[0]);
			setFill(
				E.c_goal_text,
				"按焦虑角度拆 — 「要不要学编程」的 3 种恐惧",
				p >= R.s3_land[0],
			);
			const land4 = sub(p, R.s4_land[0], R.s4_land[1]);
			showCard(E.c_outline, land4);
			toggle(
				E.c_outline,
				"is-hit-strong",
				p >= R.s4_land[0] && p < R.s5_to_right[0],
			);
			const land8 = sub(p, R.s8_land[0], R.s8_land[1]);
			showCard(E.c_review, land8);
			toggle(
				E.c_review,
				"is-hit-soft",
				p >= R.s8_land[0] && p < R.s8_to_right[0],
			);

			showChat(E.ch_step1, sub(p, R.s1_user[0], R.s1_user[1]));
			showChat(E.ch_step2, sub(p, R.s2_ask[0], R.s2_ask[1]));
			toggle(E.ch_step2, "is-folded", p >= R.s2_fold[0]);
			toggle(E.ch_s2_optB, "is-pick", p >= R.s2_pick[0]);
			setDot(E.ch_s2_optB, p >= R.s2_pick[0]);
			showChat(E.ch_step2b, sub(p, R.s2_fold[0], R.s2_fold[1]));
			showChat(E.ch_step3, sub(p, R.s3_settle[0], R.s3_settle[1]));
			setText(
				E.ch_s3_text,
				"按焦虑角度拆 — 「要不要学编程」的 3 种恐惧",
				sub(p, R.s3_settle[0], R.s3_settle[1]),
			);
			showChat(E.ch_step4o, sub(p, R.s4o_ask[0], R.s4o_ask[1]));
			toggle(E.ch_step4o, "is-folded", p >= R.s4o_fold[0]);
			toggle(E.ch_s4o_opt1, "is-pick", p >= R.s4o_pick[0]);
			setDot(E.ch_s4o_opt1, p >= R.s4o_pick[0]);
			showChat(E.ch_step4b, sub(p, R.s4o_fold[0], R.s4o_fold[1]));
			showChat(E.ch_step4, sub(p, R.s4_outline[0], R.s4_outline[1]));
			showChat(E.ch_step5, sub(p, R.s4_outline[0], R.s4_outline[1]));
			showChat(E.ch_step5t, sub(p, R.s5t_ask[0], R.s5t_ask[1]));
			toggle(E.ch_step5t, "is-folded", p >= R.s5t_fold[0]);
			toggle(E.ch_s5t_opt1, "is-pick", p >= R.s5t_pick[0]);
			setDot(E.ch_s5t_opt1, p >= R.s5t_pick[0]);
			showChat(E.ch_step5b, sub(p, R.s5t_fold[0], R.s5t_fold[1]));
			showChat(E.ch_step6, sub(p, R.s5t_fold[0], R.s5t_fold[1]));
			toggle(E.ch_step6, "is-folded", p >= R.s7_ask[0]);
			showChat(E.ch_step7, sub(p, R.s7_ask[0], R.s7_ask[1]));
			toggle(E.ch_step7, "is-folded", p >= R.s7_fold[0]);
			toggle(E.ch_s7_opt1, "is-pick", p >= R.s7_pick[0]);
			setDot(E.ch_s7_opt1, p >= R.s7_pick[0]);
			showChat(E.ch_step7b, sub(p, R.s7_fold[0], R.s7_fold[1]));
			showChat(E.ch_step8, sub(p, R.s7_fold[0], R.s7_fold[1]));

			const t6 = sub(p, R.s6_write[0], R.s6_write[1]);
			let currentWordCount = 0;
			const tTitle = clamp(t6 * 10, 0, 1);
			setText(E.docTitle, TITLE_TEXT, tTitle);
			if (E.cursorTitle)
				E.cursorTitle.style.display =
					tTitle > 0 && tTitle < 1 ? "inline-block" : "none";
			currentWordCount += Math.floor(TITLE_TEXT.length * tTitle);
			let activeStep = 0;
			for (let i = 0; i < 5; i++) {
				const pLocal = sub(t6, i / 5, (i + 1) / 5);
				const typeProg = clamp(pLocal / 0.75, 0, 1);
				setText(docTexts.current[i], P_TEXTS[i], typeProg);
				currentWordCount += Math.floor(P_TEXTS[i].length * typeProg);
				const para = docParas.current[i];
				if (para) {
					const isShown = pLocal > 0;
					const isActive = pLocal > 0 && pLocal < 0.95;
					const isDone = pLocal >= 0.95;
					para.style.display = isShown ? "" : "none";
					para.className =
						"tk-doc__para" +
						(isShown ? " is-shown" : "") +
						(isActive ? " is-active" : "") +
						(isDone ? " is-done" : "");
					if (isActive) activeStep = i + 1;
				}
				const row = outRows.current[i];
				if (row) {
					const dot = row.querySelector(".tk-dot");
					if (dot) {
						if (pLocal >= 0.95) dot.className = "tk-dot tk-dot--done";
						else if (pLocal > 0) {
							dot.className = "tk-dot tk-dot--half";
							row.classList.add("is-live");
						} else {
							dot.className = "tk-dot tk-dot--todo";
							row.classList.remove("is-live");
						}
					}
				}
			}
			if (E.writeStep)
				E.writeStep.textContent = String(Math.max(1, activeStep));
			if (E.wordCount) E.wordCount.textContent = String(currentWordCount);

			setBeamWindow(B.beam1, p, R.s3_beam[0], R.s3_beam[1]);
			setBeamWindow(B.beam3, p, R.s4_beam[0], R.s4_beam[1]);
			setBeamWindow(B.beam4, p, R.s5_to_right[0], R.s5_to_right[1]);
			setBeamWindow(B.beam5, p, R.s8_beam[0], R.s8_beam[1]);
			setBeamWindow(B.beam6, p, R.s8_to_right[0], R.s8_to_right[1]);
			const tMarks = sub(p, R.s8_marks[0], R.s8_marks[1]);
			for (const w of waveMarks.current) {
				if (w) w.style.opacity = String(eo(tMarks));
			}
			toggle(
				E.cta,
				"is-show",
				p >= R.s8_marks[0] + 0.4 * (R.s8_marks[1] - R.s8_marks[0]),
			);
			recomputeBeamPaths();
		};

		const renderTick = () => {
			let needsRecompute = false;
			const lerpToBottom = (
				node: HTMLElement | null,
				cur: number,
				k: number,
			): number => {
				if (!node) return cur;
				const target = Math.max(0, node.scrollHeight - node.clientHeight);
				const next = cur + (target - cur) * k;
				if (Math.abs(target - cur) > 0.5) {
					node.scrollTop = next;
					needsRecompute = true;
				}
				return next;
			};
			leftScroll = lerpToBottom(E.leftViewport, leftScroll, 0.12);
			chatScroll = lerpToBottom(E.chatViewport, chatScroll, 0.15);
			rightScroll = lerpToBottom(E.rightViewport, rightScroll, 0.12);
			if (needsRecompute) recomputeBeamPaths();
		};

		gsap.ticker.add(renderTick);

		// 预入场：section 顶从视口 85% → 顶部，期间整三栏 opacity 0→1，与 pin 起点衔接。
		const fade = gsap.fromTo(
			stage,
			{ opacity: 0 },
			{
				opacity: 1,
				ease: "none",
				scrollTrigger: {
					trigger: section,
					start: "top 85%",
					end: "top top",
					scrub: true,
					invalidateOnRefresh: true,
				},
			},
		);

		const pin = ScrollTrigger.create({
			trigger: section,
			start: "top top",
			end: () => `+=${window.innerHeight * 5.6}`,
			pin: sticky,
			pinSpacing: true,
			scrub: 0.3,
			invalidateOnRefresh: true,
			onUpdate,
		});

		// Nav hide is a *separate* trigger (Vue initNav), not the pin's onToggle:
		// start "top top+=300" fires ~300px before the pin engages — i.e. just as
		// the three columns approach — so the nav hides in time rather than after
		// the fade-in already revealed them. The four callbacks keep it symmetric
		// both directions; the end offset +300 must match the start +=300.
		const navTrigger = ScrollTrigger.create({
			trigger: section,
			start: "top top+=300",
			end: () => `+=${window.innerHeight * 5.6 + 300}`,
			invalidateOnRefresh: true,
			onEnter: () => onActiveRef.current?.(true),
			onLeave: () => onActiveRef.current?.(false),
			onEnterBack: () => onActiveRef.current?.(true),
			onLeaveBack: () => onActiveRef.current?.(false),
		});

		const initTimer = setTimeout(() => onUpdate({ progress: 0 }), 10);
		const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);

		let resizeTimer: ReturnType<typeof setTimeout> | null = null;
		const onResize = () => {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(recomputeBeamPaths, 120);
		};
		window.addEventListener("resize", onResize);

		return () => {
			gsap.ticker.remove(renderTick);
			window.removeEventListener("resize", onResize);
			if (resizeTimer) clearTimeout(resizeTimer);
			clearTimeout(initTimer);
			clearTimeout(refreshTimer);
			pin.kill();
			navTrigger.kill();
			fade?.scrollTrigger?.kill();
			fade?.kill();
		};
	}, []);

	return (
		<section id="soul" className="tk-soul tk-soul--beam" ref={sectionRef}>
			<div className="tk-soul__sticky" ref={stickyRef}>
				<div className="tk-soul__stage" ref={stageRef}>
					<div className="tk-tri">
						{/* 左栏：长期记忆 */}
						<article className="tk-tri__col tk-tri__shell">
							<div className="tk-col-header">
								<span className="tk-dot tk-dot--half" />
								<span>长期记忆</span>
							</div>
							<div className="tk-mask-wrapper">
								<div
									className="tk-scroll-view tk-col-body--left"
									ref={(n) => {
										el.current.leftViewport = n;
									}}
								>
									<div
										className="tk-card"
										ref={(n) => {
											el.current.c_bg = n;
										}}
									>
										<div className="tk-card__tag"># 写作背景</div>
										<div className="tk-card__fill">
											公众号长文 · AI 时代要不要学编程
										</div>
									</div>
									<div
										className="tk-card"
										ref={(n) => {
											el.current.c_goal = n;
										}}
									>
										<div className="tk-card__tag"># 写作目标</div>
										<div
											className="tk-card__fill"
											ref={(n) => {
												el.current.c_goal_text = n;
											}}
										/>
									</div>
									<div
										className="tk-card"
										ref={(n) => {
											el.current.c_view = n;
										}}
									>
										<div className="tk-card__tag"># 关键观点</div>
										<div className="tk-card__fill">
											AI 替代 / 学编程 / 站队焦虑
										</div>
									</div>
									<div
										className="tk-card"
										ref={(n) => {
											el.current.c_outline = n;
										}}
									>
										<div className="tk-card__tag"># 大纲</div>
										<div className="tk-card__fill">
											{["钩子", "主体1", "主体2", "主体3", "收尾"].map(
												(label, i) => (
													<div
														className="tk-card__row"
														key={label}
														ref={(n) => {
															outRows.current[i] = n;
														}}
													>
														<div className="tk-dot tk-dot--todo" />
														<span>{label}</span>
													</div>
												),
											)}
										</div>
									</div>
									<div
										className="tk-card"
										ref={(n) => {
											el.current.c_review = n;
										}}
									>
										<div className="tk-card__tag"># 审稿发现</div>
										<div className="tk-card__fill">
											2 处发现 · 第 3 段 · 第 4 段
										</div>
									</div>
									<div className="tk-spacer" />
								</div>
							</div>
						</article>

						{/* 中栏：协作主战场 */}
						<article className="tk-tri__col tk-tri__col--mid tk-tri__shell">
							<div className="tk-col-header">
								<span className="tk-dot tk-dot--done" />
								<span>协作主战场</span>
							</div>
							<div className="tk-mask-wrapper">
								<div
									className="tk-scroll-view tk-chat-viewport"
									ref={(n) => {
										el.current.chatViewport = n;
									}}
								>
									<div className="tk-chat">
										<div
											className="tk-chat__bubble tk-chat__bubble--user"
											ref={(n) => {
												el.current.ch_step1 = n;
											}}
										>
											想写一篇「AI
											时代还要不要学编程」，市面上不是「必学」就是「别学」，我想写得不一样
										</div>

										<div
											className="tk-chat__bubble tk-chat__bubble--ai tk-chat__opts--ask"
											ref={(n) => {
												el.current.ch_step2 = n;
											}}
										>
											<div className="tk-chat__text">你想从哪个角度切入？</div>
											<div className="tk-chat__opt">
												<div className="tk-dot tk-dot--todo" />
												<div className="tk-chat__opt-text">
													<div className="name">A 效能角度</div>
													<div className="why">写代码变快了</div>
												</div>
											</div>
											<div
												className="tk-chat__opt"
												ref={(n) => {
													el.current.ch_s2_optB = n;
												}}
											>
												<div className="tk-dot tk-dot--todo" />
												<div className="tk-chat__opt-text">
													<div className="name">B 焦虑角度</div>
													<div className="why">拆解背后的情绪</div>
												</div>
											</div>
											<div className="tk-chat__opt">
												<div className="tk-dot tk-dot--todo" />
												<div className="tk-chat__opt-text">
													<div className="name">C 技能角度</div>
													<div className="why">只学 Prompt 够吗</div>
												</div>
											</div>
										</div>

										<div
											className="tk-chat__echo-rich"
											ref={(n) => {
												el.current.ch_step2b = n;
											}}
										>
											<span className="tag">意图</span>
											<div className="name">B · 焦虑角度</div>
											<div className="why">拆解背后的情绪</div>
										</div>

										<div
											className="tk-chat__archive"
											ref={(n) => {
												el.current.ch_step3 = n;
											}}
										>
											已归档到 # 写作目标：
											<span
												ref={(n) => {
													el.current.ch_s3_text = n;
												}}
											/>
										</div>

										<div
											className="tk-chat__bubble tk-chat__bubble--ai tk-chat__opts--ask"
											ref={(n) => {
												el.current.ch_step4o = n;
											}}
										>
											<div className="tk-chat__text">
												基于「焦虑」给你 3 种大纲方向：
											</div>
											<div
												className="tk-chat__opt"
												ref={(n) => {
													el.current.ch_s4o_opt1 = n;
												}}
											>
												<div className="tk-dot tk-dot--todo" />
												<div className="tk-chat__opt-text">
													<div className="name">① 三层焦虑递进</div>
													<div className="why">工具/思维/路径</div>
												</div>
											</div>
										</div>

										<div
											className="tk-chat__echo-rich"
											ref={(n) => {
												el.current.ch_step4b = n;
											}}
										>
											<span className="tag">大纲</span>
											<div className="name">① 三层焦虑递进</div>
											<div className="why">工具/思维/路径</div>
										</div>

										<div
											className="tk-chat__bubble tk-chat__bubble--ai"
											ref={(n) => {
												el.current.ch_step4 = n;
											}}
										>
											按「三层焦虑递进」展开，5 节结构就位。
										</div>

										<div
											className="tk-chat__archive"
											ref={(n) => {
												el.current.ch_step5 = n;
											}}
										>
											已沉淀到 # 大纲：5 节结构就位
										</div>

										<div
											className="tk-chat__bubble tk-chat__bubble--ai tk-chat__opts--ask"
											ref={(n) => {
												el.current.ch_step5t = n;
											}}
										>
											<div className="tk-chat__text">选个标题？</div>
											<div
												className="tk-chat__opt"
												ref={(n) => {
													el.current.ch_s5t_opt1 = n;
												}}
											>
												<div className="tk-dot tk-dot--todo" />
												<div className="tk-chat__opt-text">
													<div className="name">
														① AI时代要学编程吗，不是一个问题，是三种恐惧
													</div>
												</div>
											</div>
											<div className="tk-chat__opt is-skip">
												<div className="tk-chat__opt-text">
													<div className="name">暂不填写</div>
												</div>
											</div>
										</div>

										<div
											className="tk-chat__echo-rich"
											ref={(n) => {
												el.current.ch_step5b = n;
											}}
										>
											<span className="tag">标题</span>
											<div className="name">
												AI 时代要学编程吗，不是一个问题，是三种恐惧
											</div>
										</div>

										<div
											className="tk-chat__status"
											ref={(n) => {
												el.current.ch_step6 = n;
											}}
										>
											<div className="tk-pulse" />
											AI 正在写第{" "}
											<span
												ref={(n) => {
													el.current.writeStep = n;
												}}
											>
												0
											</span>{" "}
											/ 5 段
										</div>

										<div
											className="tk-chat__bubble tk-chat__bubble--ai tk-chat__opts--ask"
											ref={(n) => {
												el.current.ch_step7 = n;
											}}
										>
											<div className="tk-chat__text">
												内容都写完了 · 要不要进入审稿？
											</div>
											<div
												className="tk-chat__opt"
												ref={(n) => {
													el.current.ch_s7_opt1 = n;
												}}
											>
												<div className="tk-dot tk-dot--todo" />
												<div className="tk-chat__opt-text">
													<div className="name">进入审稿</div>
												</div>
											</div>
										</div>

										<div
											className="tk-chat__echo-rich tk-chat__echo-rich--single"
											ref={(n) => {
												el.current.ch_step7b = n;
											}}
										>
											是，进入审稿
										</div>

										<div
											className="tk-chat__archive"
											ref={(n) => {
												el.current.ch_step8 = n;
											}}
										>
											审稿发现 2 处 · 已沉淀到 # 审稿发现
										</div>
									</div>
									<div className="tk-spacer" />
								</div>
							</div>
						</article>

						{/* 右栏：你的成品 */}
						<article className="tk-tri__col tk-tri__shell">
							<div className="tk-col-header">
								<span className="tk-dot tk-dot--todo" />
								<span>你的成品</span>
							</div>
							<div className="tk-mask-wrapper tk-doc-mask">
								<div
									className="tk-scroll-view tk-doc"
									ref={(n) => {
										el.current.rightViewport = n;
									}}
								>
									<h3 className="tk-doc__title">
										<span
											ref={(n) => {
												el.current.docTitle = n;
											}}
										/>
										<span
											className="tk-cursor tk-cursor--title"
											ref={(n) => {
												el.current.cursorTitle = n;
											}}
										/>
									</h3>
									<ol className="tk-doc__paras">
										{[0, 1, 2, 3, 4].map((i) => (
											<li
												className="tk-doc__para"
												key={i}
												ref={(n) => {
													docParas.current[i] = n;
												}}
											>
												<p className="tk-doc__para-body">
													<span className="tk-doc__indent" />
													<span
														ref={(n) => {
															docTexts.current[i] = n;
														}}
													/>
													<span className="tk-cursor" />
												</p>
												{(i === 2 || i === 4) && (
													<div
														className="tk-doc__wave"
														aria-hidden="true"
														ref={(n) => {
															waveMarks.current[i === 2 ? 0 : 1] = n;
														}}
													/>
												)}
											</li>
										))}
									</ol>
									<div className="tk-spacer" />
								</div>
							</div>
							<footer className="tk-doc__foot">
								<span
									ref={(n) => {
										el.current.wordCount = n;
									}}
								>
									0
								</span>{" "}
								/ ~ 950 字 · 共 5 段
							</footer>
						</article>
					</div>

					<svg className="tk-beam-svg" ref={svgRef} aria-hidden="true">
						<title>协作光束</title>
						<defs>
							<linearGradient id="beam-grad" x1="1" y1="0" x2="0" y2="0">
								<stop offset="0.35" stopColor="var(--emerald)" />
								<stop offset="0.95" stopColor="var(--emerald)" />
								<stop offset="1" stopColor="var(--glow)" />
							</linearGradient>
							<linearGradient id="beam-grad-r" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0.35" stopColor="var(--accent-silver)" />
								<stop offset="0.95" stopColor="var(--accent-silver)" />
								<stop offset="1" stopColor="var(--glow)" />
							</linearGradient>
							<marker
								id="beam-arrow"
								viewBox="0 0 10 10"
								refX="8"
								refY="5"
								markerWidth="6"
								markerHeight="6"
								orient="auto-start-reverse"
								markerUnits="userSpaceOnUse"
							>
								<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--glow)" />
							</marker>
							<marker
								id="beam-arrow-r"
								viewBox="0 0 10 10"
								refX="8"
								refY="5"
								markerWidth="6"
								markerHeight="6"
								orient="auto"
								markerUnits="userSpaceOnUse"
							>
								<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--glow)" />
							</marker>
						</defs>
						<path
							className="tk-beam-path tk-beam-path--thin"
							ref={(n) => {
								beams.current.beam1 = n;
							}}
							stroke="url(#beam-grad)"
							markerStart="url(#beam-arrow)"
						/>
						<path
							className="tk-beam-path tk-beam-path--strong"
							ref={(n) => {
								beams.current.beam3 = n;
							}}
							stroke="url(#beam-grad)"
							markerStart="url(#beam-arrow)"
						/>
						<path
							className="tk-beam-path tk-beam-path--strong"
							ref={(n) => {
								beams.current.beam4 = n;
							}}
							stroke="url(#beam-grad-r)"
							markerEnd="url(#beam-arrow-r)"
						/>
						<path
							className="tk-beam-path tk-beam-path--thin"
							ref={(n) => {
								beams.current.beam5 = n;
							}}
							stroke="url(#beam-grad)"
							markerStart="url(#beam-arrow)"
						/>
						<path
							className="tk-beam-path tk-beam-path--thin"
							ref={(n) => {
								beams.current.beam6 = n;
							}}
							stroke="url(#beam-grad-r)"
							markerEnd="url(#beam-arrow-r)"
						/>
					</svg>
				</div>

				<button
					type="button"
					className="tk-soul__mid-cta"
					ref={(n) => {
						el.current.cta = n;
					}}
					onClick={onOpenLogin}
				>
					试试看 →
				</button>
			</div>
		</section>
	);
}
