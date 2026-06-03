---
baseline_commit: c35584f8c5171c9a161a66152c83f1779a6b29e8
---

# Story 2.3: Full Render 基础 + 归档跳转衔接

Status: done

<!-- Epic 2 收官 story（第 3/3）。把 2.1 的 `fetchEntryHtml` + 2.2 已写好的 `router.push('/entry/[id]')` 接成闭环：
     建动态页 `/entry/[id]` + HTML 代理 route + 沙箱 iframe（NFR-1 首次实装到 Full Render）。
     纯代码 story（无 ops）。全链路验证需浏览器（登录 + 看到沙箱渲染），见 Dev Notes 测试节。
     完成后：归档 → ≤1 跳转看到完整渲染（FR-3 满足）；主屏仍 Empty State（timeline 渲染属 Epic 3）。 -->

## Story

As alex,
I want 一个动态 `/entry/[id]` 页：经 Route Handler 代理从 R2 取回该 Entry 的 HTML，在带空 `sandbox` 的 iframe 内原貌渲染，配简化版 Top Chrome,
so that 归档后我立刻看到文件被渲染出来，且保护性沙箱阻止它访问 MindPrint 的会话。

## Acceptance Criteria（源自 Epic 2 Story 2.3）

**AC1 — `getEntryById` 查询（`lib/db/queries.ts`，新建）**
- 新建 `web/lib/db/queries.ts`（确立架构点名的 DB 查询收口边界；本 story 只加 `getEntryById`，`getEntries`/`countEntries` 留 Epic 3）。
- `export async function getEntryById(id: string): Promise<Entry | null>`：
  - Drizzle 单行查询：`db.select().from(entries).where(eq(entries.id, id)).limit(1)`。
  - **DB 边界做 Date→ISO 映射**（[schema.ts:12-15](web/lib/db/schema.ts) 点名 2.3）：`archivedAt`/`createdAt` 是 timestamptz → Drizzle 返回 `Date`；映射为 ISO `string`（`.toISOString()`）以满足领域 `Entry` 契约（[types.ts:14](web/lib/entry/types.ts)）。
  - **非法 UUID 守卫**：`id` 来自 URL，非 UUID 字符串喂给 PG `uuid` 列会抛 `invalid input syntax for type uuid`（→ 500）。查询前先校验 UUID（`z.uuid().safeParse(id)` 或正则），不合法直接 `return null`（让调用方走 404 / `notFound()` 而非 500）。
  - 无命中 → `return null`。

**AC2 — 动态路由 `app/entry/[id]/page.tsx`（Server Component）**
- 签名 `{ params: Promise<{ id: string }> }`（Next 16 async params）。
- **第一行 `await requireAlex()`**（防御纵深，详见 Dev Notes「鉴权分层」）。
- `const { id } = await params` → `const entry = await getEntryById(id)`；`!entry` → `notFound()`（from `next/navigation`，默认 Next 404）。
- 渲染 `<FullRender entry={entry} />`。

**AC3 — `FullRender` 更新（`components/FullRender.tsx`，占位空壳 → 实装，保持 Server Component）**
- 三段布局：`<header>` = `<FullRenderTopChrome entry={entry} />` / `<main id="main">` = iframe 渲染区 / `<footer>` = mono 提示。
- iframe：`<iframe src={`/api/entry/${entry.id}/html`} sandbox="" title={`${entry.title} 完整渲染`} className="…w-full h-full…" />`
  - **`sandbox=""` 空属性**——禁 `sandbox="allow-*"`（缺失或加 allow 视为 NFR-1 安全违规）。
  - **必须用 `src`（指向 route handler）而非 `srcDoc`**——见 Dev Notes「iframe src vs srcDoc（锁定）」。
  - **必须有 `title`**（a11y）。
- `<main id="main">` 承接 layout 的 skip-link（`#main`）；iframe 需有高度链（见 Dev Notes「布局高度」）。
- footer：`font-mono text-mono-metadata` 文案「Esc 返回时间线」（Esc *行为*属 Story 3.4，本 story 仅静态提示，见 Dev Notes）。

**AC4 — `FullRenderTopChrome`（`components/FullRenderTopChrome.tsx`，新建，Server Component）**
- 布局（基础版）：
  - **左**：`<Link href="/" aria-label="返回时间线">` 内含 `←`（可选 `←` + 文字「返回时间线」，见 prototype）。
  - **中**：`<h1>{entry.title}</h1>`（`font-serif text-headline-sm`，单行截断 `truncate`）+ `<time dateTime={entry.archivedAt}>{absoluteTime(entry.archivedAt)}</time>`（`font-mono text-mono-metadata`）。
  - **右**：留空（上一/下一 → Story 3.4；⋯ 菜单 → Story 4.1）。
- 背景 `bg-surface` + **1px dust 底边** `border-b border-outline-variant`。
- `absoluteTime` 已就位（[absolute-time.ts](web/lib/entry/absolute-time.ts)）；`entry.archivedAt` 已是 ISO string。

**AC5 — HTML 代理 Route Handler（`app/api/entry/[id]/html/route.ts`，新建）**
- `export async function GET(req, { params }: { params: Promise<{ id: string }> })`：
  1. `try { await requireAlex() } catch { return new Response(null, { status: 401 }) }`——**401 空 body**（NFR-2 资源层不泄露；**不返回 404**）。
  2. `const { id } = await params`。
  3. `const entry = await getEntryById(id)`；`!entry` → `return new Response(null, { status: 404 })`。
  4. `const r2Response = await fetchEntryHtml(entry.r2ObjectKey)`（2.1 已就位）；包 try/catch：R2 取回失败（含 `NoSuchKey`）→ 404/500 + `[entry-html]` 日志（见 Dev Notes）。
  5. `return new Response(r2Response.body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })`（流式，不缓冲整文件）。

**AC6 — `error.tsx` 局部错误边界（`app/entry/[id]/error.tsx`，新建，`'use client'`）**
- 渲染：`COPY.render.failed`（「渲染未能完成。」）+ 「Entry 仍在档案库中。」+ `<Link href="/">返回时间线</Link>` + **「下载原文件」占位（disabled）**（Epic 4 接入）。
- 文案全走 voice.ts（AC11 新增键）。
- ⚠️ 这是 **React error boundary**：捕获 page/FullRender Server Component 渲染期抛错（如 `getEntryById` DB 抛错、page 的 `requireAlex` 抛 `UNAUTHORIZED`）。**不**捕获 iframe 内容加载失败（opaque iframe 的资源加载，宿主无 onError 可观测——属未来 client onError 兜底，本 story 不做）。见 Dev Notes。

**AC7 — `loading.tsx`（`app/entry/[id]/loading.tsx`，新建）**
- `bg-surface-container-low` 占位 + `text-caption` 文案 `COPY.loading`（「正在加载……」）。
- **不显示 spinner 圈 / 百分比**（克制原则，[implementation-patterns#loading](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)）。可为 Server Component。

**AC8 — 归档 → Full Render 衔接（FR-3）**
- Story 2.2 的 `archiveEntry` 成功后 `router.push('/entry/' + id)` **已接线**（[ArchiveFlow.tsx:81](web/components/ArchiveFlow.tsx)）；本 story 让该目标页存在 → 归档后 **≤ 1 跳转看到完整渲染**。
- 浏览器 `←` 返回主屏（仍 Empty State，Epic 3 才接 timeline）。
- 刷新 `/entry/{id}` URL → Entry 仍可见（DB + R2 持久化）。

**AC9 — NFR-1 沙箱化验证**
- 测试 HTML 含 `<script>document.cookie='x'</script>` 或 `<script>parent.location='https://attacker.com'</script>` → iframe 内 script **不执行**（`sandbox=""` 阻 script；opaque origin 隔离 cookie/localStorage）。

**AC10 — 401 验证**
- 未登录浏览器直接访问 `/api/entry/<some-uuid>/html` → **401 + 空 body**（不返回 404，避免泄露 Entry 是否存在）。

**AC11 — voice.ts 扩充**
- 新增（遵守 voice 铁律：陈述句句号收束、标签无句号、无 emoji / 无感叹号）：
  - `render.stillArchived` = 「Entry 仍在档案库中。」（陈述句，句号）
  - `render.downloadOriginal` = 「下载原文件」（按钮/链接标签，无句号）
  - `render.backToTimeline`（或归于合适分组）= 「返回时间线」（标签，无句号；error.tsx 链接 + TopChrome 返回 + footer 复用）
- footer「Esc 返回时间线」可复用 `backToTimeline` 组合，或单独键；dev 定。

## Tasks / Subtasks

> 纯 `[code·dev]` story（无 ops）。顺序：后端（queries → route）→ 视觉/UI（voice → TopChrome → FullRender → page）→ 边界文件（error/loading）→ 验证。

- [x] **T1 `getEntryById`（AC1）**
  - [x] 新建 `web/lib/db/queries.ts`：`import 'server-only'` + `db`/`entries`/`eq`/`Entry`；`getEntryById(id)`。
  - [x] 非法 UUID 守卫（`z.uuid().safeParse`）→ `null`。
  - [x] Date→ISO 映射（`archivedAt`/`createdAt` `.toISOString()`，显式映射不 spread 以剔除 userId）；无命中 `null`。
- [x] **T2 voice.ts 扩充（AC11）**
  - [x] `render.stillArchived` + 新增 `fullRender` 组（`backToTimeline` / `footerHint` / `downloadOriginal`），合 voice 铁律。
- [x] **T3 HTML 代理 Route Handler（AC5, AC10）**
  - [x] 新建 `web/app/api/entry/[id]/html/route.ts`：照 [implementation-patterns Route Handler 模式](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)（requireAlex catch→401 空 / await params / getEntryById→404 / `fetchEntryHtml` 流式转发）。
  - [x] `fetchEntryHtml` 包 try/catch + `!ok || !body` 守卫 → 404 + `[entry-html]` 日志。
- [x] **T4 `FullRenderTopChrome`（AC4）**
  - [x] 新建 `components/FullRenderTopChrome.tsx`（Server Component）：← 返回 Link（aria-label）+ h1 标题（headline-sm truncate）+ `<time dateTime>` 绝对时间（mono-metadata）+ 右留空 + 1px dust 底边。token class 照 EmptyState/ArchiveModal。
- [x] **T5 `FullRender` 更新（AC3）**
  - [x] 占位空壳 → 三段布局（header/`<main id="main">` iframe/footer），根 `flex flex-1 flex-col`。
  - [x] iframe `src`（非 srcDoc）+ `sandbox=""` + `title` + `key={entry.id}`；`min-h-0 flex-1` 高度链。
  - [x] footer mono「Esc 返回时间线」（行为属 3.4）。
- [x] **T6 动态页 `page.tsx`（AC2）**
  - [x] 新建 `web/app/entry/[id]/page.tsx`（Server Component）：requireAlex 首行 → await params → getEntryById → `notFound()` → `<FullRender>`。
- [x] **T7 `error.tsx` + `loading.tsx`（AC6, AC7）**
  - [x] `error.tsx`（`'use client'`，`{ error }` prop + useEffect console.error）：render.failed + stillArchived + 返回时间线 Link + 下载原文件 disabled 占位。（Next 16.2 推荐 prop 为 `unstable_retry`，本 story 无重试按钮，故只消费 `error`。）
  - [x] `loading.tsx`：surface-container-low + caption「正在加载……」，无 spinner。
- [x] **T8 验证（AC8/9/10）**
  - [x] `npm run typecheck` + `npm run lint` 绿（0 错误 0 警告）。
  - [x] RSC 边界自查：error.tsx 'use client' 仅 import 纯 voice.ts；page/FullRender/TopChrome/queries/route 经 server-only、无泄漏。
  - [x] **AC10 实测通过**（dev server curl，无需登录）：未登录 `GET /api/entry/<uuid>/html` → **401 + 空 body（0 字节）**；malformed id 同样 401；页面 `/entry/<uuid>` 未登录 → **307 → /auth/signin**。
  - [x] ✅ 浏览器实测（alex 生产环境验收 2026-06-03）：**AC8** 归档 → 跳转看到沙箱渲染 + `←`/刷新持久；**AC9** 含 `<script>` 的 HTML 脚本不执行（iframe 内 + 新标签直接打开均不执行，CSP sandbox 生效）。
  - [x] ✅ `next build`：Vercel 生产构建通过（生产部署在线、alex 已验收即证；本机字体 gstatic flake 非代码问题）。

## Dev Notes

### 本 story 边界
- **做**：`getEntryById` + 动态页 + HTML 代理 route + 沙箱 iframe + 简化 Top Chrome + error/loading 边界 + voice 扩充。完成「归档→渲染」闭环（FR-3 + NFR-1 首次实装到 Full Render）。
- **不做**（防 scope creep）：
  - ❌ 上一/下一导航 + `get-adjacent` 接线 + `FullRenderKeyboard`（←/→/Esc 键盘）→ **Story 3.4**。本 story footer 的「Esc 返回时间线」**只是静态提示文字**，Esc 行为 3.4 才接。
  - ❌ ⋯ More Menu / inline 标题编辑 / 下载实装 / 删除 → **Epic 4**（error.tsx 的「下载原文件」是 disabled 占位）。
  - ❌ timeline 网格 / `getEntries` / `countEntries` / EntryCard 缩略 iframe → **Epic 3**（本 story queries.ts 只加 `getEntryById`）。
  - ❌ iframe 内容加载失败的 client onError 兜底（FR-4 D9c）→ 未来（见「error.tsx 边界」）。

### 🚨 iframe `src` vs `srcDoc`（锁定——必读，防被架构文档误导）
- **本 story Full Render iframe 用 `src={'/api/entry/'+id+'/html'}`，不是 `srcDoc`。** Epic 2.3 明确如此。
- ⚠️ 架构 [core-architectural-decisions.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md) 与 [project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md) 多处写 Full Render 用「srcDoc」——**已被 Epic 取代**。理由：Full Render 单文件可达 10MB，`srcDoc` 会把整份 HTML 内联进 RSC/页面 payload（臃肿）；`src=route handler` 走 2.1 `fetchEntryHtml` 的**流式 Response**，不缓冲、不进 DOM 内联。Route handler 的存在本身就是为了当 iframe 的 `src`（否则 Full Render 不需要它）。
- **`srcDoc` 留给 Epic 3 的 EntryCard 缩略图**（小、内联、视口懒渲染）——那里 srcDoc 才对。两处都配 `sandbox=""`。
- **安全等价**：`sandbox=""`（无 `allow-same-origin`）下，无论 `src`（同源 URL）还是 `srcDoc`，iframe 文档都获得 **opaque origin** → 无法访问宿主 cookie/localStorage；无 `allow-scripts` → script 不执行。故 `src` 路径完全满足 NFR-1。

### `sandbox=""` 安全模型 + 为何 route 仍能鉴权（关键，防误判 cookie 被沙箱挡掉）
- iframe 加载 `src="/api/entry/[id]/html"` 是一次**同源文档导航请求，会带上会话 cookie** → route 的 `requireAlex()` 对已登录 alex 通过。`sandbox` 属性限制的是**加载后文档的能力**（opaque origin、禁 script），**不剥夺初始 src 请求的凭据**。这正是设计意图：服务端用 R2 凭据取 HTML，iframe 只是带 alex 会话 GET 这个代理 URL。
- 注：此链路本 story 才首次端到端跑通（2.2 push 落到 404，未验过 iframe）。AC9 浏览器实测要确认沙箱真生效。

### `getEntryById`：Date→ISO + 非法 UUID 守卫（archiveEntry 之外首个查询）
- schema 注释（[schema.ts:12-15](web/lib/db/schema.ts)）与 [types.ts:9-13](web/lib/entry/types.ts) 已约定：**领域 `Entry` 用 ISO string，DB 边界做 `Date → ISO` 映射**。`getEntryById` 是落地此约定的第一个查询——`getEntries`（Epic 3）会照同样模式。**别**用 `InferSelectModel<typeof entries>` 直接当 `Entry`（Date 类型会漏）。
- 非法 UUID：URL 的 `[id]` 可为任意字符串；非 UUID 喂 PG `uuid` 列 → 抛错 → 页面 500。守卫（UUID 校验失败即 `null`）使「乱填 id」走 `notFound()` / 404 而非 500。
- 映射示例：
  ```ts
  const [row] = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
  if (!row) return null;
  return { ...row, archivedAt: row.archivedAt.toISOString(), createdAt: row.createdAt.toISOString() };
  ```

### 鉴权分层（proxy + page + route；throw 行为）
- **三层**（[core-architectural-decisions.md NFR-2](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md)）：① 应用层 `proxy.ts`（乐观 cookie 校验，**非安全边界**）② API 层 `requireAlex()`（真鉴权）③ 资源层 R2 私有。
- **proxy 现状**（[proxy.ts](web/proxy.ts)）：页面无 cookie → 302 `/auth/signin`；`/api/*` 无 cookie → 401 空 body。**乐观**——cookie 可伪造，权威校验靠 handler 首行 `requireAlex()`。
- **route handler `/api/entry/[id]/html`**：`requireAlex()` 是**关键安全门**（present-but-invalid cookie 能过 proxy 乐观校验 → 此处 catch → 401 空 body）。**非可选**。
- **page.tsx requireAlex()**：Epic 要求首行调用（防御纵深；`auth.config.ts` 注释点名「Epic 2 首个私有页落地时引入」——`/entry/[id]` 即首个）。
  - throw 行为：正常 alex 不抛；未登录被 proxy 提前 302（page 不执行）；**present-but-invalid cookie**（罕见，过期/伪造）→ page 的 requireAlex 抛 `UNAUTHORIZED` → 落 `app/entry/[id]/error.tsx`「渲染未能完成。」。文案略偏（实为鉴权失败）但**无数据泄露**、场景罕见，V1 可接受。
  - 可选增强（非 AC 要求）：page 内 `try { await requireAlex() } catch { redirect('/auth/signin') }` 给更准 UX。本 story 默认按 Epic 直接 `await requireAlex()` 首行即可，保持简单。
  - 现有 home `app/page.tsx` **未**调 requireAlex（仅靠 proxy）——本 story 不改它；`/entry/[id]` 按 Epic 加 requireAlex 是有意的纵深，不必强求一致。
  - 备选（不做）：抽 `app/entry/[id]/layout.tsx` 调 requireAlex 的受保护 layout——Epic 未要求、home 也没用，**本 story 不引入**（避免 scope creep）。

### error.tsx 边界：catch 什么 / 不 catch 什么
- `app/entry/[id]/error.tsx`（`'use client'`，Next 强制 client）捕获 **page/FullRender 等 Server Component 渲染期的抛错**：如 `getEntryById` 的 DB 抛错、page 的 `requireAlex` 抛 `UNAUTHORIZED`。
- **不**捕获 iframe 内容加载失败（R2 宕机 / 对象缺失）——那是 opaque iframe 内的资源加载，宿主页面无从观测（需 client 组件给 iframe 挂 onError 兜底，本 story FullRender 是 Server Component、iframe 是纯 DOM，**不做**）。即「Full Render 失败」(UX-DR25) 在本 story 主要覆盖 Server Component 抛错路径；iframe 级失败的优雅兜底是未来项。**别**期望 error.tsx 能接住坏掉的 iframe。
- `error.tsx` import `COPY`（voice.ts）安全：voice.ts 是纯 const 对象、无 `server-only`，可在 client 用。

### Next 16 specifics（AGENTS.md 强制：写码前查 `node_modules/next/dist/docs/`）
- `params` 是 **Promise** → page 与 route handler 都必须 `await params`（[AGENTS.md](web/AGENTS.md)）。
- `error.tsx` 必须 `'use client'`，签名 `{ error: Error & { digest?: string }, reset: () => void }`。
- `loading.tsx` 可为 Server Component（Suspense fallback）。
- `notFound()` from `next/navigation`；无自定义 `not-found.tsx` → 用 Next 默认 404（本 story 不建 not-found.tsx）。
- 页面/route 因 `requireAlex()`→`auth()`→读 cookie 自动 **dynamic**（不会被静态缓存），无需显式 `export const dynamic`。本 story **不**给代理响应加 Cache-Control（V1 默认即可）。
- 本项目 Next 16.2.6 + React 19.2.4；middleware 已更名 proxy（见 [auth.config.ts](web/lib/auth/auth.config.ts) 顶部说明）。

### 视觉规格 + token classes（照搬现成 class，别造新值）
- token class 体系见 [globals.css](web/app/globals.css)（Tailwind v4 `@theme`，无 tailwind.config.ts）。既定用法范式：[EmptyState.tsx](web/components/EmptyState.tsx) / [ArchiveModal.tsx](web/components/ArchiveModal.tsx)。
- **TopChrome**（DESIGN.md「Top Chrome」+ UX-DR15 基础版）：容器 `bg-surface border-b border-outline-variant` + padding（参考 prototype `px-4 md:px-8 py-3`）；标题 `font-serif text-headline-sm text-on-surface truncate`；时间 `font-mono text-mono-metadata text-on-surface-variant`；返回链接 `text-on-surface-variant hover:text-on-surface`。
- **error.tsx**（DESIGN.md Empty State 风格但**独立文案**，**不复用 `<EmptyState>`**——其文案是「还没有 Entry。」，与渲染失败语义不符）：居中 `font-serif` 标题 + `text-on-surface-variant` 描述 + 返回链接（primary 色）+ disabled 下载占位（`opacity-40 cursor-not-allowed`）。错误提示如需 `role="alert"` 参考 ArchiveModal。
- **loading.tsx**：`bg-surface-container-low` 占位 + 居中 `font-sans text-caption text-on-surface-variant`「正在加载……」。
- 颜色/字号一律用 token class（`text-headline-sm`/`text-mono-metadata`/`text-caption`/`bg-surface`/`border-outline-variant`/`text-on-surface(-variant)`/`text-primary`…），**禁**裸 px / 裸 hex。暗色自动跟随（token 已翻转）。

### 布局高度（iframe 撑满）
- iframe `h-full` 需父级有确定高度链。prototype 用 `flex flex-col h-screen`（header/footer `flex-none` + main `flex-1 overflow-auto` + iframe `w-full h-full`）已验证可行。
- 本项目 layout body 是 `min-h-full flex flex-col`（[layout.tsx](web/app/layout.tsx)）；FullRender 作为 page 直接子节点，根节点用 `flex flex-1 flex-col min-h-0`（融入 body flex 列）或直接 `h-screen`（参考 prototype）。推荐前者与 home `<main className="flex flex-1">` 一致；任选其一保证 iframe 有高即可。
- `<main id="main">` 必须保留（layout skip-link `#main` 目标，a11y）。

### prototype 参考（平移规则：保留 iframe pattern / 视觉，剔除 mock 二元性 + client 交互）
- [prototype/pwa-explore/components/FullRender.tsx](prototype/pwa-explore/components/FullRender.tsx) 是完整版（含 prev/next/menu/删除/键盘/`isUserEntry` mock 分支）。**本 story 砍到基础**：去掉 `'use client'`（变 Server Component）、去 `allEntries`/`getAdjacentEntries`/menu/删除/键盘/mock 分支；保留 Top Chrome 视觉骨架 + iframe `sandbox=""`+`title`+`key` + footer 提示。Top Chrome 拆出独立 `FullRenderTopChrome.tsx`。
- iframe `key={entry.id}`：切换 Entry 时强制重挂（Story 3.4 prev/next 用得上；本 story 加上无害）。
- prototype 时间显示「归档于 {absoluteTime}」带前缀——Epic AC 写 `<time>{absoluteTime}</time>`，前缀「归档于 」可选（读起来更顺，dev 定）。

### 来自 Story 2.1 / 2.2 的就绪件（previous story intelligence）
- ✅ `fetchEntryHtml(key): Promise<Response>`（[fetch.ts](web/lib/r2/fetch.ts)）已就位且**实测**可用（2.1 烟雾测试）：流式 `transformToWebStream()` + `Content-Type: text/html; charset=utf-8`；Body 缺失防御 404；key 不存在抛 `NoSuchKey`（**本 story route 负责 catch→404**）。**route 直接 `new Response(r2Response.body, …)` 转发**。
- ✅ `requireAlex()`（[require-alex.ts](web/lib/auth/require-alex.ts)）抛 `new Error('UNAUTHORIZED')`——route 包 try/catch→401 空；page 首行直接 await。
- ✅ `router.push('/entry/'+id)` 已在 [ArchiveFlow.tsx:81](web/components/ArchiveFlow.tsx)（2.2）。本 story 让目标页存在即闭环 AC8，**无需动 ArchiveFlow**。
- ✅ `Entry` 类型 + `absoluteTime` + `COPY`（render.failed/loading 已有）。`entries` 表 + `db` + `eq`（drizzle-orm）就位。
- ✅ R2_* env 已必需且 Vercel 已填（2.1）；本 story **无新增必需 env**，推 main 无新 env 风险。
- ⚠️ neon-http 无事务——与本 story无关（纯读）。

### git intelligence
- 最近 `c35584f`（Story 2.2 → done）在 main。本 story 直接 **main 提交并推送**（[git-setup](.claude/projects/-Users-alex-Developer---------my-bmad-app/memory/git-setup.md)：alex 明确不建分支）。commit message 末尾带 `Co-Authored-By: Claude Opus 4.8 (1M context)` trailer。
- 约定延续：每 story 单独提交；服务端日志 `[domain] message`（本 story route 用 `[entry-html]`）；文案走 voice.ts；token class 不造新值。
- 推 main 前确认 Vercel env 齐全——本 story 无新增必需 env，2.1 的 R2 4 变量已填。

### Project Structure Notes
- **新增**：`web/lib/db/queries.ts`、`web/app/entry/[id]/page.tsx`、`web/app/entry/[id]/error.tsx`、`web/app/entry/[id]/loading.tsx`、`web/app/api/entry/[id]/html/route.ts`、`web/components/FullRenderTopChrome.tsx`。
- **修改**：`web/components/FullRender.tsx`（占位→实装）、`web/lib/voice.ts`（render 微文案）。
- 与架构目录结构严格一致（[project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md) 已列全部路径）。`queries.ts` 落地架构点名的 DB 查询收口；`/api/entry/[id]/html` 落地 NFR-1 服务端代理。

### 测试 / 验证（本 story 特性：需浏览器 + 可 curl 验 401）
- `npm run typecheck` + `npm run lint`：dev 必跑绿。
- **AC10 可独立验**（无需登录）：`curl -i http://localhost:3000/api/entry/00000000-0000-4000-8000-000000000000/html`（dev server）→ 期望 **401 空 body**（proxy 无 cookie 即 401；登录态下到 handler 的 requireAlex 也 401 若 session 无效）。
- **AC8/AC9 需浏览器**（`next dev` + 登录，或浏览器工具驱动）：
  - AC8：登录 → 拖入/选一份 .html → 确认 → 应跳 `/entry/[id]` **看到沙箱渲染**（不再 404）；`←` 回主屏；刷新该 URL 仍在。
  - AC9：归档一份**含 `<script>document.title='HACKED'</script>` 或写 cookie/`parent.location` 的 HTML** → Full Render 里 script **不执行**（标题不变 / 无跳转 / DevTools 无该 cookie）。
  - 可用 dev server + preview/浏览器工具实际驱动；magic link 登录无法自动化 → 需 alex 或浏览器工具协助。
- `next build` 本机被已知 fonts.gstatic CJK flake 阻断（非本 story 代码，报错在 `app/layout.tsx` 字体）→ **Vercel 权威构建**，不耗时重试。

### References
- Epic 2 Story 2.3 原文：[epic-2-归档第一份-entryfirst-archive.md](_bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/epic-2-归档第一份-entryfirst-archive.md#story-23-full-render-基础--归档跳转衔接)
- Route Handler / Server Action 契约 / 401 空 body / 日志 / iframe 沙箱反例：[implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)
- NFR-1 沙箱（srcDoc+sandbox / opaque origin）+ NFR-2 三层 + Full Render 流：[core-architectural-decisions.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md) · [project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)
- Top Chrome / 加载 / 失败 视觉 + voice：[DESIGN.md](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md)（Components·Top Chrome）· [EXPERIENCE.md](_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md)（State Patterns·Full Render 加载/失败、Voice and Tone）
- 视觉 mock（composition 参考，spine 冲突时胜出）：`_bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/mockups/full-render-mock.html`
- Next 16 须知：[web/AGENTS.md](web/AGENTS.md) + `node_modules/next/dist/docs/`
- 就绪件源码：[fetch.ts](web/lib/r2/fetch.ts) · [require-alex.ts](web/lib/auth/require-alex.ts) · [schema.ts](web/lib/db/schema.ts) · [types.ts](web/lib/entry/types.ts) · [ArchiveFlow.tsx](web/components/ArchiveFlow.tsx) · [proxy.ts](web/proxy.ts) · [absolute-time.ts](web/lib/entry/absolute-time.ts)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (1M context) · 2026-06-03

### Debug Log References

- `npm run typecheck`（tsc --noEmit）：0 错误。
- `npm run lint`（eslint）：0 错误 0 警告（含 route handler 未用的 `_request` 参数无 unused 告警）。
- 写码前查 `node_modules/next/dist/docs/`（AGENTS.md 要求）核对 Next 16.2.6：动态 `params: Promise` + `await`；`error.tsx` 必 'use client'（16.2 起推荐 `unstable_retry`，本 story 无重试按钮故只用 `error`）；`loading.tsx` 默认 Server Component；有 loading.tsx 时 `notFound()` 可成 soft-404（200+noindex）—— 私有单用户无 SEO 影响，接受。
- AC10 实测（临时 `next dev --port 3100`）：Ready in 320ms 无崩溃；未登录 `/api/entry/<uuid>/html` → 401 空 body（0 字节）；malformed id → 401；`/entry/<uuid>` → 307 → /auth/signin。

### Completion Notes List

**已完成（代码 + 静态验证 + AC10 运行时验证）：**
- T1–T7：queries.ts(`getEntryById`) / voice 扩充 / HTML 代理 route / FullRenderTopChrome / FullRender 实装 / page / error+loading。
- 关键决策落地：① iframe 用 **`src`=route handler**（流式，非 srcDoc）—— 架构文档的 srcDoc 提法被 Epic 取代；srcDoc 留 Epic 3 缩略图；② `getEntryById` 在 DB 边界做 **Date→ISO 映射** + **非法 UUID 守卫**（防 garbage id → 500）；③ route handler **requireAlex catch→401 空 body**（NFR-2 资源层，非 404）；④ `sandbox=""` 空属性（opaque origin + 禁 script，NFR-1）；⑤ 文案全走 voice.ts。
- typecheck + lint 绿；RSC 边界经分析正确（server-only 未泄漏到 client；error.tsx 仅引纯 voice.ts）。
- AC10 实测通过（401 空 body + 页面 307 重定向）。

**已验证（alex 生产环境验收 2026-06-03）：**
- ✅ AC8 / AC9 认证态浏览器全链路：归档 → 跳 `/entry/[id]` 看到沙箱渲染；含 `<script>` 的 HTML 脚本不执行（iframe 内 + 新标签直接打开均不执行 → CSP sandbox + iframe sandbox 双重生效）。
- ✅ Vercel 生产构建 + 部署通过（生产在线验收即证）。

### File List

**新增：**
- `web/lib/db/queries.ts`
- `web/app/entry/[id]/page.tsx`
- `web/app/entry/[id]/error.tsx`
- `web/app/entry/[id]/loading.tsx`
- `web/app/api/entry/[id]/html/route.ts`
- `web/components/FullRenderTopChrome.tsx`

**修改：**
- `web/components/FullRender.tsx`（占位空壳 → Full Render 实装：Top Chrome + 沙箱 iframe + footer）
- `web/lib/voice.ts`（新增 `render.stillArchived` + `fullRender` 组）

## Senior Developer Review (Codex)

**Reviewer**: Codex CLI v0.130.0（gpt-5.5, reasoning xhigh）· 2026-06-03 · 对抗式（`codex review -`，staged 未提交改动全量）
**Outcome**: 1 finding（**P1**），**已修复并复验**（typecheck + lint 绿）。无 High/P2/P3。Codex 明确判定 auth-first 流程、Next 16 async params、Date→ISO 映射、非法 UUID 守卫、RSC server/client 边界**均正确**。

### Action Items
- [x] **[P1] HTML 代理响应加 CSP sandbox** — `app/api/entry/[id]/html/route.ts`：iframe 的 `sandbox=""` 只在「被嵌入」时生效；认证态**直接导航 / 新标签打开** `/api/entry/[id]/html` 时，归档 HTML 作为同源顶层文档渲染、`<script>` 可带 alex 会话执行（存储型 XSS）。**已修**：200 响应加 `Content-Security-Policy: sandbox`（无 allow token，等价空 `sandbox=""`）→ opaque origin + 禁 script，不论嵌入还是直接导航都被沙箱化。强化 NFR-1。AC9 浏览器实测项已补「新标签直接打开」检查。

### Re-verification（2026-06-03）
- `npm run typecheck` + `npm run lint`：均通过（0 错误 0 警告）。
- CSP 头为 200（认证态）分支静态新增，typecheck 覆盖；可观测验证并入 alex 的 AC9 浏览器实测（直接导航该 URL 脚本不执行）。
- `next build` 仍受本机 fonts.gstatic CJK flake 阻断（非本 story 代码）→ Vercel 权威构建。
