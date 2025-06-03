import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "防冰雹网计算器 - 出口版",
	description: "专业防冰雹网计算工具，支持模糊估算与精确计算，专为内部成本评估设计",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "32x32" },
			{ url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
		],
		apple: [
			{ url: "/icons/favicon-152x152.png", sizes: "152x152", type: "image/png" },
			{ url: "/icons/favicon-192x192.png", sizes: "192x192", type: "image/png" },
		],
		other: [
			{ 
				rel: "apple-touch-icon", 
				url: "/icons/favicon-152x152.png" 
			},
			{
				rel: "manifest",
				url: "/site.webmanifest"
			}
		]
	},
	applicationName: "防冰雹网计算器",
	keywords: ["防冰雹网", "计算器", "农业", "出口版", "冰雹防护"],
	authors: [{ name: "防冰雹解决方案团队" }],
	themeColor: "#3B82F6",
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="zh-CN" className={`${geist.variable}`}>
			<body>
				{children}
				<Toaster position="top-center" richColors />
			</body>
		</html>
	);
}
