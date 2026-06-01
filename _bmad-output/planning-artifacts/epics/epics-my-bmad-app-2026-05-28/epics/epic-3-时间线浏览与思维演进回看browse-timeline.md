# Epic 3: 时间线浏览与思维演进回看（Browse Timeline）

**Epic Goal**：实现"alex 浏览所有归档的 Entry + 按时间感受思维演进"的完整体验。完成后 alex 能在主屏看到所有 Entry 的卡片网格、按月份分组、双向排序，单击进入任一 Entry 的 Full Render，并通过键盘 ← / → 顺序回看。

**Implementation Scope**：
- 时间线主屏改造（`app/page.tsx` Server Component）—— 从 Empty State 升级为有 Entry 时的卡片网格
- `lib/db/queries.ts` 的 `getEntries(sort)` 查询函数
- groupByMonth + sortEntries 纯函数（已在 Epic 1 平移；本 Epic 接入）
- EntryCard 组件（标题 headline-sm + 时间 caption + 缩略预览容器）
- MonthDivider 组件（display-lg 衬线大字 + 1px dust 横线 + 不可交互）
- ThumbnailIframe 组件（`'use client'`，IntersectionObserver 视口懒渲染 + iframe `sandbox=""` + srcDoc + `transform: scale()`）
- 缩略预览生成失败 fallback（退化为"标题 + 时间"占位，**禁止静默降级到文本摘要**）
- SortToggle 组件（`'use client'`，URL search param `?sort=asc|desc`，不持久化）
- Empty State 完整版本（接入 timeline 上下文）
- Cold load skeleton（`app/loading.tsx` + 4-6 张占位卡片，layout 不抖动）
- Full Render **完整导航增强**：FullRenderTopChrome 增强（上一 ⟨ + 下一 ⟩ 按钮）+ FullRenderKeyboard 组件（← / → / Esc 监听，从 prototype 抽出）+ get-adjacent 纯函数（已平移）
- 4 断点响应式（Tailwind class + `EntryCard` grid + 网格列数 1 / 2 / 3 / 4）
- 移动端关键退化（拖拽 → 系统文件选择器 / hover 移除 / chrome 紧凑化 + ⋯ 转底部 sheet）

**FRs covered**: **FR-4** + **FR-5（导航增强）**
**NFRs covered**: NFR-1 缩略预览沙箱化（与 Epic 2 共享同一 iframe sandbox 模型）+ NFR-3 错误隔离软（缩略失败不阻塞 timeline）+ NFR-3 响应感软（懒渲染 + skeleton 实现 A4 / A7）
**UX-DRs covered**: UX-DR8（Card 完整视觉行为）+ UX-DR9（Month Divider）+ UX-DR18（Sort Toggle）+ UX-DR21（Cold load skeleton）+ UX-DR22（缩略懒渲染状态）+ UX-DR27（键盘快捷键）+ UX-DR28（移动端退化）+ UX-DR31（响应式断点）

**Standalone Test**：归档了 ≥ 5 条 Entry 的 alex 打开主屏 → 看到按归档时间倒序的卡片网格 + 月份分隔条 + 每张卡片含 HTML 内容缩略预览 → 单击"最早在前"切换 → 网格瞬间反转 → 单击任一卡 → 进入 Full Render → 按 → 进入下一条 → 按 Esc 返回时间线。

## Story 3.1: 时间线主屏 + Skeleton

As alex,
I want the main `/` page to switch from Empty State to a Timeline component when entries exist, with a skeleton placeholder during cold load,
So that I see immediate visual feedback when entries are being fetched and the page never feels frozen.

**Acceptance Criteria:**

**Given** db query
**When** 我在 `lib/db/queries.ts` 加 `getEntries(sort: 'desc' | 'asc' = 'desc'): Promise<Entry[]>`
**Then** 用 Drizzle 全量加载 + 按 archivedAt 排序

**Given** 主屏 Server Component
**When** 我更新 `web/app/page.tsx`
**Then** `await requireAlex()` 第一行
**And** 读 search param `?sort=`：`const sort = searchParams.sort === 'asc' ? 'asc' : 'desc'`
**And** `const allEntries = await getEntries(sort)`
**And** `allEntries.length === 0` → `<EmptyState />`
**And** else → `<Timeline entries={allEntries} sort={sort} />`

**Given** skeleton
**When** 我创建 `web/app/loading.tsx`
**Then** 渲染响应式 grid 含 4-6 surface-container-low 占位卡（aspect ratio 4:3 模拟缩略区）
**And** 顶部 header 占位（wordmark + 归档按钮位置）
**And** layout 与最终 timeline 一致，不抖动

**Given** Timeline Server Component 基础壳
**When** 我更新 `web/components/Timeline.tsx`
**Then** sticky header（wordmark "MindPrint" + 右侧 SortToggle / 归档按钮占位）
**And** main 按月分组容器
**And** entries 通过 props 传入

**Given** Cold load 体验
**When** alex 登录后首次访问 `/`
**Then** 看到 skeleton 瞬间 → DB 查询完成 → 渲染真实 Timeline 或 EmptyState
**And** 占位→真实转换无明显抖动

**Implementation Notes**:
- Next.js 16 RSC + Suspense 自动用 loading.tsx 作 fallback
- searchParams 在 Next.js 16 也是 Promise → 需 await
- 不引入 SWR/TanStack Query

## Story 3.2: 卡片网格（EntryCard + MonthDivider + ThumbnailIframe）

As alex,
I want each Entry shown as a card with HTML thumbnail (lazy-rendered via IntersectionObserver), title, and time; cards grouped under month dividers; the grid responsive,
So that I can browse my archive visually and feel my thinking evolution over months.

**Acceptance Criteria:**

**Given** EntryCard
**When** 我更新 `web/components/EntryCard.tsx` (Server Component)
**Then** 渲染 `<Link href={`/entry/${entry.id}`}>` 包裹：
- 上半：`<ThumbnailIframe entry={entry} />` (约 65% 高 + aspect 4:3)
- 下半 (card-padding 16px)：`<h3 className="font-serif text-headline-sm line-clamp-3">` + `<time dateTime={archivedAt} title={absoluteTime}>{relativeTime}</time>` caption
**And** 卡片 border 1px dust ghost outline + rounded.lg + bg-surface-container-low
**And** hover：shadow `card-hover` + 轻微 translateY(-1px)
**And** `aria-label={`${title}，归档于 ${absoluteTime}`}`

**Given** ThumbnailIframe
**When** 我创建 `web/components/ThumbnailIframe.tsx` (`'use client'`)
**Then**:
- IntersectionObserver root margin "200px"
- 视口外：bg-surface-container 占位
- 视口内：`<iframe src={"/api/entry/" + entry.id + "/html"} sandbox="" loading="lazy" title={`${title} 内容缩略`} aria-hidden="true" tabIndex={-1} className="absolute inset-0 origin-top-left pointer-events-none" style={{ width: '250%', height: '250%', transform: 'scale(0.4)', border: 'none' }} />`
- iframe onError → setLoadFailed → 退化 "标题 + 时间" 占位（**禁退化到文本摘要**）

**Given** MonthDivider
**When** 我更新 `web/components/MonthDivider.tsx`
**Then** `<h2 className="font-serif text-headline-md">` "{年} 年 {月} 月" + 1px dust 横线 + editorial-gap 64px 上下
**And** `<span className="sr-only">{`${year} 年 ${month}，${count} 份 Entry`}</span>`
**And** **不可交互、不折叠**

**Given** Timeline 组装
**When** 我更新 `web/components/Timeline.tsx`
**Then** `const groups = groupByMonth(sortEntries(entries, sort))`
**And** 每组：`<section><MonthDivider {...} /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card-gap">{...entries.map(EntryCard)}</div></section>`

**Given** 懒渲染验证
**When** alex 主屏有 10 张卡，scroll
**Then** 视口内的 iframe 已挂载
**And** 视口外的占位
**And** scroll 进入视口时 iframe 挂载

**Given** 缩略失败
**When** 一张卡 iframe load 失败
**Then** 该卡 fallback "标题 + 时间"
**And** 其他卡不受影响

**Given** 整体浏览
**When** alex ≥ 5 Entry 跨 2 月份
**Then** 看到 ≥ 2 月份分隔条
**And** 每月内按归档时间序
**And** 单击卡 → `/entry/{id}` Full Render

**Implementation Notes**:
- IntersectionObserver root margin 200px 是 best guess；M3 retro 时按滚动体验调
- `transform: scale(0.4)` 假设原始 ~1200×900 缩到 ~480×360 卡片；按真实卡片宽度反推
- ThumbnailIframe 必须 client（IntersectionObserver 是浏览器 API）

## Story 3.3: 排序切换（SortToggle + URL state）

As alex,
I want to toggle between "newest first" and "oldest first" with one click, persisted in URL but not across sessions,
So that I can both quickly find recent work and review thinking evolution from the earliest entries.

**Acceptance Criteria:**

**Given** SortToggle
**When** 我创建 `web/components/SortToggle.tsx` (`'use client'`)
**Then** 渲染二态切换器：当前状态显示 "最新在前" / "最早在前" (label-caps)
**And** 点击 `router.replace('/?sort=' + nextSort)` 切换
**And** `aria-pressed` 反映当前状态
**And** focus ring 强制

**Given** Timeline header
**When** 我更新 Timeline header
**Then** sticky header 右侧含 SortToggle + 归档按钮（onClick 触发隐藏 file input，Story 2.2 接入）

**Given** 不持久化（PRD `[NOTE FOR PM]`）
**When** alex 切到 "最早在前" → 关浏览器再开 + 访问 `/`（无 query string）
**Then** 默认 desc（page.tsx 检测 search param 默认 desc）
**And** 即 "不持久化" 指**新 session 不记**——URL 含 `?sort=asc` 时刷新仍是 asc

**Given** SR
**When** alex 用 SR 切换
**Then** `aria-live` polite 宣告 "排序：最早在前"

**Implementation Notes**:
- `router.replace` 而非 `router.push`——不污染历史栈
- `<Link href="/">` 默认不带 query，回 timeline 自然 desc

## Story 3.4: Full Render 完整导航（上一/下一 + 键盘）

As alex,
I want previous / next navigation in Full Render (both buttons and ← / → keys) following the current timeline sort direction,
So that I can sequentially review my thinking evolution without bouncing back to the timeline.

**Acceptance Criteria:**

**Given** prev/next 计算需要全部 entries + 当前 id + 排序
**When** /entry/[id] Server Component 接 entry
**Then** 也 fetch `const allEntries = await getEntries(sort)` 并 `const { prev, next } = getAdjacentEntries(allEntries, entry.id, sort)`

**Given** FullRenderTopChrome 增强
**When** 我更新 `web/components/FullRenderTopChrome.tsx`
**Then** 右侧加：
- `<button aria-label="上一条 Entry" disabled={!prev}>⟨</button>` (icon 36×36)
- `<button aria-label="下一条 Entry" disabled={!next}>⟩</button>`
**And** disabled 时 opacity 0.3 + cursor-not-allowed
**And** title 属性 hover 显示目标 entry 标题
**And** 单击 → `router.push('/entry/' + prev.id || next.id)`

**Given** FullRenderKeyboard
**When** 我创建 `web/components/FullRenderKeyboard.tsx` (`'use client'`)
**Then** 接收 `{ prevId?: string, nextId?: string }`
**And** useEffect mount 加 keydown listener:
- `ArrowLeft` + activeElement 不是 input/textarea → `router.push('/entry/' + prevId)`
- `ArrowRight` → router.push(next)
- `Escape` → `router.push('/')`
**And** unmount 移除 listener

**Given** FullRender 接入
**When** 我更新 `web/components/FullRender.tsx`
**Then** 渲染 `<FullRenderKeyboard prevId={prev?.id} nextId={next?.id} />`
**And** Footer mono "← / → 切换上一下一 · Esc 返回时间线"

**Given** 顺序导航
**When** alex 按 →
**Then** URL `/entry/<next-id>` + iframe + Top Chrome 标题更新
**And** 切换 < 1s（NFR-3 响应感）
**And** 最后一条时 → 按钮 disabled + → 键无响应

**Given** reduced motion
**When** 系统设 reduced motion
**Then** Full Render 切换无动画过渡（瞬移）

**Implementation Notes**:
- `document.activeElement` 检查避免 inline editor 输入时误触发
- Esc 优先级：dialog > inline editor > Full Render

## Story 3.5: 响应式断点 + 移动端退化

As alex,
I want MindPrint to adapt cleanly to mobile (1-column, file picker instead of drag, compact Top Chrome with bottom-sheet menu) and progressively expand to 4-column on large screens,
So that I can browse and archive from any device's browser without quality compromise.

**Acceptance Criteria:**

**Given** Timeline grid responsive
**When** Tailwind class 配置
**Then** grid columns: `< 768px` 1 col + margin 20px / `768-1024px` 2 cols + margin 32px / `1024-1440px` 3 cols / `≥ 1440px` 4 cols + margin 56px
**And** **最大不超 4 列**

**Given** Dropzone 移动端退化
**When** 检测 `matchMedia('(pointer: coarse)')` 或宽度 < 768px
**Then** Dropzone 整屏 listener 不挂载
**And** Timeline header "归档" 按钮变 floating action button（fixed 右下角，touch target ≥ 48×48）

**Given** Full Render 移动端紧凑
**When** 视口 < 768px
**Then** Top Chrome 紧凑：标题 1 行截断 / ⟨⟩ icon-only / ⋯ More menu 变**底部 sheet**（不是 dropdown，Story 4.1 实施时按此约定）

**Given** hover 移动端
**When** 无 hover 概念
**Then** 卡片无 hover 抬起动画（CSS `@media (hover: hover)` 包裹）

**Given** 跨断点测试
**When** alex 用 DevTools 切换 320 / 768 / 1024 / 1440 / 1920
**Then** 各断点 layout 合理无溢出
**And** 字号在 < 768px 用 mobile 变体（display-lg 36px）

**Implementation Notes**:
- 移动端检测用 CSS media query 而非 JS userAgent
- 底部 sheet 用 CSS transform 从底部 slide-up；reduced motion 时瞬移

---
