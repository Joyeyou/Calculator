import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "防冰雹网计算器 - 出口版",
	description: "专业防冰雹网计算工具，支持模糊估算与精确计算，专为内部成本评估设计",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<body>
				{children}
				<Toaster position="top-center" richColors />
			</body>
		</html>
	);
}
