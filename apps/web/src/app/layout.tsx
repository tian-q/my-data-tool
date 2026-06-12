import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
	description: "Cross-platform todo app sharing @app/core",
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
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
