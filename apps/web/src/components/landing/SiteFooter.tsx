// §05 Footer — static markup ported from the Vue template.

export function SiteFooter() {
	return (
		<footer className="tk-foot">
			<div className="tk-foot__top">
				<div className="tk-foot__brand">
					<span className="tk-foot__logo">特会写</span>
					<p className="tk-foot__claim">AI 驱动的结构化挖矿工作台</p>
				</div>

				<div className="tk-foot__cols">
					<div className="tk-foot__col">
						<h5>产品</h5>
						<a href="#hero">产品介绍</a>
						<a href="#hero">功能更新</a>
					</div>
					<div className="tk-foot__col">
						<h5>法律 / 联系</h5>
						<a href="#hero">用户协议</a>
						<a href="#hero">隐私政策</a>
						<a href="#hero">商务合作邮箱</a>
					</div>
					<div className="tk-foot__col tk-foot__col--qr">
						<h5>关注</h5>
						<div className="tk-foot__qrs">
							<div className="tk-foot__qr">
								<span className="tk-foot__qr-img" />
								<em>公众号</em>
							</div>
							<div className="tk-foot__qr">
								<span className="tk-foot__qr-img" />
								<em>小红书</em>
							</div>
							<div className="tk-foot__qr">
								<span className="tk-foot__qr-img" />
								<em>客服微信</em>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="tk-foot__bar">
				© 2026 特会写 ·{" "}
				<a
					className="tk-foot__icp"
					href="https://beian.miit.gov.cn/"
					target="_blank"
					rel="noopener noreferrer"
				>
					京ICP备2026027421号
				</a>
			</div>
		</footer>
	);
}
