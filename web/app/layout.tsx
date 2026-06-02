import type { Metadata } from "next";
import {
  Newsreader,
  Inter,
  JetBrains_Mono,
  Noto_Serif_SC,
  Noto_Sans_SC,
} from "next/font/google";
import "./globals.css";

// Latin 字体 — next/font 自托管、构建期下载、零运行时请求 Google。
// 均保持默认 preload:true（关键路径预加载）。多词字体名用下划线导入。
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  axes: ["opsz"], // 编辑衬线的光学尺寸轴：大标题更舒展
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// CJK 兜底 — Noto SC 在 next/font/google 不暴露 chinese-simplified subset，
// 若保持默认 preload:true 会触发 google-fonts-missing-subsets 构建错误。
// 因此强制 preload:false（subsets:['latin'] 仅为满足 API）。真正的中文衬线
// 由系统字体承担（macOS: Songti SC / PingFang SC），见 globals.css 字体栈。
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-noto-serif-sc",
  display: "swap",
  preload: false,
});
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "MindPrint",
  description: "私人思维档案馆。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSerifSC.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-serif">
        {/* Skip link：键盘 / 屏幕阅读器用户跳过头部直达主内容（a11y 基线）。
            默认 sr-only，聚焦时浮现于左上。各页 <main> 带 id="main"。 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2.5 focus:text-on-primary focus:shadow-menu"
        >
          跳到主内容
        </a>
        {children}
      </body>
    </html>
  );
}
