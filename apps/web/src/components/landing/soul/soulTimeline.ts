// §02 灵魂屏滚动状态机的纯函数与区间表，1:1 搬自 Vue `index.vue` 的 initSoul。
// 无 React 依赖；setBeamWindow 直接操作传入的 SVG path（命令式，由 useEffect 调用）。

export const clamp = (v: number, min: number, max: number) =>
	Math.max(min, Math.min(max, v));

/** 把全局进度 p 归一化到区间 [a,b] → 0..1 */
export const sub = (p: number, a: number, b: number) =>
	clamp((p - a) / (b - a), 0, 1);

/** easeOutCubic */
export const eo = (t: number) => 1 - (1 - t) ** 3;

/** 滚动进度 → 各阶段区间表（原 R 对象，逐项照搬） */
export const R = {
	s1_user: [0.02, 0.05],
	s2_ask: [0.05, 0.1],
	s2_pick: [0.09, 0.1],
	s2_fold: [0.1, 0.13],
	s3_settle: [0.13, 0.17],
	s3_beam: [0.17, 0.22],
	s3_land: [0.21, 0.24],
	s4o_ask: [0.24, 0.28],
	s4o_pick: [0.27, 0.28],
	s4o_fold: [0.28, 0.3],
	s4_outline: [0.3, 0.35],
	s4_beam: [0.35, 0.4],
	s4_land: [0.39, 0.42],
	s5t_ask: [0.42, 0.46],
	s5t_pick: [0.45, 0.46],
	s5t_fold: [0.46, 0.48],
	s5_to_right: [0.48, 0.53],
	s6_write: [0.53, 0.82],
	s7_ask: [0.82, 0.86],
	s7_pick: [0.85, 0.87],
	s7_fold: [0.87, 0.89],
	s8_beam: [0.89, 0.95],
	s8_land: [0.93, 0.96],
	s8_to_right: [0.94, 1.0],
	s8_marks: [0.96, 1.0],
} as const;

/** 三次贝塞尔光束路径 d 字符串 */
export const curve = (sx: number, sy: number, tx: number, ty: number) => {
	const dx = tx - sx;
	const dy = ty - sy;
	return `M ${sx} ${sy} C ${sx + dx * 0.22} ${sy}, ${sx + dx * 0.75} ${sy + dy * 0.25}, ${tx} ${ty}`;
};

/**
 * 用 stroke-dasharray/offset 在区间 [a,b] 内做光束「出现 → 保持 → 淡出」。
 * 首次调用按路径总长初始化 dasharray（dataset.inited 标记）。
 */
export const setBeamWindow = (
	pathEl: SVGPathElement | null,
	p: number,
	a: number,
	b: number,
) => {
	if (!pathEl) return;
	const len = pathEl.getTotalLength() || 1000;
	if (!pathEl.dataset.inited) {
		pathEl.style.strokeDasharray = String(len);
		pathEl.style.strokeDashoffset = String(len);
		pathEl.dataset.inited = "true";
	}
	if (p < a || p > b) {
		pathEl.style.opacity = "0";
		pathEl.style.strokeDashoffset = String(len);
		return;
	}
	const local = sub(p, a, b);
	let opacity = 0;
	let offset = len;
	if (local <= 0.55) {
		const prog = local / 0.55;
		offset = len * (1 - eo(prog));
		opacity = eo(prog) * 1.4;
	} else if (local <= 0.78) {
		offset = 0;
		opacity = 1.4;
	} else {
		offset = 0;
		opacity = (1 - (local - 0.78) / 0.22) * 1.4;
	}
	pathEl.style.opacity = String(Math.min(opacity, 1));
	pathEl.style.strokeDashoffset = String(offset);
};
