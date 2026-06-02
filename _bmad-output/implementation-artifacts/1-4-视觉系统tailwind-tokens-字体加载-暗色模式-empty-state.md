---
baseline_commit: cc16bf1aecdd94711d530f6be490615a73be538a
---
# Story 1.4: 视觉系统（Tailwind v4 tokens / 字体加载 / 暗色模式 / Empty State）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As alex（唯一用户），
I want 把 DESIGN.md 的完整 token 体系桥接进 Tailwind v4、加载中文优先的字体栈、实现跟随系统的暗色模式、并落地一个完整的 Empty State，
so that MindPrint 从我登录的第一眼起就呈现"编辑档案馆"的视觉调性，而后续所有 story 的组件都能直接复用同一套 token。

## Acceptance Criteria

> ⚠️ **AC 已按 Tailwind v4 现实重写**（epic 原文假设 v3 的 `tailwind.config.ts`，本项目实装 `tailwindcss@4.3.0`，无 config 文件，走 CSS-first `@theme`）。详见 Dev Notes「关键偏差 1」。所有颜色 / 字号 / 间距 hex 与数值以 `DESIGN.md` frontmatter 为权威来源。

**AC1 — 颜色 token（亮 + 暗，跟随系统）**
1. `web/app/globals.css` 的 `:root` 用 CSS 自定义属性定义 **全部** DESIGN.md 亮色 token（surface 系 6 档、on-surface / on-surface-variant、outline / outline-variant、primary 系 4、secondary、error 系、background、inverse 系）。
2. `@media (prefers-color-scheme: dark) { :root { … } }` 覆盖为 DESIGN.md 的 **暗色倒置** token（背景 `#1A1B19`、文字 `#F0EDE5`、primary 倒置为暖米色 `#E0C1A1`）。
3. 通过 `@theme inline` 把这些 runtime 变量映射为 Tailwind 颜色 token（生成 `bg-surface` / `text-on-surface` / `border-outline-variant` / `bg-primary` 等工具类）。
4. 验证：亮色 `bg #FAF8F3 / text #1B1C19 / primary #735C41`；切换系统暗色 → `bg #1A1B19 / text #F0EDE5 / primary #E0C1A1` **自动应用，无需任何 `dark:` 前缀、无需 JS、无切换器**。

**AC2 — 字体加载（中文优先栈 + next/font）**
5. `web/app/layout.tsx` 用 `next/font/google` 加载 **Latin 字体**：Newsreader（衬线）、Inter（无衬线）、JetBrains Mono（等宽）—— 均 `display:'swap'`、保持默认 `preload:true`，各自 `variable: '--font-*'`。
6. 同时加载 **CJK 兜底** Noto Serif SC + Noto Sans SC，**必须 `preload: false`**（见 Dev Notes「关键偏差 2」：CJK 无 `chinese-simplified` subset，preload=true 会让 next/font 抛错）。
7. `@theme inline` 定义 `--font-serif / --font-sans / --font-mono`，每条栈为 **"系统中文 → next/font 变量 → 系统 fallback"**（精确字符串见 Dev Notes「字体决策」）。
8. `--text-*` 字号 token 覆盖完整 scale：display-lg(48px/1.15) · headline-md(28/1.25) · headline-sm(20/1.3) · body-lg(17/1.65) · body-md(15/1.6) · label-caps(12/1.4, 0.08em) · caption(13/1.5) · mono-metadata(12/1.4, 0.02em)，且各自带 `--text-{n}--line-height`（及需要的 `--letter-spacing` / `--font-weight`）。display-lg 移动端降到 36px（响应式或 clamp）。

**AC3 — 间距 / 圆角 / 阴影 token**
9. `@theme` 定义静态 token：spacing（`--spacing` base 8px 派生 + 命名 `card-gap:20px` / `card-padding:16px` / `gutter:24px` / `margin-mobile:20px` / `margin-desktop:56px` / `editorial-gap:64px`）；radius（sm 2px / DEFAULT 4px / md 6px / lg 8px / xl 12px / full）。
10. 阴影 token `shadow-card-rest` / `shadow-card-hover` / `shadow-menu` 为**染棕极轻**阴影，且**暗色下切到深色阴影**（同样走 `:root` var + dark 覆盖 + `@theme inline`，绝不用纯黑硬投影）。

**AC4 — Empty State 组件**
11. 新建 `web/components/EmptyState.tsx`（Server Component）：居中布局 = `mono-metadata` 小标签 "empty archive"（uppercase）+ `display-lg` 大标题 "还没有 Entry。" + `body-lg` 描述 "从这里开始。" + Primary 按钮 "归档第一份"。
12. **禁止** 插图 / icon / emoji —— 文字本身承担情绪（DESIGN.md Empty State + Don'ts）。按钮在本 story 仅视觉态（归档逻辑属 Epic 2，此处不接 handler / 不开 modal）。

**AC5 — `/` 首页落地视觉系统**
13. `web/app/page.tsx` 替换 Next 脚手架占位内容，渲染 `<EmptyState />`（当前无 Entry，时间线主屏的空态即首页；真正时间线属 Epic 3）。包含语义 `<main id="main">` landmark。

**AC6 — Voice 文案字典**
14. 新建 `web/lib/voice.ts`，导出 `COPY` 对象，含 ≥ 12 条 microcopy（取自 EXPERIENCE.md，逐字一致）。覆盖 archive 成功/失败、delete 确认/完成、timeline 空态、render 失败、loading、ui 取消/确认等。

**AC7 — a11y 基线**
15. `layout.tsx`：`<html lang="zh-CN">`（已存在，保留）+ skip link（`跳到主内容` → `#main`）。
16. `globals.css`：`*:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }`（与背景对比 ≥ 4.5:1）。
17. `globals.css`：`@media (prefers-reduced-motion: reduce)` 把全局 transition/animation 时长压到 ~0（≤ 1ms）。
18. `color-scheme` 跟随系统（`:root { color-scheme: light dark }` 或 `<meta name="color-scheme">`），令原生控件（滚动条/表单）也随系统明暗。

**AC8 — 把视觉系统应用到 1.3 的 auth 页面（仅视觉）**
19. 用 token 重写 `web/app/auth/signin|verify-request|error/page.tsx` 的 **className/视觉**（wordmark 用 `font-serif`、按钮用 primary token、input 用下划线式、背景 surface）。**严禁改动 Story 1.3 的任何逻辑 / Server Action / 重定向 / 安全判定**（这些刚过 Codex 安全评审）——只动展示层。

**AC9 — 质量门**
20. `npm run typecheck`（tsc）+ `npm run lint`（eslint）+ `npm run build`（Turbopack）全绿，无新告警。
21. dev 自检：亮/暗双模视觉正确、Tab 焦点环可见、reduced-motion 生效；交 alex 在浏览器肉眼确认 CJK 衬线在其 Mac 上渲染为衬线（视觉 story 的人工验收点）。

## Tasks / Subtasks

- [x] **Task 1 — 字体加载与根布局**（AC: 5,6,7,15,18）
  - [x] 在 `layout.tsx` 用 `next/font/google` 实例化 Newsreader / Inter / JetBrains_Mono（注意多词字体名用下划线导入：`JetBrains_Mono`、`Noto_Serif_SC`、`Noto_Sans_SC`），各 `variable` + `display:'swap'`
  - [x] 实例化 `Noto_Serif_SC` / `Noto_Sans_SC`，**`preload:false`** + `subsets:['latin']`（仅为满足 API；真正 CJK 由系统字体承担）
  - [x] 把 5 个 `.variable` 拼到 `<html className>`，保留 `h-full antialiased`；`<body className="min-h-full flex flex-col font-serif">`（加 `font-serif` 套用衬线；auth 页用了 `flex-1` 保留）
  - [x] `metadata` 改为 MindPrint（title/description）；移除 Geist 相关 import
  - [x] 加 skip link（`sr-only focus:not-sr-only` 风格）指向 `#main`
- [x] **Task 2 — Token 系统（globals.css）**（AC: 1,2,3,8,9,10,16,17,18）
  - [x] `:root` 写全部亮色 hex 变量（颜色 + 阴影值）；`@media (prefers-color-scheme: dark) :root` 写暗色覆盖
  - [x] `@theme inline`：映射所有 **会随运行时变化** 的 token —— 颜色（`--color-*` ← `var()`）、字体（`--font-*` ← next/font 变量 + 系统栈）、会翻转的阴影（`--shadow-*`）
  - [x] `@theme`（普通）：静态 token —— `--spacing` base、命名 spacing、`--radius-*`、完整 `--text-*` scale（带 line-height/letter-spacing/weight 修饰）
  - [x] `body` 基样式：`background:var(--background); color:var(--on-background)` + `font-feature-settings:"palt" 1`、`-webkit-font-smoothing:antialiased`（CJK 排版）；衬线通过 `<body className="… font-serif">` 工具类套用
  - [x] `*:focus-visible` 焦点环；`@media (prefers-reduced-motion: reduce)` 压制动画；`color-scheme`
  - [x] 删除脚手架默认的 Geist 变量 / `#171717` 等占位 token
- [x] **Task 3 — EmptyState 组件**（AC: 11,12）
  - [x] `web/components/EmptyState.tsx`（Server Component，无 `'use client'`）：mono 小标签 + display-lg 标题 + body-lg 描述 + primary 按钮；纯 Tailwind 工具类引用 token；无 icon/emoji
- [x] **Task 4 — `/` 首页**（AC: 13）
  - [x] `page.tsx` 替换为渲染 `<EmptyState />`，包 `<main id="main" class="flex flex-1 …">`
- [x] **Task 5 — Voice 字典**（AC: 14）
  - [x] `web/lib/voice.ts` 导出 `COPY`（≥12 条，逐字取自 EXPERIENCE.md，见 Dev Notes「Voice 字典」）
- [x] **Task 6 — auth 页面视觉化**（AC: 19）
  - [x] 仅改 `signin/verify-request/error/page.tsx` 的 className/标记；逐一对照确认 **逻辑零改动**（Server Action、redirect、isAllowedEmail、signIn 调用原样保留）— git diff 已确认三页仅 className + `id="main"` 变化
- [x] **Task 7 — 质量门 + 自检**（AC: 20,21）
  - [x] `npm run typecheck && npm run lint && npm run build` 全绿（build 因 gstatic 偶发抖动重试 4 次方全绿，详见 Completion Notes）
  - [x] 自检：编译后 CSS 已确认 `prefers-color-scheme:dark` 暗色覆盖、`*:focus-visible` primary 焦点环、`prefers-reduced-motion` 压制均生成；display-lg clamp 响应式生效。⚠️ 本环境无浏览器，未产出截图；**CJK 衬线在 Mac 上的肉眼验收 + 明暗实拍是 AC21 designated 的 alex 交付点**（见下方验收清单）
  - [x] 填写 Dev Agent Record + File List + Change Log

## Dev Notes

### 与前序 Story 的衔接（previous-story learnings —— 必读）

- **Story 1.3 故意把视觉留给本 story**：auth 三页（signin/verify-request/error）用的是泛化 Tailwind 类（`rounded-md border px-3 py-2` 等），代码注释明写"视觉系统属 Story 1.4"。本 story Task 6 负责把它们替换为 token 化视觉。
- **🔒 安全红线**：1.3 的 auth 逻辑刚经 Codex 安全评审（修了成员身份 oracle、host 投毒等 7 项，见 commit `db07815`）。Task 6 **只动 className/JSX 结构展示层**，严禁触碰 `sendMagicLink` Server Action、`isAllowedEmail`、`redirect`、`signIn` 调用、`requireAlex`。改完务必 diff 确认逻辑零变化。
- **当前 globals.css / layout.tsx 仍是 create-next-app 脚手架**：Geist 字体、`#ffffff/#171717` 占位色、`@import "tailwindcss"` + 一个最小 `@theme inline`。本 story 整体替换其内容，但保留 `@import "tailwindcss"`、`<html lang="zh-CN">`、`h-full antialiased`、`min-h-full flex flex-col` 这些已验证可用的骨架。
- **proxy 门卫**：1.3 的 `proxy.ts` 对未登录访问 `/` 会 302 到 `/auth/signin`。本 story 的 `/` EmptyState 是登录后所见 —— 验证时需先登录（或临时带 session cookie）。

### ⚠️ 关键偏差 1 —— `tailwind.config.ts` → CSS-first `@theme`（Tailwind v4）

epic-1 的 Story 1.4 AC 原文要求"创建 `web/tailwind.config.ts` + `theme.extend.colors/fontFamily/...`"。**这是 Tailwind v3 写法。** 本项目实装 **`tailwindcss@4.3.0`**（CSS-first），**没有也不应创建 `tailwind.config.ts`**：

- 入口就是 `globals.css` 顶部的 `@import "tailwindcss";`（已存在，保留）。
- 设计 token 全部写在 CSS 的 `@theme { … }` / `@theme inline { … }` 里，Tailwind 据此**同时**生成 CSS 变量与工具类。
- 命名 → 工具类是机械映射：`--color-surface` ⇒ `bg-surface`/`text-surface`/`border-surface`；`--font-serif` ⇒ `font-serif`；`--radius-lg` ⇒ `rounded-lg`；`--text-display-lg` ⇒ `text-display-lg`；`--shadow-card-rest` ⇒ `shadow-card-rest`；`--spacing`(单数) 驱动整套 `p-/gap-/w-/h-` 数值刻度。
- 依据：`web/AGENTS.md`（"读 node_modules/next/dist/docs 再写码"）+ installed Next 文档 `01-app/03-api-reference/02-components/font.md`（其 Tailwind 桥接示例正是 `@theme inline`）+ Tailwind v4 官方 Theme/Dark-mode 文档。

**`@theme` vs `@theme inline` 是承重区别（写错暗色/字体会静默失效）**：
- **普通 `@theme`**：把你写的**字面值**拷进全局变量，工具类引用 Tailwind 自己的变量。适合静态字面量（spacing、radius、text 尺寸）。
- **`@theme inline`**：工具类**内联**你写的值（即直接用 `var(--runtime-thing)`），把解析推迟到**使用处**。**凡是值本身是 `var(--会在运行时变的东西)` 的 token —— 即随暗色 media query 翻转的颜色/阴影、以及 next/font 注入到 `<html>` 的字体变量 —— 都必须放 `@theme inline`，否则会在定义处就被解析、运行时覆盖不生效。**

### ⚠️ 关键偏差 2 —— CJK 字体加载（next/font 的硬约束）+ 字体决策

**事实（已核 installed `@next/font/dist/google/font-data.json` 与校验源码）**：
- `Noto Serif SC` / `Noto Sans SC` 在 `next/font/google` **存在**（含 variable 轴），但 **不暴露 `chinese-simplified` subset**（全表 1911 个字体 0 个有任何 `chinese*` subset）。
- 因此 CJK 字形**无法被 preload**；若 CJK google font 保持默认 `preload:true` 而无 `subsets`，**next/font 直接抛构建错误**（`google-fonts-missing-subsets`）。→ **任何 CJK google 字体必须 `preload:false`。**
- 全量 web-load variable CJK 衬线是 **数 MB** 级（整套 Noto CJK ≈16MB；SC 子族每字重仍数 MB），不可在关键路径 eager 加载。

**本 story 字体决策（V1）**：**系统 CJK 优先 + Latin 走 next/font + Noto SC 作 `preload:false` 兜底**。理由：alex 单用户、在 macOS（系统自带宋体 Songti SC / PingFang SC，可直接呈现衬线 CJK，零下载）；Latin 衬线/无衬线/等宽用 next/font 拿到优化加载；Noto SC 仅作非 Mac 机器的网络兜底，且 `preload:false` 不进关键路径。**`@theme inline` 里的精确字体栈**（dev 照抄）：

```css
--font-serif: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", "STSong",
              var(--font-noto-serif-sc), var(--font-newsreader), "ET Book", Georgia, serif;
--font-sans:  "Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC",
              var(--font-noto-sans-sc), var(--font-inter), -apple-system, system-ui, sans-serif;
--font-mono:  var(--font-jetbrains-mono), "SF Mono", "Source Han Mono", ui-monospace, monospace;
```

> 说明：在 DESIGN.md 原栈（思源在前）基础上**补入 macOS 系统名（Songti SC/PingFang SC）与 next/font 变量**，使 CJK 在 alex 的 Mac 上真正落到系统衬线、Latin 落到 Newsreader/Inter。这是对 DESIGN.md 栈的"可落地化"扩展，不改其 CJK-first 意图。
>
> **遗留（不阻塞 V1）**：若日后要保证非 Mac 机器也呈现编辑衬线 CJK 而又不发数 MB —— 用 `next/font/local` 自托管**子集化** `.woff2`（pyftsubset 取常用汉字集，`unicode-range` 控制），变量名沿用 `--font-noto-serif-sc` 即可零改 globals.css。届时登记到 `deferred-work.md`。

`layout.tsx` 字体实例化骨架（dev 参考）：

```tsx
import { Newsreader, Inter, JetBrains_Mono, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
const newsreader   = Newsreader({ subsets:["latin"], variable:"--font-newsreader", display:"swap", axes:["opsz"] });
const inter        = Inter({ subsets:["latin"], variable:"--font-inter", display:"swap" });
const jetbrainsMono= JetBrains_Mono({ subsets:["latin"], variable:"--font-jetbrains-mono", display:"swap" });
const notoSerifSC  = Noto_Serif_SC({ subsets:["latin"], variable:"--font-noto-serif-sc", display:"swap", preload:false }); // preload:false 必须
const notoSansSC   = Noto_Sans_SC({ subsets:["latin"], variable:"--font-noto-sans-sc", display:"swap", preload:false });   // preload:false 必须
```

### Tailwind v4 globals.css 结构骨架（dev 照此组织）

```css
@import "tailwindcss";

/* 1) 亮色：原始 token 值（颜色 + 阴影） */
:root {
  --surface:#FAF8F3; --surface-container-lowest:#FFFFFF; --surface-container-low:#F5F2EB;
  --surface-container:#F0EDE5; --surface-container-high:#EAE7DD; --surface-container-highest:#E4E0D5;
  --on-surface:#1B1C19; --on-surface-variant:#4E453D;
  --outline:#80756B; --outline-variant:#D1C4B9;
  --primary:#735C41; --on-primary:#FAF8F3; --primary-container:#F0E5D2; --on-primary-container:#3A2B16;
  --secondary:#B84A39; --on-secondary:#FFFFFF;
  --error:#BA1A1A; --on-error:#FFFFFF; --error-container:#FFDAD6; --on-error-container:#93000A;
  --background:#FAF8F3; --on-background:#1B1C19; --inverse-surface:#1B1C19; --inverse-on-surface:#FAF8F3;
  --shadow-rest:0 1px 2px rgba(115,92,65,.04);
  --shadow-hover:0 4px 12px rgba(115,92,65,.08), 0 1px 2px rgba(115,92,65,.06);
  --shadow-menu:0 8px 24px rgba(115,92,65,.12), 0 2px 4px rgba(115,92,65,.06);
  color-scheme: light dark;
}
/* 2) 暗色：跟随系统自动覆盖（无 JS、无 .dark 类） */
@media (prefers-color-scheme: dark) {
  :root {
    --surface:#1A1B19; --surface-container-low:#22231F; --surface-container:#28291F; --surface-container-high:#33342B;
    --on-surface:#F0EDE5; --on-surface-variant:#C2BAA9; --outline:#9A8E80; --outline-variant:#3D3A33;
    --primary:#E0C1A1; --on-primary:#3A2B16; --primary-container:#5A4730; --on-primary-container:#F5D6B4;
    --secondary:#E0A192; --on-secondary:#5A1A0F; --background:#1A1B19; --on-background:#F0EDE5;
    --shadow-rest:0 1px 2px rgba(0,0,0,.25);
    --shadow-hover:0 4px 12px rgba(0,0,0,.35), 0 1px 2px rgba(0,0,0,.25);
    --shadow-menu:0 8px 24px rgba(0,0,0,.4), 0 2px 4px rgba(0,0,0,.25);
  }
}
/* 3) 运行时 var() 的 token → 必须 @theme inline */
@theme inline {
  --color-surface:var(--surface); --color-surface-container-lowest:var(--surface-container-lowest);
  --color-surface-container-low:var(--surface-container-low); --color-surface-container:var(--surface-container);
  --color-surface-container-high:var(--surface-container-high); --color-surface-container-highest:var(--surface-container-highest);
  --color-on-surface:var(--on-surface); --color-on-surface-variant:var(--on-surface-variant);
  --color-outline:var(--outline); --color-outline-variant:var(--outline-variant);
  --color-primary:var(--primary); --color-on-primary:var(--on-primary);
  --color-primary-container:var(--primary-container); --color-on-primary-container:var(--on-primary-container);
  --color-secondary:var(--secondary); --color-on-secondary:var(--on-secondary);
  --color-error:var(--error); --color-on-error:var(--on-error);
  --color-background:var(--background); --color-on-background:var(--on-background);
  --shadow-card-rest:var(--shadow-rest); --shadow-card-hover:var(--shadow-hover); --shadow-menu:var(--shadow-menu);
  /* 字体（next/font 变量在运行时注入到 <html>）→ 也必须 inline */
  --font-serif: "Source Han Serif SC","Noto Serif CJK SC","Songti SC","STSong",var(--font-noto-serif-sc),var(--font-newsreader),"ET Book",Georgia,serif;
  --font-sans:  "Source Han Sans SC","Noto Sans CJK SC","PingFang SC",var(--font-noto-sans-sc),var(--font-inter),-apple-system,system-ui,sans-serif;
  --font-mono:  var(--font-jetbrains-mono),"SF Mono","Source Han Mono",ui-monospace,monospace;
}
/* 4) 静态字面量 token → 普通 @theme */
@theme {
  /* 不覆盖 --spacing base：保持 Tailwind 默认 4px（p-4=16px / p-6=24px / p-14=56px / p-16=64px，DESIGN 的 8 倍数刻度天然可用）。仅加非 8 倍数的命名间距： */
  --spacing-card-gap:20px; --spacing-card-padding:16px; --spacing-gutter:24px;
  --spacing-margin-mobile:20px; --spacing-margin-desktop:56px; --spacing-editorial-gap:64px;
  --radius-sm:.125rem; --radius:.25rem; --radius-md:.375rem; --radius-lg:.5rem; --radius-xl:.75rem;
  --text-display-lg:48px; --text-display-lg--line-height:1.15; --text-display-lg--letter-spacing:-0.01em; --text-display-lg--font-weight:400;
  --text-headline-md:28px; --text-headline-md--line-height:1.25; --text-headline-md--font-weight:400;
  --text-headline-sm:20px; --text-headline-sm--line-height:1.3;  --text-headline-sm--font-weight:500;
  --text-body-lg:17px; --text-body-lg--line-height:1.65;
  --text-body-md:15px; --text-body-md--line-height:1.6;
  --text-label-caps:12px; --text-label-caps--line-height:1.4; --text-label-caps--letter-spacing:0.08em; --text-label-caps--font-weight:500;
  --text-caption:13px; --text-caption--line-height:1.5;
  --text-mono-metadata:12px; --text-mono-metadata--line-height:1.4; --text-mono-metadata--letter-spacing:0.02em;
}
/* body 引用原始 var（与脚手架已验证的模式一致）；字体用 <body className="… font-serif"> 工具类套用 */
body { background:var(--background); color:var(--on-background);
       font-feature-settings:"palt" 1; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
*:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
}
```

> ⚠️ **不要覆盖 `--spacing` base** —— 保持 Tailwind 默认 4px（`p-4`=16px、`p-6`=24px、`p-14`=56px、`p-16`=64px 均为 DESIGN 的 8 倍数刻度）。DESIGN 的 20px（`card-gap`）等非 8 倍数值用命名 token：`--spacing-card-gap` 生成 `gap-card-gap`/`p-card-gap` 等工具类。如此不会出现 `p-4` 意外变 32px 的偏差。

### 字号 / 用法对照（typography）

| token（类） | family（配） | px / line-height | 主要用途 |
|---|---|---|---|
| `text-display-lg` + `font-serif` | 衬线 | 48 / 1.15（移动 36） | 月份分隔、**Empty State 标题** |
| `text-headline-md` + `font-serif` | 衬线 | 28 / 1.25 | 月份分隔全文 |
| `text-headline-sm` + `font-serif` | 衬线 | 20 / 1.3 | 卡片标题、chrome（后续 epic） |
| `text-body-lg` + `font-serif` | 衬线 | 17 / 1.65 | **Empty State 描述**、长文 |
| `text-body-md` + `font-sans` | 无衬线 | 15 / 1.6 | UI / input |
| `text-label-caps` + `font-sans` + `uppercase` | 无衬线 | 12 / 1.4, 0.08em | **按钮**、表单 label |
| `text-caption` + `font-sans` | 无衬线 | 13 / 1.5 | 时间等次要元数据 |
| `text-mono-metadata` + `font-mono` | 等宽 | 12 / 1.4, 0.02em | **Empty State 小标签**、绝对时间戳 |

### EmptyState 组件（视觉规格）

- 结构（DESIGN.md Empty State + epic AC）：居中纵向 —— `mono-metadata` uppercase 小标签 **"empty archive"** → `display-lg` 衬线大标题 **"还没有 Entry。"** → `body-lg` 描述 **"从这里开始。"** → Primary 按钮 **"归档第一份"**。
- Primary 按钮视觉：`bg-primary text-on-primary rounded`（4px）+ `px-5 py-2.5` + `text-label-caps uppercase` + `shadow-card-rest`，hover 加深（可 `hover:brightness-95` 或 `color-mix`）。
- **禁止**：icon / 插图 / emoji / 渐变 / 玻璃拟态。文字承担情绪。
- 按钮本 story **不接归档逻辑**（Epic 2 才接 dropzone/modal）；可先 `type="button"` 无 handler 或留 `TODO(Epic 2)`。
- a11y：组件外层 `<main>` 或被 page 的 `<main id="main">` 包裹；按钮可聚焦、焦点环生效。

### Voice 字典（`web/lib/voice.ts`，逐字取自 EXPERIENCE.md）

至少包含（结构可用嵌套对象，键名自拟，**值逐字一致**）：

| 语义键 | 值（逐字） |
|---|---|
| timeline.empty.headline | `还没有 Entry。` |
| timeline.empty.desc | `从这里开始。` |
| archive.uploading | `上传中……` |
| archive.failed | `上传失败。请重试。` |
| archive.success | `已归档。` |
| archive.success.detail | `已归档。原文件在档案库中。` |
| delete.confirm.title | `确认删除？` |
| delete.confirm.body | `删除后无法恢复。` |
| delete.done | `已删除。原始 .html 已不在档案库中。` |
| render.failed | `渲染未能完成。` |
| loading | `正在加载……` |
| ui.cancel | `取消` |
| ui.confirm | `确认` |
| ui.archive | `归档` |

> Voice 铁律（EXPERIENCE.md）：句号收束、**无 emoji / 无感叹号**、数字优先、不堆副词、不预测下一步。删除文案必须含"无法恢复"明示（safety affordance）。

### 响应式断点（DESIGN.md + EXPERIENCE.md，严格一致 —— 本 story 仅 Empty State 居中，断点表供 Epic 3 网格用，先在 `@theme` 里备好 `--breakpoint-*` 可选）

| 断点 | 时间线列数 | 左右 margin |
|---|---|---|
| `≥1440px` | 4 列 | 56px |
| `1024–1440px` | 3 列 | 桌面中档 |
| `768–1024px` | 2 列 | 32px |
| `<768px` | 1 列 | 20px |

> Tailwind v4 默认断点 `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`。DESIGN 用 768/1024/1440 —— Epic 3 实现网格时可在 `@theme` 覆盖 `--breakpoint-*`。本 story 不做网格，无需现在改断点；EmptyState 居中用 flex 即可。

### Project Structure Notes

- 新建：`web/components/EmptyState.tsx`（`web/components/` 为新目录）、`web/lib/voice.ts`（`web/lib/` 已存在）。
- 修改：`web/app/globals.css`、`web/app/layout.tsx`、`web/app/page.tsx`、`web/app/auth/{signin,verify-request,error}/page.tsx`。
- **不创建** `tailwind.config.ts`（见关键偏差 1）。**不**引入 shadcn/MUI/Radix（EXPERIENCE.md：未绑定外部 UI 库，token 直接定义视觉）。
- **不**做 PWA / service worker（原型有，web/ 不搬；PRD §6.2 V1 不做）。

### Testing 要求

- 架构 defer 测试框架，验收 = `tsc` + `eslint` + `next build` 全绿 + 人工视觉验收（与 1.1–1.3 一致）。
- dev 自检清单：①亮色 `#FAF8F3` 暖白底 + 衬线；②系统切暗 → `#1A1B19` + `#E0C1A1` 暖米主色自动生效；③Tab → 2px 深棕焦点环；④系统开 reduced-motion → 无动画；⑤auth 三页视觉 token 化且逻辑未变（diff 验证）。
- ⚠️ 人工验收点（交 alex）：CJK 衬线在 alex 的 Mac 上是否渲染为**衬线**（Songti SC 生效），而非无衬线兜底。

### References

- [Source: _bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md] — 全部颜色/字体/间距/圆角/阴影 token（frontmatter）+ Colors/Typography/Layout/Elevation/Shapes/Components/Empty State/Do's&Don'ts；暗色 V1 承诺见 line 189。
- [Source: …/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md] — Voice & Tone 文案字典（lines 49–68）、Empty State 行为（line 87/94）、Accessibility Floor（focus ring / reduced-motion / lang）、Responsive & Platform 断点（lines 230–243）、无 Settings/无切换器（line 43-44）。
- [Source: …/ux-designs/.../mockups/timeline-mock.html · full-render-mock.html] — token 的具体 CSS 实现参考（颜色 var、`@media prefers-color-scheme`、组件类）；**spine 与 mock 冲突时 spine 胜**。
- [Source: _bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/epic-1-私人空间foundation-private-access.md#story-14] — Story 1.4 原始 user story + AC（**注意其 tailwind.config.ts 假设已按偏差 1 修正**）。
- [Source: web/node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md] — next/font API、`@theme inline` 字体桥接示例、多字体 definitions 文件、preloading；[01-getting-started/13-fonts.md]、[11-css.md] Tailwind v4 `@import`。
- [Source: web/node_modules/.../@next/font/dist/google/font-data.json + validate-google-font-function-call.js] — CJK 无 chinese subset、`preload:false` 强制（偏差 2 的权威依据）。
- [Source: 原型 prototype/pwa-explore/app/globals.css · layout.tsx] — 早期实现参考（Google Fonts CDN + `@theme inline` + prefers-color-scheme 暗色）；web/ 改用 next/font 而非 CDN link。
- Tailwind v4 官方：Theme variables / Dark mode（默认 `dark:` 即跟随 prefers-color-scheme）/ `@theme` vs `@theme inline`。

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m]（Claude Opus 4.8 · 1M context），经 bmad-dev-story workflow。

### Debug Log References

- `next build`（Turbopack）因 `fonts.gstatic.com` 连接偶发抖动失败：`next/font/google` 在构建期下载并自托管字体，CJK 变体字体（Noto Serif/Sans SC）有数十个 unicode-range 分块，每次构建随机掉 ~1 块 → `Module not found: @vercel/turbopack-next/internal/font/google/font`。**非配置问题**（`preload:false` 已按偏差 2 正确设置；沙箱探测确认 gstatic 单块 ~8s 且偶发连接失败）。无累积缓存，重试为掷骰；attempt 4 全绿（`✓ Compiled successfully in 12.8s`，7/7 静态页）。已登记 deferred-work.md（CJK 自托管子集 + CI 网络脆弱性）。
- typecheck（`tsc --noEmit`）、lint（`eslint`）一次通过，零告警。

### Completion Notes List

**实现内容（逐任务）**：layout.tsx 五字体（Latin: Newsreader+opsz / Inter / JetBrains_Mono，preload 默认 true；CJK: Noto_Serif_SC / Noto_Sans_SC，`preload:false`）+ skip link + MindPrint metadata；globals.css 全套 Tailwind v4 token（亮/暗双 `:root` + `@theme inline` 颜色/阴影/字体 + `@theme` 静态 spacing/radius/text）；EmptyState（Server Component，纯文字无 icon）；`/` 首页落 EmptyState；voice.ts COPY（14 条）；auth 三页 token 化（仅视觉）。

**字体核对**：5 款均对照 installed `@next/font .../font-data.json` 验证 —— Newsreader/Inter 确有 `opsz` 轴、JetBrains Mono 仅 `wght`、Noto Serif/Sans SC 确**无任何 chinese subset**（强制 `preload:false`，否则 `google-fonts-missing-subsets` 构建错误）。

**对 Dev Notes skeleton 的 4 处必要修正（均为忠实落地 AC 所需）**：
1. **focus 焦点环用 `var(--primary)` 而非 skeleton 的 `var(--color-primary)`** —— `@theme inline` 不会把 `--color-*` 输出为 `:root` 变量，原写法在裸 CSS 规则里取到未定义值 → 焦点环失色（AC16 a11y 失败）。已编译 CSS 确认 `focus-visible{outline:2px solid var(--primary)}` 正确生成。
2. **display-lg 用 `clamp(2.25rem, 1.53rem + 3.05vw, 3rem)`** 实现移动 36px→桌面 48px（AC item 8「响应式或 clamp」）；skeleton 的平值 `48px` 仅桌面锚点。已编译确认 clamp 落地。
3. **补全 `error-container` / `on-error-container` / `inverse-surface` / `inverse-on-surface` 到 `@theme inline`** —— skeleton 漏映射，AC1 item 1 明列「error 系 / inverse 系」需定义并（item 3）映射为 token。
4. **EmptyState CTA「归档第一份」并入 `COPY.timeline.empty.cta`**（microcopy 单一来源）；该串源自 epic/story 规格、已标注，其余 ≥12 条逐字取自 EXPERIENCE.md（满足 AC6）。

**安全红线（AC8/Task6）**：`git diff` 确认 auth 三页仅 className + 新增 `<main id="main">` 变化；`sendMagicLink` Server Action、`isAllowedEmail`、`redirect`、`signIn`、`Link href`、可见文案全部逐字未动。

**编译产物核实**（防 Tailwind v4 对未知工具类静默跳过）：`var(--primary)`/`#735c41`+`#e0c1a1`（暗色覆盖）/`var(--text-display-lg)`+修饰/`var(--text-mono-metadata)`/`var(--text-label-caps)`/`var(--shadow-rest)`/`var(--spacing-margin-mobile)`/`var(--radius)`(裸 rounded=4px)/`prefers-color-scheme:dark`/`prefers-reduced-motion`/`focus-visible` outline 均在编译 CSS 中确认存在；`font-serif` 正确内联为完整字体栈。

**⚠️ AC21 人工验收清单（交 alex 在浏览器肉眼确认 —— 设计上的人工验收点；本环境无浏览器无法实拍）**：
1. `cd web && npm run dev`，登录后访问 `/`（未登录会被 proxy 跳 `/auth/signin`）。
2. **亮色**：暖白底 `#FAF8F3`、大标题「还没有 Entry。」为**衬线**、深棕主按钮。
3. **系统切暗色**：底自动变 `#1A1B19`、文字象牙白、主按钮暖米 `#E0C1A1`——**无需任何操作、无切换器**。
4. **Tab 键**：焦点落到 skip link / 按钮 / input 时出现 2px 深棕焦点环。
5. **系统开「减少动态效果」**：按钮 hover 无过渡动画。
6. **关键点**：标题与描述的 CJK 是否在你的 Mac 上渲染为**衬线**（Songti SC 生效），而非无衬线兜底。

### File List

- `web/app/layout.tsx` — 修改（五字体 next/font 实例化 + skip link + metadata）
- `web/app/globals.css` — 修改（整体替换为 Tailwind v4 token 系统）
- `web/app/page.tsx` — 修改（脚手架 → EmptyState）
- `web/components/EmptyState.tsx` — 新建
- `web/lib/voice.ts` — 新建
- `web/app/auth/signin/page.tsx` — 修改（仅视觉 className + `id="main"`）
- `web/app/auth/verify-request/page.tsx` — 修改（仅视觉 className + `id="main"`）
- `web/app/auth/error/page.tsx` — 修改（仅视觉 className + `id="main"`）
- `_bmad-output/implementation-artifacts/deferred-work.md` — 追加 Story 1.4 遗留项（CJK 自托管 + 构建网络脆弱性）

## Senior Developer Review (Codex)

**评审者**：Codex CLI（`codex exec review`，只读沙箱）· **日期**：2026-06-02 · **范围**：Story 1.4 全部未提交改动（`web/` 源码 + 新建文件）

**结论**：Changes Requested → **已全部解决**。仅 2 项视觉 token 偏差（P2 / P3），无 High、无安全问题。

**🔒 安全红线（AC8 / Task 6）结论：PASS** —— Codex 独立核对确认 auth 三页（signin / verify-request / error）本次 diff 仅新增 `id` / className / JSX 标记；`sendMagicLink` Server Action、`isAllowedEmail`、`redirect`、`signIn('resend', …)`、`Link href`、可见文案**均无逻辑改动**。

### Action Items（Review Follow-ups）

- [x] **[P2] 暗色 `surface-container-lowest` / `surface-container-highest` 仍解析为亮色** — `web/app/globals.css`。暗色 `@media` 块只覆盖了 low/container/high，但这两档（亮色 `#ffffff` / `#e4e0d5`）经 `@theme inline` 暴露为 `bg-surface-container-lowest/-highest` 工具类 → 暗色模式下会出现亮面板。**已修**：暗色块补 `--surface-container-lowest:#131410`（最暗，低于 surface）/ `--surface-container-highest:#3d3e33`（最亮抬升层），按 Material 3 色阶倒置 + 现有暗梯度推导。
  - ⚠️ 根因是 **DESIGN.md 暗色 frontmatter 未列这两档**（只给了 4 档暗色 surface）；建议后续把这两个补值同步登记进 DESIGN.md，使设计源与实装一致。
- [x] **[P3] 主按钮垂直 padding `py-2.5`(10px) 偏离 DESIGN.md** — DESIGN.md `button-primary.padding: '8px 20px'` 为权威值（story Dev Notes skeleton 的 `py-2.5` 为笔误）。**已修**：`py-2.5`→`py-2`(8px)、保留 `px-5`(20px)，影响 `EmptyState.tsx` 主 CTA + `auth/signin`(提交按钮) + `auth/error`(返回按钮) 三处。

**修复后复跑**：`tsc` ✅ · `eslint` ✅（双绿）。`next build` 见 Completion Notes 的 gstatic 网络说明（代码已证可构建；本次修复仅 CSS 值 + `py-2` 既有工具类，不影响构建成败）。

## Change Log

| 日期 | 变更 | 作者 |
|---|---|---|
| 2026-06-01 | 实现 Story 1.4 视觉系统：Tailwind v4 CSS-first tokens（亮/暗跟随系统）、next/font 五字体（CJK `preload:false`）、EmptyState、voice 字典（14 条）、auth 三页 token 化（逻辑零改）、a11y 基线（skip link / focus ring / reduced-motion / color-scheme）；tsc + eslint + build 全绿 | Amelia (dev) |
| 2026-06-02 | Codex 代码评审：安全红线 PASS；解决 P2（暗色 `surface-container-lowest/highest` 补 `#131410`/`#3d3e33`）+ P3（主按钮 `py-2.5`→`py-2` 对齐 DESIGN.md 8px，含 auth 两处）；tsc + eslint 复跑全绿 | Amelia (dev) + Codex (review) |
| 2026-06-02 | 状态 review → **done**（alex 确认验收，含 AC21 浏览器明/暗 + Mac CJK 衬线肉眼验收） | alex |
