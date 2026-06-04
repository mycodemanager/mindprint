---
baseline_commit: 241598e
---

# Story 3.2: 卡片网格（EntryCard + MonthDivider + ThumbnailIframe）

Status: review

<!-- Epic 3 第 2/5 story。把 3.1 的 Timeline 空壳填成真实卡片网格：EntryCard（标题+时间+缩略）+ MonthDivider（月份分隔）+ ThumbnailIframe（视口懒渲染沙箱 iframe）。
     纯代码 story（无 ops）。完成后主屏真正"可浏览"：按月分组的卡片网格 + 每卡 HTML 内容缩略 + 单击进 Full Render。
     与 3.1 攒一起 push（3.1 单独上线是空时间线壳；3.2 补齐网格后 prod 才连贯）。
     🚨 头号澄清：缩略 iframe 用 `src=/api/entry/[id]/html`（**非 srcDoc**）—— Epic AC 覆盖架构示例与 2.3 dev-note 的 srcDoc 提法，理由见 Dev Notes。 -->

## Story

As alex,
I want 每个 Entry 以卡片呈现（HTML 缩略经 IntersectionObserver 懒渲染 + 标题 + 时间），卡片按月份分隔条分组，网格响应式,
so that 我能可视化浏览档案库、按月感受思维演进。

## Acceptance Criteria（源自 Epic 3 Story 3.2）

**AC1 — `ThumbnailIframe`（`web/components/ThumbnailIframe.tsx`，新建，`'use client'`）**
- 接收 `{ entry: Entry }`（需 `id` 作 src、`title` 作 a11y/fallback、`archivedAt` 作 fallback 时间）。
- **IntersectionObserver 视口懒挂载**：`rootMargin: '200px'`；首次进入视口 → `setInView(true)` 后 **`observer.disconnect()`**（一次性，挂载后不再卸载、不重复 fetch）。`useEffect` 内创建/清理 observer。
- **视口外**：渲染 `bg-surface-container` 占位（不挂载 iframe）。
- **视口内**：渲染 iframe（逐字采用 Epic AC，注意是 **`src` 非 `srcDoc`**）：
  ```tsx
  <iframe
    src={`/api/entry/${entry.id}/html`}
    sandbox=""
    loading="lazy"
    title={`${entry.title} 内容缩略`}
    aria-hidden="true"
    tabIndex={-1}
    onError={() => setLoadFailed(true)}
    className="absolute inset-0 origin-top-left pointer-events-none"
    style={{ width: '250%', height: '250%', transform: 'scale(0.4)', border: 'none' }}
  />
  ```
  - **`sandbox=""` 空属性**（NFR-1，禁 `allow-*`）。`/api/entry/[id]/html` 是同源、已带 auth + `Content-Security-Policy: sandbox`（2.3 就位）；iframe 同源请求自动带 alex 会话 cookie → route 的 `requireAlex()` 通过（与 Full Render 同一安全模型）。
- **加载失败兜底**：`onError` → `loadFailed` → 该卡缩略区**退化为「标题 + 时间」占位**（serif 标题 + `absoluteTime`，`bg-surface-container`）。**禁退化到文本摘要**（FR-4 静默降级禁止条）。其他卡不受影响（NFR-3 错误隔离——每卡独立 client 实例）。

**AC2 — `EntryCard`（`web/components/EntryCard.tsx`，占位空壳 → 实装，保持 Server Component）**
- `<Link href={`/entry/${entry.id}`}>` 包裹整卡（单击整卡进 Full Render，FR-4 D14）：
  - **上半**：`relative aspect-[4/3] overflow-hidden border-b border-outline-variant` 容器内放 `<ThumbnailIframe entry={entry} />`（缩略视觉主体）。
  - **下半**（`p-card-padding` 16px，`flex flex-col gap-2`）：
    - `<h3 className="font-serif text-headline-sm text-on-surface line-clamp-3" title={entry.title}>{entry.title}</h3>`
    - `<time dateTime={entry.archivedAt} title={absoluteTime(entry.archivedAt)} className="font-sans text-caption text-on-surface-variant">{relativeTime(entry.archivedAt)}</time>`
- 卡片视觉：`rounded-lg border border-outline-variant bg-surface-container-low overflow-hidden shadow-card-rest`。
- **hover**：`hover:shadow-card-hover` + 轻微 `hover:-translate-y-px`（translateY -1px）+ `transition`（reduced-motion 下 globals.css 全局压平）。`focus-visible:shadow-card-hover` 键盘可见。
- `aria-label={`${entry.title}，归档于 ${absoluteTime(entry.archivedAt)}`}`（整卡 Link 上）。
- **禁** hover overlay 按钮（管理动作集中 Full Render，DESIGN Don't）。

**AC3 — `MonthDivider`（`web/components/MonthDivider.tsx`，占位空壳 → 实装，Server Component）**
- props 维持 `{ label: string; count: number }`（Timeline 传 `group.label`="2026 年 5 月" + `group.entries.length`）。
- 渲染：左对齐 `<h2 className="font-serif text-headline-md text-on-surface">{label}</h2>` + 右侧延伸到边缘的 **1px dust 横线**（`flex-1 h-px bg-outline-variant` `aria-hidden`）；容器 `flex items-baseline` + **上下 editorial-gap**（`pt-editorial-gap pb-6 first:pt-0` 避免首行双倍间距）。
- **sr-only 计数宣告**：`<span className="sr-only">{`${label}，${count} 份 Entry`}</span>`（视觉上**不显示**数字——DESIGN 月份分隔条仅月份大字 + 横线）。
- **不可交互、不可折叠**（PRD D11；纯视觉/语义节奏标记，非导航元素）。
- ⚠️ 字号取 **`text-headline-md`(28px)**——见 Dev Notes「MonthDivider 字号（headline-md 非 display-lg）」。

**AC4 — `Timeline` 网格装配（`web/components/Timeline.tsx`，3.1 壳 → 填网格）**
- **保持 3.1 的 sticky header 不动**（wordmark + SortToggle/归档占位）；只填 `<main id="main">` 内容。
- `const groups = groupByMonth(sortEntries(entries, sort));`（两个纯函数已就位；见 Dev Notes 为何 getEntries 已排序仍再 sortEntries）。
- 每组渲染：
  ```tsx
  <section key={g.yearMonth} aria-label={g.label}>
    <MonthDivider label={g.label} count={g.entries.length} />
    <div className="grid grid-cols-1 gap-card-gap md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {g.entries.map((e) => <EntryCard key={e.id} entry={e} />)}
    </div>
  </section>
  ```
- import `groupByMonth` / `sortEntries` / `EntryCard` / `MonthDivider`。删除 3.1 main 内的占位 TODO。

**AC5 — 懒渲染 + 失败隔离验证**
- 主屏 ≥ 10 卡 scroll：视口内卡的 iframe 已挂载；视口外为 `surface-container` 占位；scroll 进入视口 → iframe 挂载。
- 一张卡 iframe load 失败 → 该卡退化「标题 + 时间」占位，**其他卡正常**。
- ≥ 5 Entry 跨 ≥ 2 月份 → 见 ≥ 2 月份分隔条，每月内按归档序；单击卡 → `/entry/{id}` Full Render。

**AC6 — 验证 + 范围纪律**
- `npm run typecheck` + `npm run lint` 绿（0/0）。
- RSC 边界：`EntryCard` / `MonthDivider` 保持 **Server Component**；`ThumbnailIframe` 是唯一 `'use client'`（IntersectionObserver 浏览器 API）。Server 组件渲染 client 子组件（EntryCard → ThumbnailIframe）合法。
- **grid 类与 `app/loading.tsx` skeleton 一致**：两处都 `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card-gap`（3.1 已埋；改一处须改两处，否则 cold-load 抖动）。
- 范围（**不做**）：SortToggle / 归档按钮真功能（→ 3.3，仍是 3.1 占位）；4 断点 margin 精调 / 移动端退化 / hover `@media(hover:hover)` 门控（→ 3.5）；Full Render 导航（→ 3.4）。

## Tasks / Subtasks

> 纯 `[code·dev]` story（无 ops）。顺序：叶子组件（ThumbnailIframe → EntryCard / MonthDivider）→ Timeline 装配 → 验证。

- [x] **T1 `ThumbnailIframe`（AC1，新建 `'use client'`）**
  - [x] `useRef` 容器 + `useState` inView/loadFailed；`useEffect` 内 IntersectionObserver(`rootMargin:'200px'`)，命中即 setInView + disconnect（一次性）。
  - [x] 视口外 `bg-surface-container` 占位；视口内 iframe（**`src=/api/entry/[id]/html`**、`sandbox=""`、scale 0.4、pointer-events-none、aria-hidden、tabIndex -1、onError→loadFailed）。
  - [x] loadFailed → 「标题 + `absoluteTime`」占位（serif，`bg-surface-container`），**禁文本摘要**。
- [x] **T2 `EntryCard`（AC2，空壳 → 实装，Server Component）**
  - [x] 平移 prototype EntryCard 结构（去 mock 二元性/`isUserEntry`/user 角标/srcDoc 分支）；裸值换 token（`text-[20px]`→`text-headline-sm`、`text-[13px]`→`text-caption`、`px-4 py-4`→`p-card-padding`）。
  - [x] 缩略容器内放 `<ThumbnailIframe entry={entry} />`；下半 h3(line-clamp-3 + title) + `<time>`(relativeTime + dateTime + title=absoluteTime)。
  - [x] hover：`hover:shadow-card-hover hover:-translate-y-px transition` + `focus-visible:shadow-card-hover`；整卡 `aria-label`。
- [x] **T3 `MonthDivider`（AC3，空壳 → 实装，Server Component）**
  - [x] h2 `font-serif text-headline-md` 月份 + `flex-1 h-px bg-outline-variant`(aria-hidden) 横线；容器 `flex items-baseline pt-editorial-gap pb-6 first:pt-0`。
  - [x] sr-only 计数 span；不可交互/不折叠。
- [x] **T4 `Timeline` 装配（AC4，壳 → 网格）**
  - [x] import groupByMonth/sortEntries/EntryCard/MonthDivider；`groupByMonth(sortEntries(entries,sort))` → section（aria-label）+ MonthDivider + grid + EntryCard map。保持 sticky header 不动；删占位 TODO。
- [x] **T5 验证（AC6）**
  - [x] `npm run typecheck` + `npm run lint` 绿（实跑 0/0；用 `npm --prefix …/web run …`）。
  - [x] RSC 边界自查（EntryCard/MonthDivider Server；ThumbnailIframe 唯一 client）。
  - [x] grid 类与 loading.tsx 一致核对（两处均 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card-gap`）；范围纪律自查。
  - [x] 运行时/视觉验收（懒渲染/失败隔离/跨月分组/单击进 Full Render）需登录态浏览器 → 并入 3.1+3.2 push 后的 alex 生产验收（本机 next build 受 gstatic flake 阻断 → Vercel 权威）。

## Dev Notes

### 本 story 边界
- **做**：ThumbnailIframe（新建 client）+ EntryCard 实装 + MonthDivider 实装 + Timeline 网格装配。完成主屏"真实可浏览"（卡片网格 + 月份分隔 + 缩略懒渲染 + 单击进 Full Render）。
- **不做**：SortToggle / 归档按钮真功能（→ 3.3，仍 3.1 占位）；4 断点响应式精调 + 移动端退化 + hover 门控（→ 3.5）；Full Render 上一/下一+键盘（→ 3.4）；不引入 SWR/TanStack（RSC 直查）。

### 🚨 缩略 iframe 用 `src` 不是 `srcDoc`（头号澄清——必读，防被架构/2.3 误导）
- **本 story ThumbnailIframe 用 `src={`/api/entry/${entry.id}/html`}`，不是 `srcDoc`。** Epic 3.2 AC 明确如此。
- ⚠️ **两处会误导你写成 srcDoc**：① 架构 [implementation-patterns "Good Example · iframe 沙箱化"](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md) 给的 EntryCard 示例是 `srcDoc={htmlContent}`；② Story 2.3 dev-note 写过"srcDoc 留给 Epic 3 的 EntryCard 缩略图"。**两者均被 Epic 3.2 AC 取代。**
- **为何 src 胜出**：`srcDoc` 需把每个 Entry 的**完整 HTML 内联进 RSC/页面 payload**——时间线一次渲染 N 张卡 = N 份完整 HTML（可达数 MB/份）灌进首屏 payload，臃肿且违背懒渲染初衷。`src=route handler` 配 **IntersectionObserver 懒挂载**：只有进入视口（200px 内）的卡才发请求、才从 R2 流式取 HTML，首屏 payload 不含任何 Entry HTML。这正是 Epic 选 src + IO 的理由。
- **安全等价**：`sandbox=""`（无 `allow-same-origin`/`allow-scripts`）下，`src`（同源 route）加载的文档获 opaque origin + 禁 script，与 srcDoc 同等满足 NFR-1。route 响应另带 `Content-Security-Policy: sandbox`（2.3 P1 修复）双保险。
- **route 已就位且已鉴权**（[route.ts](web/app/api/entry/[id]/html/route.ts)）：requireAlex catch→401 空 / getEntryById→404 / R2 流式。iframe 同源 src 请求自动带 alex 会话 cookie → 已登录 alex 通过（与 Full Render iframe 同一链路，2.3 已端到端验过）。**本 story 不改 route。**
- **性能权衡（已知，非阻塞）**：每张可见卡 = 1 次请求拉**完整** HTML 渲染缩略（scale 0.4）。V1 ≤ 50 Entry + 懒挂载（仅近视口卡发请求）可接受；M3 retro 若卡顿再评估专用快照/缓存端点（appendix-m3-retro-watch-list 已挂账）。

### ThumbnailIframe 实现要点（唯一 client 组件）
- **必须 `'use client'`**：IntersectionObserver 是浏览器 API。EntryCard（Server）渲染 `<ThumbnailIframe>`（client）作子节点合法（Server→Client 传可序列化 `entry` props）。
- **一次性挂载**：命中视口即 `setInView(true)` + `observer.disconnect()`；**挂载后不卸载**（scroll 离开视口仍保留，避免重复 fetch 抖动）。
- **失败隔离**：每卡一个独立 ThumbnailIframe 实例，`loadFailed` 是局部 state；一卡失败不影响他卡（NFR-3）。`onError` 仅捕获 iframe 元素加载错误；opaque iframe 内部资源错误宿主不可观测（与 2.3 一致），V1 以 `onError` 兜底为限。
- **fallback 文案**：缩略失败显示「标题 + 时间」——标题来自 `entry.title`、时间用 `absoluteTime(entry.archivedAt)`（确定性，无 `Date.now()` → client 无 hydration 隐患）；**禁**解析 HTML 出文本摘要。注：卡下半本就有标题+时间，缩略区 fallback 是冗余但符合 spec 的"不留破图"。
- **占位/失败底色**：`bg-surface-container`（比卡片 `surface-container-low` 深一档，[EXPERIENCE State Patterns](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md)）。
- IntersectionObserver root margin `200px` 是 best guess（Epic 实现说明）；M3 retro 按滚动体验调。

### EntryCard 平移（prototype → 净化 + token 化）
- [prototype EntryCard](prototype/pwa-explore/components/EntryCard.tsx) 是模板。**砍掉**：`isUserEntry`/`AnyEntry`/`@/lib/mock-entries` 依赖、user 角标、`srcDoc`-vs-`src` 二元分支、内联 `<iframe>`（改为 `<ThumbnailIframe entry={entry} />`）。**保留**：Link 包裹 + 卡片视觉骨架 + 缩略容器 `aspect-[4/3]` + h3/time 结构。
- **裸值换 token**（架构 Enforcement #9）：`text-[20px]`→`text-headline-sm`、`text-[13px]`→`text-caption`、`px-4 py-4`→`p-card-padding`、阴影用 `shadow-card-rest`/`shadow-card-hover`（[globals.css](web/app/globals.css)）。
- **hover 抬起**：prototype 只有 shadow；Epic AC 要 shadow + `translateY(-1px)` → 加 `hover:-translate-y-px hover:shadow-card-hover transition`。reduced-motion 下 globals.css 已全局压平 transition（[globals.css:187](web/app/globals.css)），无需额外处理。`@media (hover:hover)` 门控（防移动端 tap 触发抬起）属 **Story 3.5**，本 story 用 `hover:` 工具类即可。
- `relativeTime` 在 Server Component 内渲染（EntryCard 是 server）——`Date.now()` 在 server 渲染时求值，无 client 水合不一致（EntryCard 不 hydrate）。
- 缩略容器 + iframe `pointer-events-none`：整卡单击走 Link，不响应 HTML 内部 click。`line-clamp-3` 是 Tailwind 内建工具类（v4 含）。

### MonthDivider 字号（headline-md 非 display-lg）+ 计数 sr-only
- **取 `text-headline-md`(28px)**。Epic 文档内部有冲突：Epic 顶部 Implementation Scope 写"display-lg 衬线大字"，但 **Story 3.2 AC、DESIGN 组件 token（`components.month-divider.typography: {typography.headline-md}`）、DESIGN Components.Month Divider 正文、prototype（`text-[28px]`）四处一致为 headline-md** → 取 headline-md。（DESIGN Typography 段"display-lg 出现在月份分隔条"是泛述，被组件级精确 spec 覆盖。）
- **计数 sr-only 不可见**：DESIGN 月份分隔条只有"月份大字 + 1px dust 横线"，无可见数字；count 仅入 `sr-only` 宣告（EXPERIENCE a11y："屏幕阅读器宣告 {年}年{月}，{N} 份 Entry"）。prototype 把"N 份"画出来了——本 story 按 DESIGN/AC 收进 sr-only。
- 横线延伸到右边缘：`flex-1 h-px bg-outline-variant`（prototype 即此）。`first:pt-0` 让首个分隔条不顶 64px 空。**不可折叠/不可交互**（PRD D11）。

### Timeline 装配（保持 3.1 header，仅填 main）
- 3.1 已建 sticky header（wordmark Link + SortToggle/归档占位）+ `<main id="main" aria-label="时间线，N 份 Entry">` 空壳。**本 story 只在 main 内填网格**，header 一字不动（SortToggle/归档真功能仍是 3.3）。
- `groupByMonth(sortEntries(entries, sort))`：`getEntries` 已在 DB 层按 archivedAt 排序，这里再 `sortEntries` 是**有意冗余**——纯函数驱动分组（groupByMonth 按遇见顺序成组、组内保序），保证 month section 顺序与卡序都跟随 `sort`。两者并存是架构数据流既定（[project-structure 时间线渲染流](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)）。
- section 用 `aria-label={g.label}`（或 `aria-labelledby` 指向 MonthDivider h2 的 id——任选其一，避免 SR 双重宣告）。
- **grid 类 == loading.tsx skeleton**（`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card-gap`）：3.1 的 [app/loading.tsx](web/app/loading.tsx) 已用此组类，本 story EntryCard 网格必须一致 → skeleton→真实零抖动。**改列数/断点须两处同步**（3.5 精调时尤其注意；loading.tsx 顶部已留漂移警告注释）。

### Next 16 / RSC 边界 / token（AGENTS.md：写码前查 `node_modules/next/dist/docs/`）
- EntryCard/MonthDivider/Timeline 均 Server Component（默认）；ThumbnailIframe 是本 story 唯一 `'use client'`。Server 渲染 Client 子组件合法；**Client 不可被 Server import 其 hook**——ThumbnailIframe 自身完整封装 IO 逻辑，EntryCard 只当子元素用。
- `next/link` 的 `<Link>`（EntryCard）；`<iframe>` 是 DOM 元素非 React 组件。
- token class 一律照现成（[globals.css](web/app/globals.css)）；禁裸 px/hex；暗色自动跟随。可用：`bg-surface-container-low`/`bg-surface-container`/`border-outline-variant`/`rounded-lg`/`shadow-card-rest`/`shadow-card-hover`/`text-headline-sm`/`text-headline-md`/`text-caption`/`p-card-padding`/`gap-card-gap`/`pt-editorial-gap`/`line-clamp-3`/`-translate-y-px`/`aspect-[4/3]`。

### 来自 Story 3.1 / 2.3 的就绪件（previous story intelligence）
- ✅ **Timeline 壳**（3.1，[Timeline.tsx](web/components/Timeline.tsx)）：sticky header + `<main id="main">` 空壳 + props `{entries, sort}` 就位——本 story 填 main。
- ✅ **getEntries(sort)**（3.1，[queries.ts](web/lib/db/queries.ts)）已 DB 排序返回；page.tsx 已把 entries 传进 Timeline。**本 story 不碰 page/queries。**
- ✅ **HTML 代理 route**（2.3，[route.ts](web/app/api/entry/[id]/html/route.ts)）：缩略 iframe 的 src 目标，已 auth + CSP sandbox + R2 流式。**不改。**
- ✅ 纯函数：`groupByMonth`([group-by-month.ts](web/lib/entry/group-by-month.ts)) / `sortEntries`([sort-entries.ts](web/lib/entry/sort-entries.ts)) / `relativeTime`([relative-time.ts](web/lib/entry/relative-time.ts)) / `absoluteTime`([absolute-time.ts](web/lib/entry/absolute-time.ts))——全部就位，直接 import。
- ✅ `EntryGroup<T>` 类型（[types.ts](web/lib/entry/types.ts)：`{ yearMonth, label, entries }`）——groupByMonth 返回此结构。
- ✅ **loading.tsx skeleton**（3.1）已按本 story 卡片结构（`aspect-[4/3]` + `surface-container-low` + 同 grid 类）搭好——EntryCard 真实结构须与之对齐。
- ✅ EntryCard/MonthDivider 当前是占位空壳（props 已对：EntryCard `{entry}`、MonthDivider `{label, count}`）。
- ✅ 无新增必需 env / 无新依赖。

### git intelligence
- 最近 `241598e`（Story 3.1，本地 main，**未 push**）。本 story 续在 main 提交；**3.1 + 3.2 一起 push**（alex 定：3.1 单独上线是空时间线壳，3.2 补齐后 prod 才连贯）。commit message 末尾带 `Co-Authored-By: Claude Opus 4.8 (1M context)` trailer。
- 约定延续：每 story 单独 commit（3.1、3.2 各一）；token class 不造新值；文案走 voice.ts（本 story 预计无新增 voice 键，缩略 a11y title 用模板字符串内联）。

### Project Structure Notes
- **新增**：`web/components/ThumbnailIframe.tsx`（`'use client'`；架构 [project-structure](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md) 已列）。
- **修改**：`web/components/EntryCard.tsx`（空壳→实装）、`web/components/MonthDivider.tsx`（空壳→实装）、`web/components/Timeline.tsx`（壳→填网格）。
- 与架构目录结构严格一致；缩略 iframe 沙箱化落地 NFR-1（跨 FR-4）。

### 测试 / 验证
- `npm run typecheck` + `npm run lint`：必跑绿（0/0）。用 `npm --prefix /Users/alex/Developer/个人项目/实验/my-bmad-app/web run <script>` 形态（已授权、不弹窗）。
- 运行时/视觉（需登录 + 真实 Entry，`next dev` 或 alex 生产验收）：AC5 懒渲染（scroll 挂载）/ 失败隔离 / 跨月分组 / 单击进 Full Render。
- `next build` 本机受已知 fonts.gstatic CJK flake 阻断 → Vercel 权威构建。

### References
- Epic 3 Story 3.2 原文：[epic-3-...browse-timeline.md](_bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/epic-3-时间线浏览与思维演进回看browse-timeline.md#story-32-卡片网格entrycard--monthdivider--thumbnailiframe)
- 上一个 story（Timeline 壳 / getEntries / route / 就绪件）：[3-1-时间线主屏-skeleton.md](_bmad-output/implementation-artifacts/3-1-时间线主屏-skeleton.md)
- iframe 沙箱反例 + srcDoc 示例（**被 Epic 取代为 src**）/ 平移规则 / token：[implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)
- Card / Month Divider / Layout&Spacing / token 值：[DESIGN.md](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md)
- Card/Month Divider 行为 + Cold load/失败 State Patterns + a11y 宣告：[EXPERIENCE.md](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md)
- 视觉 mock（composition 参考，spine 冲突时 spine 胜）：`_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/mockups/timeline-mock.html`
- Next 16 须知：[web/AGENTS.md](web/AGENTS.md) + `node_modules/next/dist/docs/`
- 就绪件源码：[Timeline.tsx](web/components/Timeline.tsx) · [EntryCard.tsx](web/components/EntryCard.tsx) · [MonthDivider.tsx](web/components/MonthDivider.tsx) · [route.ts](web/app/api/entry/[id]/html/route.ts) · [group-by-month.ts](web/lib/entry/group-by-month.ts) · [sort-entries.ts](web/lib/entry/sort-entries.ts) · [relative-time.ts](web/lib/entry/relative-time.ts) · [absolute-time.ts](web/lib/entry/absolute-time.ts) · [prototype EntryCard](prototype/pwa-explore/components/EntryCard.tsx) · [prototype MonthDivider](prototype/pwa-explore/components/MonthDivider.tsx)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (1M context) · 2026-06-04

### Debug Log References

- 写码前按 [AGENTS.md](web/AGENTS.md) 查 `node_modules/next/dist/docs/`：确认 `'use client'` 组件可被 Server Component 当子节点渲染（RSC 标准）；iframe `src`+`sandbox=""` 沿用 2.3 已端到端验证的链路。
- `npm --prefix web run typecheck`（tsc --noEmit）：0 错误。
- `npm --prefix web run lint`（eslint）：0 错误 0 警告。
- 本机 `next build` 受已知 fonts.gstatic CJK flake 阻断（非本 story 代码）→ Vercel 权威构建 + alex 生产验收（3.1+3.2 一起 push 后）。

### Completion Notes List

**已完成（代码 + 静态验证）：**
- T1–T4：ThumbnailIframe（新建 client，IO 200px 一次性懒挂载 + `src` iframe + onError 兜底）/ EntryCard 实装（Link 整卡 + 缩略 + 标题/时间 + hover）/ MonthDivider 实装（headline-md + dust 横线 + sr-only 计数）/ Timeline 装配（`groupByMonth(sortEntries(entries,sort))` → section + grid + 卡）。
- 关键决策落地：① **缩略 iframe 用 `src=/api/entry/[id]/html`（非 srcDoc）**——覆盖架构示例与 2.3 dev-note，配 IO 懒挂载，避免首屏 payload 灌入全部 Entry HTML；② `sandbox=""` + 同源 src 带 cookie → route requireAlex 通过（沿用 2.3 链路，未改 route）；③ onError 兜底「标题 + absoluteTime」（确定性、无水合隐患，禁文本摘要）；④ 每卡独立 ThumbnailIframe → 失败隔离（NFR-3）；⑤ MonthDivider 取 **headline-md**（解 Epic 内部 display-lg/headline-md 冲突，从 Story AC + DESIGN 组件 token + 原型）；⑥ EntryCard 网格类与 loading.tsx skeleton 逐字一致 → cold-load 零抖动；⑦ 保持 3.1 sticky header 不动。
- typecheck + lint 绿；RSC 边界正确（EntryCard/MonthDivider/Timeline 均 Server；ThumbnailIframe 唯一 client、被 EntryCard 当子节点；无 server-only 泄漏）。

**范围纪律（按 Epic 划清，未做）：**
- SortToggle / 归档按钮真功能 → Story 3.3（仍 3.1 静态占位）。
- 4 断点响应式精调 + 移动端退化 + hover `@media(hover:hover)` 门控 → Story 3.5。
- Full Render 上一/下一 + 键盘 → Story 3.4。

**无新增依赖 / 无新增必需 env。** 缩略性能权衡（每可见卡拉完整 HTML 渲缩略）已知、懒挂载缓解，M3 retro 评估。

### File List

**新增：**
- `web/components/ThumbnailIframe.tsx`

**修改：**
- `web/components/EntryCard.tsx`（占位空壳 → 实装：Link 整卡 + ThumbnailIframe + 标题/时间 + hover；P2 收窄缩略 props）
- `web/components/MonthDivider.tsx`（占位空壳 → 实装：headline-md 月份 + dust 横线；P2 去 first:pt-0、P3 count 收进 h2 sr-only）
- `web/components/Timeline.tsx`（3.1 壳 → 填按月分组卡片网格；P2 section 接管 pt-editorial-gap、P3 去 section aria-label；sticky header 不变）

## Senior Developer Review (Codex)

**Reviewer**: Codex CLI（`codex review`，custom-prompt 模式 · 未提交改动全量）· 2026-06-04 · 对抗式
**Outcome**: Changes Requested → **已全部修复并复验**（typecheck + lint 0/0）。3 × P2 + 1 × P3，无 P1/High。Codex 确认 src-not-srcDoc 决策、IO 一次性懒挂载、`sandbox=""` 安全模型、`groupByMonth(sortEntries)` 分组排序均正确。

### Action Items（全部已解决）
- [x] **[P2] 收窄 ThumbnailIframe 的 client props** — `EntryCard.tsx` / `ThumbnailIframe.tsx`：ThumbnailIframe 是 Client Component，传整个 `entry` 会把 `r2ObjectKey`（含 userId/entryId 路径）、`originalFilename` 等序列化进 RSC flight payload 泄漏到浏览器。**已修**：props 收窄为 `Pick<Entry,'id'|'title'|'archivedAt'>`；EntryCard 只传这三字段。
- [x] **[P2] iframe 失败兜底不可达** — `ThumbnailIframe.tsx`：`/api/entry/[id]/html` 返 404/401 空响应时 iframe 不触发 `onError`（sandbox opaque + 导航完成），「标题+时间」兜底永不出现、用户只见空缩略。**已修**：进入视口后先 `fetch` 探活（读响应头即 `res.body.cancel()`，不下载完整 HTML），`res.ok` 才挂 iframe，否则置 failed → 兜底；保留 iframe `onError` 作网络层兜底。
- [x] **[P2] 跨月 editorial-gap 失效** — `MonthDivider.tsx` / `Timeline.tsx`：`first:pt-0` 放在 MonthDivider 根 div，而每个 divider 都是各自 `<section>` 首子 → 所有月份 pt-0，月间 64px 间距全丢。**已修**：`pt-editorial-gap first:pt-0` 移到 Timeline 的 `<section>`（首月不顶空、后续月份隔 64px）；MonthDivider 只留 `pb-6`（分隔条→网格间距）。
- [x] **[P3] 月份重复宣告** — `Timeline.tsx` / `MonthDivider.tsx`：section `aria-label` + h2 + sr-only 三处都念月份。**已修**：去掉 section `aria-label`；count 收进 h2 内 `sr-only` 后缀 → h2 单次宣告「{月份}，{N} 份 Entry」。

### Re-verification（2026-06-04）
- `npm --prefix web run typecheck` + `... run lint`：均通过（0/0）。
- 4 项均为静态/结构性修改，typecheck + 自查覆盖；懒渲染 / 失败兜底 / 跨月间距的可视验收并入 alex 生产验收（3.1+3.2 push 后）。
