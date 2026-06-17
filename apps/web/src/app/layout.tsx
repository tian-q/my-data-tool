import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { env } from "../../env.mjs";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: env.NEXT_PUBLIC_APP_NAME,
	description:
		"特会写 · 把模糊的写作冲动，理成完整的文章。因为会问，所以会写。",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
			// Browser extensions (e.g. the Google Analytics opt-out add-on) inject
			// attributes onto <html> before React hydrates, causing a mismatch.
			// This suppresses the warning for this element's own attributes only.
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col">
				{/* Disable native scroll restoration before hydration so an SSR refresh
				    while scrolled into the pinned soul screen returns to the top
				    (Vue, an SPA, had no height to restore to). beforeInteractive runs
				    before paint/restoration — an effect would fire too late. */}
				<Script id="scroll-restoration" strategy="beforeInteractive">
					{
						"if('scrollRestoration' in history)history.scrollRestoration='manual';"
					}
				</Script>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
