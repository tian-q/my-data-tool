// Static landing-page content, lifted verbatim from Vue `view/index.vue`.
// Pure data, no side effects — any layer may import it.

export interface Moment {
	id: string;
	name: string;
	state: string;
	product: string;
}

export interface Rhythm {
	tag: "slow" | "mid" | "fast";
	name: string;
	desc: string;
	fit: string[];
}

// §02 灵魂屏文案（阶段 5 使用）
export const P_TEXTS = [
	"过去半年我接到 3 个朋友问同一句话——「AI 都这样了，还要学编程吗?」我后来发现，他们其实在问三件不同的事。",
	"一种是工具焦虑。怕 AI 把代码全写完了，自己只剩下点击「接受建议」，变成中间一个可有可无的环节。",
	"一种是思维焦虑。怕错过编程那种把模糊问题拆成可执行小步骤的训练——就算 AI 能写代码，这种拆解能力也没法外包。",
	"一种是路径焦虑。怕投入 5 年，这条路被 AI 压平，从「稀缺技能」变成「人人会的标配」，刚到山顶发现山不在了。",
	"所以下次问「AI 时代还要学编程吗」之前，先停一秒问自己：你担心的，到底是哪一种？分清楚后你要的不是「学/不学」的二选一，而是一个更具体的下一步。",
];
export const TITLE_TEXT = "AI 时代要学编程吗，不是一个问题，是三种恐惧";

// §03 四个时刻
export const moments: Moment[] = [
	{
		id: "01",
		name: "想法还在模糊里",
		state: "我想写点啥,但说不清楚",
		product: "不用先想清楚。AI 听你的碎片,挖出 3 个方向给你挑。",
	},
	{
		id: "02",
		name: "想法清楚了",
		state: "可怎么展开成一篇?",
		product:
			"议论文有论证,散文有意象 —— AI 先认你写的是哪类,再给 3 个大纲让你挑。",
	},
	{
		id: "03",
		name: "开始写正文",
		state: "写着写着怕跑偏",
		product: "一段一确认。AI 不连写。错了立刻刹车,不积累。",
	},
	{
		id: "04",
		name: "写完想检查",
		state: "不知道哪里有问题",
		product: "一次审稿,问题位置标在原文旁,逐条讨论。",
	},
];

// §04.1 三种节奏
export const rhythms: Rhythm[] = [
	{
		tag: "slow",
		name: "标准 · 陪伴",
		desc: "挖一个点确认一次,稳准慢。",
		fit: ["第一次用", "重要文章", "不确定方向"],
	},
	{
		tag: "mid",
		name: "深度 · 思考",
		desc: "AI 自己想清楚再开口,给架构建议。",
		fit: ["复杂主题", "想看梳理", "有耐心"],
	},
	{
		tag: "fast",
		name: "自主 · 放手",
		desc: "AI 制定计划自动跑,你做总编辑。",
		fit: ["意图清楚", "内容不严肃", "批量出稿"],
	},
];

// §04.2 底线承诺（含 <em> 关键词，渲染时用 dangerouslySetInnerHTML）
export const rules = [
	"<em>你的观点</em>,AI 只帮你说清楚,<em>不替你发明</em>。",
	"你不开口,AI 就不主动。<em>节奏在你手里</em>。",
	"你的写作习惯,<em>只属于你</em>。不用于训练,不分享。",
	"从第一个字到发布,<em>你始终说了算</em>。",
];

// 节奏 nav 的中文短词 / 英文 kicker
export const PACE_WORDS = ["标准", "深度", "自主"];
export const PACE_KICKERS = ["STANDARD MODE", "DEEP MODE", "AUTONOMOUS MODE"];
