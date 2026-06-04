---
baseline_commit: 7a275bb5cd4f0aa44b6b8ebeeef6b0afffb7d73e
---

# Story 3.1: 时间线主屏 + Skeleton

Status: done

<!-- Epic 3 开篇 story（第 1/5）。把主屏从「永远 Empty State」升级为「有 Entry → Timeline 网格 / 无 Entry → Empty State」的分支，并补 cold-load skeleton。
     本 story 只搭骨架（page 接线 + getEntries 查询 + loading.tsx skeleton + Timeline 基础壳），**不画卡片网格**——
     EntryCard / MonthDivider / ThumbnailIframe / groupByMonth 接入属 Story 3.2；SortToggle / 归档按钮真功能属 Story 3.3。
     纯代码 story（无 ops）。全链路体验（skeleton → 真实网格）需浏览器，但 3.1 完成后网格区是空壳，真实视觉验收并入 3.2。
     关键纪律：① page.tsx 首次给 home 加 requireAlex（home 第一次渲染私有数据，承接 deferred F3）；② ArchiveFlow 须同时包住 Timeline 与 Empty 两分支（drag-anywhere 在两态都生效）。 -->

## Story

As alex,
I want 主屏 `/` 在有 Entry 时从 Empty State 切换为 Timeline 组件，且 cold load 期间显示 skeleton 占位,
so that 数据拉取时我立刻看到视觉反馈，页面永不"冻住"。

## Acceptance Criteria（源自 Epic 3 Story 3.1）

**AC1 — `getEntries(sort)` 查询（`lib/db/queries.ts`，扩充）**
- 在既有 `web/lib/db/queries.ts`（2.3 建，落地 DB 查询收口边界）追加：
  ```ts
  export async function getEntries(sort: SortDirection = 'desc'): Promise<Entry[]>
  ```
  - Drizzle **全量加载** + 按 `archivedAt` 排序：`orderBy(sort === 'desc' ? desc(entries.archivedAt) : asc(entries.archivedAt))`（`asc`/`desc` from `drizzle-orm`）。命中 `idx_entries_archived_at` 索引（[schema.ts:103](web/lib/db/schema.ts)）。
  - **DB 边界 Date→ISO 映射**（与 `getEntryById` 同一约定）：每行 `archivedAt`/`createdAt` `.toISOString()`，显式映射不 spread（剔除领域 `Entry` 不含的 `userId`）。建议抽一个 `rowToEntry(row)` 私有 helper，让 `getEntryById` 与 `getEntries` 共用，避免两处映射漂移。
  - **V1 单用户：不按 `userId` 过滤**（与 `getEntryById` 一致；alex 是唯一用户）。多用户化时再 `where(eq(entries.userId, session.user.id))`——本 story 不做。
  - 参数类型用 `SortDirection`（[types.ts:6](web/lib/entry/types.ts)），默认 `'desc'`。
  - **不分页 / 不 limit**（V1 ≤ 50 条全量，PRD）。

**AC2 — 主屏 Server Component 改造（`app/page.tsx`）**
- 改为 **async Server Component**，签名含 `searchParams`：`{ searchParams }: { searchParams: Promise<{ sort?: string }> }`（Next 16 `searchParams` 是 Promise，见 Dev Notes）。
- **第一行 `await requireAlex()`**（home 首次渲染私有数据 → 必须服务端权威鉴权，承接 deferred F3；详见 Dev Notes「requireAlex 首次进 home」）。
- 读 sort：`const { sort: sortParam } = await searchParams;` → `const sort: SortDirection = sortParam === 'asc' ? 'asc' : 'desc';`（白名单式：仅 `'asc'` 取 asc，其余一律 desc）。
- `const allEntries = await getEntries(sort);`
- 分支渲染，**两分支都在 `<ArchiveFlow>` 内**（drag-anywhere 两态都生效）、**两分支都含 `<main id="main">`**（layout skip-link 目标）：
  - `allEntries.length === 0` → 现有居中布局 `<main id="main" className="flex flex-1 flex-col items-center justify-center px-margin-mobile sm:px-margin-desktop"><EmptyState /></main>`。
  - else → `<Timeline entries={allEntries} sort={sort} />`（Timeline 自带 `<main id="main">`）。

**AC3 — Cold load skeleton（`app/loading.tsx`，新建）**
- 新建 `web/app/loading.tsx`（**根级**，作 `app/page.tsx` 的 Suspense fallback；可为 Server Component）。
- 渲染 **响应式 grid 含 4–6 张占位卡**：每卡 `rounded-lg border border-outline-variant bg-surface-container-low`，顶部缩略区 `aspect-[4/3]` 占位（`bg-surface-container`），下方标题/时间占位条（`bg-surface-container` 小块）。
- **顶部 header 占位**：wordmark "MindPrint" 位置 + 右侧归档按钮位置（占位块）——与 Timeline header 同一容器布局（同 margin / 同对齐）。
- **layout 与最终 Timeline 一致、不抖动**：grid 类、卡片 aspect、容器 max-width + margin 必须与 Timeline 网格区（Story 3.2）相同。grid 用 `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card-gap`（与 Epic 3.2 卡片网格类一致；断点 px 精调属 3.5）。
- **不显示 spinner 圈 / 百分比**（克制原则，[implementation-patterns#loading](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)）。skeleton 占位块也**不加 animate-pulse 之外的花哨动效**；reduced-motion 下动画自动压平（globals.css 全局已处理）。

**AC4 — Timeline 基础壳（`components/Timeline.tsx`，占位空壳 → 壳）**
- 保持 **Server Component**（无 `'use client'`）；props 维持 `{ entries: Entry[]; sort: SortDirection }`（已就位）。
- 渲染 sticky header + main 容器（结构平移自 [prototype Timeline](prototype/pwa-explore/components/Timeline.tsx) 的 `<header>`，**裸 px 值全换 token class**）：
  - `<header className="sticky top-0 z-10 border-b border-outline-variant bg-surface/85 backdrop-blur">`（半透明 + blur 平移自 prototype；纯 `bg-surface` 亦可）。
  - header 内容器：`max-w-[1600px] mx-auto px-margin-mobile sm:px-margin-desktop py-5 flex items-center justify-between`（与 skeleton header 对齐）。
  - **左**：wordmark `<Link href="/" className="font-serif text-headline-md text-on-surface">MindPrint</Link>`（单击 logo 回时间线，承接 IA；`<Link href="/">` 不带 query → 自然回 desc，与 3.3 约定一致）。
  - **右**：`flex items-center gap-3 md:gap-4` 内含 **SortToggle 占位 + 归档按钮占位**（本 story 是**静态占位**，真功能属 3.3——SortToggle 真组件 + 归档按钮接 `useArchiveTrigger`）。
- `<main id="main">` 月份分组**容器**：`max-w-[1600px] mx-auto px-margin-mobile sm:px-margin-desktop pb-24`（与 skeleton grid 容器对齐）。**本 story 容器内为空壳**——`groupByMonth(sortEntries(...))` + `<MonthDivider>` + `<EntryCard>` 网格属 **Story 3.2**，3.1 **不实现**（见 Dev Notes「本 story 边界」）。
- `entries` / `sort` 通过 props 传入并持有，供 3.2 消费（3.1 可暂不读 entries 内容，但签名/props 必须就位）。

**AC5 — Cold load 体验衔接**
- alex 登录后首次访问 `/` → 看到 skeleton 瞬间 → DB 查询完成 → 渲染真实 Timeline（有 Entry）或 EmptyState（无 Entry）。
- 占位 → 真实转换**无明显 layout 抖动**（skeleton header ≡ Timeline header；skeleton grid 容器 ≡ Timeline main 容器）。
- 注：skeleton 始终是「网格形态」；alex 若 0 Entry 则 skeleton(网格) → EmptyState(居中) 会有一次形态切换——这是 cold-load 固有、AC 已认可（"渲染真实 Timeline **或** EmptyState"），非抖动缺陷。

**AC6 — 验证 + 范围纪律**
- `npm run typecheck` + `npm run lint` 绿（0 错误 0 警告）。
- RSC 边界自查：`queries.ts` 经 `server-only`；`page.tsx` / `Timeline.tsx` / `loading.tsx` 均 Server Component（无泄漏 server-only 到 client）。
- 范围纪律（**不做**）：不画卡片网格 / 不接 `groupByMonth` / 不建 EntryCard·MonthDivider·ThumbnailIframe（→ 3.2）；SortToggle / 归档按钮不接真功能（→ 3.3）；不引入 SWR / TanStack Query（Epic 实现说明）。

## Tasks / Subtasks

> 纯 `[code·dev]` story（无 ops）。顺序：查询 → 页面接线 → 壳/skeleton → 验证。

- [x] **T1 `getEntries(sort)`（AC1）**
  - [x] `web/lib/db/queries.ts`：import 追加 `asc, desc`（drizzle-orm）+ `SortDirection`（types）。
  - [x] 抽 `rowToEntry(row)` 私有 helper（Date→ISO + 显式字段，剔除 userId）；`getEntryById` 改用之（去重，行为不变）。
  - [x] `getEntries(sort = 'desc')`：`db.select().from(entries).orderBy(...)` → `rows.map(rowToEntry)`。无 userId 过滤、无 limit。
- [x] **T2 `page.tsx` 改造（AC2）**
  - [x] 改 async + `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`（按 Next 16 docs 实签名）；首行 `await requireAlex()`。
  - [x] await searchParams → sort 白名单解析（仅 'asc' 取 asc，其余 desc）→ `getEntries(sort)`。
  - [x] `<ArchiveFlow>` 包两分支；length===0 → `<main id="main">…<EmptyState/>`；else → `<Timeline entries sort />`。
- [x] **T3 `Timeline.tsx` 壳（AC4）**
  - [x] 占位空壳 → sticky header（wordmark `<Link href="/">` + SortToggle/归档占位）+ `<main id="main">` 月份分组容器（空壳）。裸 px 全换 token class。
  - [x] 保持 Server Component；props 不变；TODO 注释标明 3.2 填网格 / 3.3 接 SortToggle+归档。
- [x] **T4 `app/loading.tsx` skeleton（AC3）**
  - [x] 新建（Server Component）：header 占位 + `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card-gap` 含 6 张 `surface-container-low` 占位卡（`aspect-[4/3]` 缩略区 + 标题/时间占位条）。
  - [x] 容器 max-width + margin 与 Timeline 一致；无 spinner / 无百分比。
- [x] **T5 验证（AC6）**
  - [x] `npm run typecheck` + `npm run lint` 绿（实跑：0 错误 0 警告）。
  - [x] RSC 边界自查：queries.ts `server-only`；page/Timeline/loading 均 Server Component，无 server-only 泄漏到 client。
  - [x] 范围纪律自查（无卡片网格 / 无 groupByMonth / 无 3.3 真功能 / 无新查询库）。
  - [x] 运行时 + 真实网格视觉验收按 story 设计**并入 Story 3.2**（3.1 网格区为空壳、无独立可视行为；需登录态浏览器）。

## Dev Notes

### 本 story 边界（防 scope creep + 防 3.1/3.2/3.3 重叠）
- **做**：① `getEntries(sort)` 查询；② `page.tsx` 接线（requireAlex + searchParams + 分支）；③ `app/loading.tsx` cold-load skeleton；④ `Timeline.tsx` 基础壳（sticky header + 空 main 容器）。完成「主屏从永远 Empty → 有 Entry 走 Timeline 壳」+「cold load 有 skeleton」。
- **不做**：
  - ❌ 卡片网格：`groupByMonth(sortEntries(entries, sort))` + `<MonthDivider>` + `<EntryCard>` + `<ThumbnailIframe>`（缩略懒渲染 iframe）→ **Story 3.2**。3.1 的 Timeline `<main>` 是**空容器壳**。
  - ❌ SortToggle 真组件（URL `?sort` 切换）+ 归档按钮真功能（接 `useArchiveTrigger`）→ **Story 3.3**。3.1 是**静态占位**。
  - ❌ 4 断点响应式精调（margin 20/32/56、4 列 ≥1440px、移动端退化）→ **Story 3.5**。3.1 用 Epic 3.2 既定 grid 类作起点。
  - ❌ Full Render 导航增强（上一/下一 + 键盘）→ **Story 3.4**。
  - ❌ 不引入 SWR / TanStack Query（Epic 实现说明）——RSC `await getEntries()` 直查即可。

### 🔑 page.tsx 装配：ArchiveFlow 包两分支 + 双 `#main`（必读，最易写错）
- 现 `page.tsx` 把 `<main><EmptyState/></main>` 包在 `<ArchiveFlow>` 内（[page.tsx](web/app/page.tsx)）。3.1 改为**分支**，但 `<ArchiveFlow>` 必须**同时包住 Timeline 与 Empty 两分支**：
  - EXPERIENCE.md（Dropzone 行为）：「有 Entry 时缩成右上归档按钮 + **任意位置 drag-and-drop 仍生效**」。ArchiveFlow 渲染全屏 `<Dropzone>` 监听 + 隐藏 file input + `openFilePicker` context（[ArchiveFlow.tsx](web/components/ArchiveFlow.tsx)）——Timeline 在它内部，3.3 的归档按钮才能 `useArchiveTrigger()`、且拖拽在有 Entry 态也工作。
  - 结构：
    ```tsx
    return (
      <ArchiveFlow>
        {allEntries.length === 0 ? (
          <main id="main" className="flex flex-1 flex-col items-center justify-center px-margin-mobile sm:px-margin-desktop">
            <EmptyState />
          </main>
        ) : (
          <Timeline entries={allEntries} sort={sort} />
        )}
      </ArchiveFlow>
    );
    ```
- **RSC 边界 OK**：`ArchiveFlow` 是 `'use client'`，`Timeline`/`EmptyState` 是 Server Component 作为 `children` 传入——这是 RSC 标准模式（Server Component 可作 Client Component 的 children），现 code 已对 EmptyState 这么做，Timeline 同理。**不会**因此把 Timeline 变 client。
- **双分支都要 `<main id="main">`**：layout 的 skip-link 指向 `#main`（[layout.tsx:65](web/app/layout.tsx)）。Empty 分支自带 `<main id="main">`；Timeline 内部自带 `<main id="main">`（AC4）。**勿**在 ArchiveFlow 外再包一层 main 导致双 main。

### requireAlex 首次进 home（throw 行为 + 与 2.3 一致）
- 现 `app/page.tsx` **未**调 `requireAlex`（2.3 明确：home 当时只渲染 Empty State、无私有数据，仅靠 proxy 乐观校验）。3.1 起 home **渲染 Entry 列表 = 私有数据** → 按 deferred **F3**（[deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)）「第一个渲染私有数据的页面**必须**置于 `requireAlex()` 之下（server 层权威），不可依赖 proxy」——故 Epic AC 要求首行 `await requireAlex()`。
- **throw 行为**（与 2.3 entry 页同款分析）：正常 alex 不抛；未登录被 [proxy.ts](web/proxy.ts) 提前 307 → `/auth/signin`（page 不执行）；**present-but-invalid cookie**（罕见：过期/伪造 cookie 能过 proxy 乐观校验）→ `requireAlex()` 抛 `UNAUTHORIZED`。
  - ⚠️ home **无局部 `app/error.tsx`**（架构规划有、但至今未建；2.3 也只建了 `entry/[id]/error.tsx`）。故此罕见抛错会冒泡到 Next 默认错误页。**无数据泄露**（抛在渲染前）、场景罕见，V1 接受——**与 2.3 对 entry 页的判断一致**。
  - **建 `app/error.tsx` 不在本 story 范围**（Epic 3.1 AC 未列）；若要更顺的 UX，可选 `try { await requireAlex() } catch { redirect('/auth/signin') }`（`redirect` from `next/navigation`）。**默认按 Epic 直接 `await requireAlex()` 首行**，保持与 entry 页一致、最简。
- **dynamic 自动**：`requireAlex()` → `auth()` 读 cookie → 页面自动 dynamic（不被静态缓存），**无需** `export const dynamic`（2.3 已验同款）。`archiveEntry` 末尾的 `revalidatePath('/')`（2.2）会让下次渲染重跑 requireAlex + getEntries，新 Entry 即现顶部。

### getEntries：复用 2.3 的 Date→ISO 模式 + 抽 helper 去重
- `getEntryById`（2.3，[queries.ts:25](web/lib/db/queries.ts)）已立 DB 边界 Date→ISO + 显式映射（剔除 `userId`）的范式。`getEntries` 是**第二个**用此范式的查询——抽 `rowToEntry(row): Entry` 私有 helper 让两者共用，防"两处映射各改一半"漂移（schema 注释 [schema.ts:12-15](web/lib/db/schema.ts) 点名 queries.ts 收口此映射）。
- **别**用 `InferSelectModel<typeof entries>` 直接当 `Entry`（`Date` 类型会漏进领域层，破坏纯函数/组件 ISO string 契约 [types.ts:11-13](web/lib/entry/types.ts)）。
- 排序：`import { asc, desc } from 'drizzle-orm'`；`orderBy(sort === 'desc' ? desc(entries.archivedAt) : asc(entries.archivedAt))`。`getEntries` 是首个非 `eq` 的 Drizzle 用法。
- **getEntries 已在 DB 层排序**，Story 3.2 的 Timeline 仍会 `sortEntries(entries, sort)` 再 `groupByMonth`（纯函数驱动分组、组内保序）——架构数据流（[project-structure-boundaries.md 时间线渲染流](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)）两者并存是有意的，本 story 只管 DB 排序。

### loading.tsx skeleton（Next 16 Suspense fallback + 不抖动是核心）
- **机制**：Next 16 App Router 中 `app/loading.tsx` 自动成为 `app/page.tsx` 的 Suspense fallback。page 因 `requireAlex()`/`getEntries()` 是 async dynamic → 首次加载/导航时先渲 skeleton，RSC payload 流式就绪后替换。本项目**根级无 `app/loading.tsx`**（仅 `entry/[id]/loading.tsx` 存在）→ 本 story **新建**。可为 Server Component（[entry/[id]/loading.tsx](web/app/entry/[id]/loading.tsx) 是 Server Component 先例）。
- **不抖动 = AC 核心**：skeleton 的 header 与 grid 容器必须与 Timeline（AC4）**逐项对齐**（同 `max-w-[1600px] mx-auto`、同 `px-margin-mobile sm:px-margin-desktop`、同 grid 类、同卡片 `aspect-[4/3]` + `rounded-lg`）。
  - ⚠️ **漂移风险**：skeleton grid 类与 Timeline/3.2 卡片 grid 类是"两处各写一份"；若 3.2/3.5 改 grid 列数或断点，**必须同步改 skeleton**，否则 cold-load 抖动回归。可把 grid 类抽成共享 const 字符串（如 `lib/entry/` 下或 Timeline 导出）降低漂移——可选，dev 定。
- **占位视觉**（[State Patterns·Cold load](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md)）：`surface-container-low` skeleton 卡片网格（4–6 张），缩略区用更深一档 `surface-container` 占位。**不用 spinner 圈 / 不用百分比**（克制 voice）。`animate-pulse` 可用（轻微呼吸），但 reduced-motion 下 globals.css 已全局压平动画（[globals.css:187](web/app/globals.css)）。

### Timeline 壳：从 prototype 平移 header 结构、裸值换 token
- [prototype Timeline](prototype/pwa-explore/components/Timeline.tsx) 是完整 client 版（useEntries / drag / modal / 网格）。**3.1 砍到壳**：去 `'use client'`（保持 Server Component）、去 useEntries / drag / modal（这些已由 ArchiveFlow 承担）、去网格 map（→ 3.2）；**保留 header 视觉骨架 + main 容器布局**。
- 平移规则（架构 Enforcement #9）：保留结构，**裸 px / 裸 hex 全换 token class**：
  - `px-5 md:px-14` → `px-margin-mobile sm:px-margin-desktop`（20/56px，[globals.css:132-134](web/app/globals.css)；4 断点精调属 3.5）。
  - wordmark `text-[24px]` → `text-headline-md`（28px，与 [signin 页](web/app/auth/signin/page.tsx) wordmark 一致；非 token 的 24px 不用）。
  - header `bg-surface/85 backdrop-blur` + `border-b border-outline-variant`：opacity 修饰符在 v4 + `@theme inline` 颜色下可用；纯 `bg-surface` 亦可。
  - 间距/字号一律 token class（`gap-3`/`gap-4`、`py-5`、`text-headline-md`…）。`max-w-[1600px]` 是布局上限非 DESIGN token，prototype 既用，保留 arbitrary 即可（或自定义，dev 定）。
- **SortToggle / 归档按钮占位**（3.1 静态）：右侧渲染两个视觉占位（如 disabled 样式的按钮 / 文字 slot）。**真组件 3.3 接**——届时 SortToggle（client, `router.replace('?sort=')`）+ 归档按钮（client, `useArchiveTrigger().openFilePicker()`）替换占位。3.1 起这两个真组件文件已存在（[SortToggle.tsx](web/components/SortToggle.tsx) 当前是什么状态 dev 自行确认；3.1 不依赖其内容）。
- 注：3.1 完成到 3.3 之间，有 Entry 态下「点归档按钮」不工作（占位），但**拖拽归档仍工作**（ArchiveFlow 的全屏 Dropzone 始终挂载）——可接受的中间态（顺序 story）。

### Next 16 specifics（AGENTS.md 强制：写码前查 `node_modules/next/dist/docs/`）
- **`searchParams` 是 Promise**（Next 16，与 `params` 同）→ page 必须 `await searchParams`。类型 `{ searchParams: Promise<{ sort?: string }> }`（或更宽 `Promise<{ [k: string]: string | string[] | undefined }>`，按 docs 实际签名）。**写码前按 [AGENTS.md](web/AGENTS.md) 查 docs 核对**当前 16.2.6 的 page props 签名。
- `loading.tsx` 默认 Server Component（Suspense fallback）。
- page 读 cookie（经 requireAlex→auth）自动 dynamic，无需显式 `dynamic`。
- 本项目 Next 16.2.6 + React 19.2.4；middleware 已更名 `proxy`（见 [auth.config.ts](web/lib/auth/auth.config.ts) / [proxy.ts](web/proxy.ts)）。

### 视觉规格 + token classes（照搬现成 class，禁造新值）
- token 体系 [globals.css](web/app/globals.css)（Tailwind v4 `@theme` / `@theme inline`，无 tailwind.config.ts）。范式：[EmptyState.tsx](web/components/EmptyState.tsx) / [FullRenderTopChrome.tsx](web/components/FullRenderTopChrome.tsx) / [signin](web/app/auth/signin/page.tsx)。
- 已确认可用 token class（本 story 用得到）：`bg-surface` / `bg-surface-container-low` / `bg-surface-container` / `border-outline-variant` / `text-on-surface(-variant)` / `text-headline-md` / `text-headline-sm` / `text-caption` / `font-serif` / `font-sans` / `rounded`(4px) / `rounded-lg`(8px) / `shadow-card-rest` / `px-margin-mobile` / `sm:px-margin-desktop` / `gap-card-gap`(20px) / `p-card-padding`(16px) / `gap-editorial-gap`(64px) / `text-display-lg`(clamp 36→48 已含移动降级)。
- 颜色/字号一律 token class，**禁裸 px / 裸 hex**。暗色自动跟随（token 已翻转）。
- Card 视觉（skeleton 占位据此近似，真卡 3.2）：`bg-surface-container-low` + 1px `outline-variant` ghost 边 + `rounded-lg`（[DESIGN.md Card](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md)）。

### 来自 Story 2.1 / 2.2 / 2.3 的就绪件（previous story intelligence）
- ✅ `getEntryById` + DB 边界 Date→ISO 范式（[queries.ts](web/lib/db/queries.ts)）——`getEntries` 照搬，抽 helper 共用。
- ✅ `requireAlex()`（[require-alex.ts](web/lib/auth/require-alex.ts)）抛 `UNAUTHORIZED`——page 首行直接 await（无需 try/catch，throw 走默认错误页，见上）。
- ✅ `Entry` / `SortDirection` 类型（[types.ts](web/lib/entry/types.ts)）；`sortEntries` / `groupByMonth` 纯函数已就位（[sort-entries.ts](web/lib/entry/sort-entries.ts) / [group-by-month.ts](web/lib/entry/group-by-month.ts)）——**3.1 不调它们**（3.2 调）。
- ✅ `ArchiveFlow`（[ArchiveFlow.tsx](web/components/ArchiveFlow.tsx)）：全屏 Dropzone + 隐藏 input + `useArchiveTrigger` context + 确认跳 Full Render——**3.1 不改它**，只把它从「包 main」改成「包分支」。
- ✅ `EmptyState`（[EmptyState.tsx](web/components/EmptyState.tsx)，Server Component，含 `ArchiveCtaButton`）——3.1 复用，不改。
- ✅ `Timeline.tsx` 当前是占位空壳（`{entries.length} 条 Entry`，props 已是 `{entries, sort}`）——3.1 改成壳。
- ✅ `COPY`（[voice.ts](web/lib/voice.ts)）：`COPY.loading`「正在加载……」已有（skeleton 若需文字可用，但 skeleton 以占位块为主，未必需文字）。**本 story 预计无新增 voice 键**（wordmark "MindPrint" 是品牌名非 microcopy，可内联）。
- ✅ **无新增必需 env**——推 main 无新 env 风险（2.1 R2 / 1.x auth 变量已齐）。
- ⚠️ neon-http 无事务——与本 story 无关（纯读）。

### git intelligence
- 最近 `7a275bb`（Story 2.3 → done / Epic 2 → done）在 main。本 story 直接 **main 提交并推送**（[git-setup](.claude/projects/-Users-alex-Developer---------my-bmad-app/memory/git-setup.md)：alex 明确不建分支）。commit message 末尾带 `Co-Authored-By: Claude Opus 4.8 (1M context)` trailer。
- Epic 3 第一个 story → sprint-status 中 `epic-3` 已随本 story 创建转 `in-progress`。
- 约定延续：每 story 单独提交；服务端日志 `[domain] message`（本 story 纯读、预计无新日志）；文案走 voice.ts；token class 不造新值。

### Project Structure Notes
- **新增**：`web/app/loading.tsx`（根级 cold-load skeleton；架构 [project-structure 顶层 loading.tsx](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md) 已规划，本 story 落地）。
- **修改**：`web/lib/db/queries.ts`（+`getEntries` +`rowToEntry`）、`web/app/page.tsx`（Empty-only → 分支 + requireAlex + searchParams）、`web/components/Timeline.tsx`（空壳 → 壳）。
- 与架构目录结构严格一致；`getEntries` 落地架构点名的「DB 查询收口」（[project-structure Data Boundaries](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md) #1）。

### 测试 / 验证（本 story：静态绿 + 可选 dev 点验；真实网格视觉并入 3.2）
- `npm run typecheck` + `npm run lint`：dev 必跑绿（0/0）。
- 可选运行时点验（`next dev`，无需真实数据也能验分支/鉴权）：
  - 未登录 `/` → proxy 307 → `/auth/signin`。
  - 登录态（dev bypass 或真 session）`/`：0 Entry → EmptyState；≥1 Entry → Timeline 壳（header + 空 main）。
  - 首屏可见 skeleton 闪现（dynamic 页 + loading.tsx）。
- **真实卡片网格 + skeleton→网格不抖动的视觉验收 → 并入 Story 3.2**（3.1 网格区是空壳，无可视卡片）。
- `next build` 本机受已知 fonts.gstatic CJK flake 阻断（非本 story 代码）→ **Vercel 权威构建**，不耗时重试。

### References
- Epic 3 Story 3.1 原文：[epic-3-时间线浏览与思维演进回看browse-timeline.md](_bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/epic-3-时间线浏览与思维演进回看browse-timeline.md#story-31-时间线主屏--skeleton)
- 上一个 story（DB 边界 / requireAlex / Next 16 范式 / 平移规则全部源此）：[2-3-full-render-基础-归档跳转衔接.md](_bmad-output/implementation-artifacts/2-3-full-render-基础-归档跳转衔接.md)
- DB 查询收口 / Route Handler / Loading 模式 / 平移规则：[implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)
- 目录结构 / 组件边界（page→Timeline→EmptyState）/ 时间线渲染流 / Data Boundaries：[project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)
- Cold load / Empty State / Card / Sort Toggle 行为 + Voice：[EXPERIENCE.md](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md)（State Patterns / Component Patterns）
- Card / Month Divider / Top Chrome / Layout&Spacing / token 值：[DESIGN.md](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md)
- 视觉 mock（composition 参考，spine 冲突时 spine 胜）：`_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/mockups/timeline-mock.html`
- deferred F3（home 私有页须 requireAlex）：[deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)
- Next 16 须知：[web/AGENTS.md](web/AGENTS.md) + `node_modules/next/dist/docs/`
- 就绪件源码：[queries.ts](web/lib/db/queries.ts) · [page.tsx](web/app/page.tsx) · [Timeline.tsx](web/components/Timeline.tsx) · [ArchiveFlow.tsx](web/components/ArchiveFlow.tsx) · [EmptyState.tsx](web/components/EmptyState.tsx) · [require-alex.ts](web/lib/auth/require-alex.ts) · [types.ts](web/lib/entry/types.ts) · [schema.ts](web/lib/db/schema.ts) · [globals.css](web/app/globals.css) · [prototype Timeline](prototype/pwa-explore/components/Timeline.tsx)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (1M context) · 2026-06-04

### Debug Log References

- 写码前按 [AGENTS.md](web/AGENTS.md) 查 `node_modules/next/dist/docs/`：核对 Next 16.2.6 page 签名 `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`（`01-app/01-getting-started/03-layouts-and-pages.md`），await 后读 `.sort`；使用 searchParams 自动 opt-in dynamic（与 requireAlex 读 cookie 一致）。`loading.tsx` 默认 Server Component（`03-file-conventions/loading.md`）。
- `npm --prefix web run typecheck`（tsc --noEmit）：0 错误。
- `npm --prefix web run lint`（eslint）：0 错误 0 警告。

### Completion Notes List

**已完成（代码 + 静态验证）：**
- T1–T4：`getEntries(sort)` + 抽 `rowToEntry` helper（getEntryById 同步改用，去重）/ page.tsx 接线（requireAlex 首行 + searchParams await + sort 白名单 + 分支）/ Timeline 壳（sticky header + 空 main 容器）/ app/loading.tsx cold-load skeleton。
- 关键决策落地：① **ArchiveFlow 包两分支**（拖拽归档在 Empty/Timeline 两态都生效；归档按钮 3.3 经 context 接）；② **home 首次加 `await requireAlex()`**（首次渲染私有数据，承接 deferred F3；读 cookie → 自动 dynamic）；③ getEntries 复用 DB 边界 Date→ISO 模式、抽 `rowToEntry` 防漂移、V1 单用户不过滤 userId、无 limit；④ skeleton 的 header/grid 容器与 Timeline 逐项对齐（同 max-width/margin/grid 类/卡片 aspect）→ 不抖动；⑤ Timeline 用 `entries.length` 落 a11y surface 宣告（`aria-label="时间线，N 份 Entry"`），同时规避 unused-var lint。
- typecheck + lint 绿；RSC 边界经分析正确（server-only 未泄漏；Timeline/loading 纯 Server Component；ArchiveFlow client 以 Server children 组合）。

**范围纪律（按 Epic 划清，未做）：**
- 卡片网格 / `groupByMonth(sortEntries)` / EntryCard·MonthDivider·ThumbnailIframe → Story 3.2（Timeline `<main>` 现为空壳）。
- SortToggle 真组件 + 归档按钮真功能 → Story 3.3（现为静态 aria-hidden 占位）。
- 4 断点响应式精调 → Story 3.5。
- 运行时 + 视觉验收并入 3.2（3.1 无独立可视行为）。

**无新增必需 env**；推 main 无新 env 风险。

### File List

**新增：**
- `web/app/loading.tsx`

**修改：**
- `web/lib/db/queries.ts`（+`getEntries` + 抽 `rowToEntry` helper；`getEntryById` 改用 helper）
- `web/app/page.tsx`（Empty-only → 分支 + requireAlex 首行 + searchParams；ArchiveFlow 包两分支）
- `web/components/Timeline.tsx`（占位空壳 → sticky header + 月份分组容器壳）

## Senior Developer Review (Codex)

**Reviewer**: Codex CLI（`codex review`，custom-prompt 模式 · 未提交改动全量）· 2026-06-04 · 对抗式
**Outcome**: ✅ **Approve —— 未发现 P1/P2/P3 缺陷**。Codex 明确判定：RSC server/client 边界、requireAlex 前置鉴权、Next 16 `searchParams: Promise` 处理、Drizzle 排序 + Date→ISO 映射、V1 单用户不过滤 userId 策略、a11y 主体结构均与 Story 3.1 约束一致；typecheck + lint 通过。

### 复核范围
- `web/lib/db/queries.ts` · `web/app/page.tsx` · `web/components/Timeline.tsx` · `web/app/loading.tsx`（规格 `.md`/`.yaml` 不在审查范围）。

### Action Items
- 无（clean approve）。
- 转交后续 story 的注意项（非本 story 缺陷）：skeleton（loading.tsx）与 Timeline/EntryCard 的 grid 类是「两处各写一份」——Story 3.2 / 3.5 调整列数或断点时须同步两处，否则 cold-load 抖动回归（已在 Dev Notes 与 loading.tsx 注释标注）。
