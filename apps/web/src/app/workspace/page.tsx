// 工作台占位页：登录成功后跳到这里。
// 将来用 Vue 版工作台（view/homepage/index.vue）替换；现在只放占位文案。
export default function WorkspacePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-3">
			<h1 className="text-4xl font-bold">登录成功</h1>
			<p className="text-neutral-500">工作台页面待迁移（Vue 版）。</p>
		</main>
	);
}
