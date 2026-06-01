# Epic 1: 私人空间（Foundation & Private Access）

**Epic Goal**：建立 alex 私人的 MindPrint 空间——项目骨架就绪、部署到云、按 DESIGN.md 视觉调性呈现登录页与空主屏、Magic Link 认证生效、仅 alex 可访问。完成后 alex 能在任意设备的浏览器访问到一个已认证、视觉调性正确的 MindPrint，看到空状态主屏。

**Implementation Scope**：
- Story 0 类工作：`create-next-app` 跑 `web/` + 从 `prototype/pwa-explore/` 平移类型 / 纯函数（剔除 IndexedDB / Serwist / mock 数组）
- Drizzle + Neon Postgres + **5 张表一次性 migration**（users / sessions / verification_tokens / accounts / entries）
- Auth.js v5 + Drizzle adapter + Resend Email Provider + Magic Link
- `signIn` callback 邮箱白名单（`env.ALLOWED_EMAIL`）
- middleware.ts 应用层重定向（NFR-2 应用层）
- requireAlex() helper（NFR-2 API 层）
- 登录页 + verify-request 页 + auth error 页
- DESIGN.md tokens 桥接 Tailwind 4（`tailwind.config.ts`）
- 中文优先字体加载（next/font + 思源宋体 / 黑体 / JetBrains Mono）
- 暗色模式 `prefers-color-scheme` 自动切换
- Empty State 视觉基础 + Voice & Tone microcopy 字典
- typed env Zod 校验（`lib/env.ts`）
- Vercel project 配置 + 默认 vercel.app 子域上线
- 基础 a11y（focus ring + tab order + reduced motion）

**FRs covered**: **FR-6**
**NFRs covered**: NFR-2 应用层 + API 层
**UX-DRs covered**: UX-DR1–7（tokens 系统）+ UX-DR10–11（Button / Input 基础）+ UX-DR19（Auth Screen）+ UX-DR20（Empty State 基础）+ UX-DR29–30（a11y / reduced motion 基础）+ UX-DR32（voice & tone）

**Standalone Test**：alex 在浏览器访问 https://<vercel-subdomain>.vercel.app → 输入白名单邮箱 → 收到 Magic Link → 点击 → 登录成功 → 看到按 DESIGN.md 调性呈现的空主屏 + Empty State 文案。

## Story 1.1: 项目初始化 + 原型代码平移

As alex,
I want a clean Next.js 16 project at `web/` with my prototype's validated types, pure functions, and component contracts migrated in (and the IndexedDB / Serwist PWA / mock data baggage left behind),
So that subsequent stories build on tested foundations without reinventing already-validated work.

**Acceptance Criteria:**

**Given** repo root at `/Users/alex/Developer/个人项目/实验/my-bmad-app/`
**When** I run `npx create-next-app@latest web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`
**Then** `web/` directory is created with Next.js 16 + React 19 + Tailwind 4 + TypeScript 5 + Turbopack defaults
**And** `web/app/layout.tsx` + `web/app/page.tsx` + `web/app/globals.css` exist

**Given** new `web/` codebase
**When** I migrate prototype code into `web/lib/entry/`
**Then** files exist split from `prototype/pwa-explore/lib/mock-entries.ts`:
- `types.ts` — `Entry` type with fields `{ id, title, archivedAt, originalFilename, sizeBytes, r2ObjectKey, createdAt }`; plus `SortDirection`, `EntryGroup<T>`, `ActionResult<T>`, `ActionError`, `ActionErrorCode`
- `group-by-month.ts` / `sort-entries.ts` / `get-adjacent.ts` / `relative-time.ts` / `absolute-time.ts` / `extract-title.ts` — pure functions preserved behavior-wise

**Given** components migrated
**When** I look at `web/components/`
**Then** placeholder shells exist for `Timeline.tsx`, `EntryCard.tsx`, `MonthDivider.tsx`, `FullRender.tsx`, `ArchiveModal.tsx`, `Dropzone.tsx`, `SortToggle.tsx`

**Given** "平移即净化"原则
**When** I grep `web/` for `IndexedDB`, `Serwist`, `MOCK_ENTRIES`, `htmlPath`, `withSerwist`
**Then** **zero matches** found
**And** no `app/sw.ts` file
**And** `web/next.config.ts` is plain (no `withSerwist`, no `turbopack: {}` workaround)

**Given** install + dev
**When** I run `cd web && npm install && npm run dev`
**Then** dev server starts on `localhost:3000` without errors
**And** `npm run lint` passes
**And** `tsc --noEmit` passes

**Implementation Notes**:
- 平移时**禁保留** `MockEntry` / `MOCK_ENTRIES` / `htmlPath`
- 7 个纯函数行为不变（仅类型名变化）
- 组件文件先放空壳，后续 Story 接入实际逻辑

## Story 1.2: 数据层基础（Drizzle + 5 表 schema + typed env）

As alex,
I want the Postgres schema with all 5 tables (4 Auth.js + entries) on Neon, with Drizzle configured and typed env validated at startup,
So that authentication (Story 1.3) and Entry persistence (Story 2.2) have a ready foundation.

**Acceptance Criteria:**

**Given** Neon account
**When** alex creates project `mindprint` with dev / preview / production branches
**Then** alex obtains `DATABASE_URL` connection strings (含 `?sslmode=require`)

**Given** `web/` codebase
**When** I create `web/drizzle.config.ts`
**Then** schema path `./lib/db/schema.ts`, migrations `./drizzle/migrations`, dialect `postgresql`, credentials from `DATABASE_URL`

**Given** Drizzle config
**When** I create `web/lib/db/schema.ts`
**Then** 5 Drizzle tables exported (snake_case columns → camelCase TS):
- `users` (Auth.js standard: id uuid PK, name nullable, email text unique notnull, emailVerified timestamptz nullable, image nullable)
- `accounts` (Auth.js: provider+providerAccountId composite PK + FK to users)
- `sessions` (Auth.js: sessionToken PK, userId FK, expires timestamptz)
- `verification_tokens` (Auth.js: identifier+token composite PK, expires timestamptz)
- `entries` (id uuid PK defaultRandom, user_id FK to users, title text notnull, archived_at timestamptz notnull defaultNow, original_filename notnull, size_bytes integer notnull, r2_object_key text notnull unique, created_at timestamptz notnull defaultNow)
**And** entries has index `idx_entries_archived_at` for sort
**And** **no `deleted_at`** column (hard delete per FR-7)
**And** **no future-OQ columns** (`content_hash` / `tags` / `source_version`)

**Given** schema
**When** I create `web/lib/db/client.ts`
**Then** exports `db` via `drizzle({ schema })` with `drizzle-orm/neon-http` + `@neondatabase/serverless`

**Given** Drizzle config + schema
**When** I run `npx drizzle-kit push`
**Then** all 5 tables created in Neon dev branch
**And** `npx drizzle-kit studio` shows 5 empty tables

**Given** env validation
**When** I create `web/lib/env.ts`
**Then** exports Zod-validated `env` object covering 11 vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_RESEND_KEY`, `ALLOWED_EMAIL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_BACKUP_BUCKET_NAME`, `NEXTAUTH_URL`, `DATABASE_URL_READONLY`
**And** R2 vars marked `.optional()` (filled in Epic 2)
**And** validation runs at module load (fail-fast)
**And** missing required var → clear error naming the var

**Given** `.env.example`
**When** I commit `web/.env.example`
**Then** 11 env var names listed with placeholder + 中文注释
**And** `.env.local` is gitignored

**Implementation Notes**:
- `@auth/drizzle-adapter` 期望特定字段名映射，按 adapter 文档对齐
- Push mode for dev; switch to `generate + migrate` 在 Story 4.5 上线前

## Story 1.3: 认证基线（Auth.js + Magic Link + middleware + 三个 auth 页面）

As alex,
I want Magic Link authentication with my email whitelisted, middleware redirecting unauthenticated requests, and three minimal auth pages,
So that only I can access MindPrint and the access flow works end-to-end on any device.

**Acceptance Criteria:**

**Given** Story 1.2 完成
**When** I add deps `next-auth@^5`, `@auth/drizzle-adapter`, `resend`, `react-email`, `@react-email/components`
**Then** `web/package.json` updated

**Given** auth deps
**When** I create `web/lib/auth/config.ts`
**Then** exports `NextAuthConfig` with:
- DrizzleAdapter(db, { users, accounts, sessions, verification_tokens })
- Resend Email Provider with `env.AUTH_RESEND_KEY` + `from: 'MindPrint <noreply@<domain>>'`
- `callbacks.signIn`：**邮件发送前**校验 `user.email === env.ALLOWED_EMAIL`；非匹配 return false
- `session.strategy = 'database'`
- `session.maxAge = 60 * 60 * 24 * 30`
- `pages.signIn = '/auth/signin'`, `pages.verifyRequest = '/auth/verify-request'`, `pages.error = '/auth/error'`

**Given** Auth.js config
**When** I create `web/app/api/auth/[...nextauth]/route.ts`
**Then** re-exports `GET` and `POST` from NextAuth(authConfig)

**Given** React Email
**When** I create `web/lib/auth/magic-link-email.tsx`
**Then** exports `MagicLinkEmail({ url, host })` containing wordmark + "你请求登录 MindPrint。" + 主按钮 → url + "如未请求可忽略。"
**And** voice 严格匹配 EXPERIENCE.md table（陈述 / 无 emoji）
**And** Resend `sendVerificationRequest` hook 渲染该模板

**Given** API 层守卫
**When** I create `web/lib/auth/require-alex.ts`
**Then** exports `async function requireAlex(): Promise<Session>` that:
- 调 Auth.js `auth()`
- session null 或 `user.email !== env.ALLOWED_EMAIL` → `throw new Error('UNAUTHORIZED')`
- 否则 return session

**Given** middleware (NFR-2 应用层)
**When** I create `web/middleware.ts`
**Then** matcher 排除 `/api/auth`, `/auth`, `/_next/static`, `/_next/image`, `/favicon.ico`
**And** 未认证 → redirect `/auth/signin`
**And** 认证 → next()

**Given** signin page
**When** I create `web/app/auth/signin/page.tsx`
**Then** 渲染极简 UI: MindPrint wordmark + 邮箱 Input + Primary 按钮 "发送 Magic Link"
**And** **无注册 / 社交 / 找回密码**
**And** form submits 触发 Auth.js Email Provider

**Given** verify-request page
**When** I create `web/app/auth/verify-request/page.tsx`
**Then** 显示 display-lg "已发送 Magic Link。" + body-lg "请去邮箱点击链接登录。"

**Given** auth error page
**When** I create `web/app/auth/error/page.tsx`
**Then** 显示 "无法登录。" + "此账号不在允许列表内。" + Secondary "返回"
**And** **不泄露白名单邮箱地址**

**Given** 完整链路
**When** alex 访问 `/`
**Then** middleware → `/auth/signin` → 输入邮箱 → 跳 `/auth/verify-request` → 收信 → 点链接 → 30 天 session → 重定向回 `/`

**Given** 攻击场景
**When** 非白名单邮箱 → signIn callback 返回 false → **不发邮件、不写 verification_token**
**Then** UI 仍跳 verify-request（避免泄露白名单成员身份）

**Given** logs
**When** Magic Link 发送
**Then** 看到 `[auth] magic link sent to <email>` 等 `[domain] message` 格式日志

**Implementation Notes**:
- 邮箱白名单 callback 在 `callbacks.signIn`（邮件发送前拦截）
- Magic Link 链接有效期 24h（Auth.js 默认）
- middleware matcher: `'/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)'`

## Story 1.4: 视觉系统（Tailwind tokens + 字体加载 + 暗色模式 + Empty State）

As alex,
I want DESIGN.md's complete token system bridged into Tailwind 4, Chinese fonts with fallback chains, automatic dark mode, and a fully-styled Empty State,
So that MindPrint visually feels like the "editorial archive" from the moment I login.

**Acceptance Criteria:**

**Given** DESIGN.md tokens
**When** I create `web/tailwind.config.ts` + `web/app/globals.css`
**Then** `theme.extend.colors` 包含 all light + dark tokens（surface / on-surface / outline / outline-variant / primary / secondary / error 系列）
**And** `globals.css` `:root` 定义 CSS variables；`@media (prefers-color-scheme: dark) { :root {...} }` 含倒置 tokens
**And** light 模式：bg #FAF8F3 / text #1B1C19 / primary #735C41
**And** dark 模式：bg #1A1B19 / text #F0EDE5 / primary #E0C1A1 暖米色

**Given** typography
**When** Tailwind config + next/font
**Then** `theme.extend.fontFamily.serif/sans/mono` 含中文 → 英文 → 系统 fallback 链
**And** Newsreader 和 JetBrains Mono 通过 `next/font/google` 加载（思源系字体系统 fallback）
**And** font-size scale 含 display-lg (48px / mobile 36px) / headline-md (28px) / headline-sm (20px) / body-lg (17px) / body-md (15px) / label-caps (12px uppercase) / caption (13px) / mono-metadata (12px)

**Given** spacing / radius / shadow
**When** Tailwind config 配置
**Then** spacing `card-gap: 20px` / `card-padding: 16px` / `gutter: 24px` / `margin-mobile: 20px` / `margin-desktop: 56px` / `editorial-gap: 64px`
**And** borderRadius sm (2px) / DEFAULT (4px) / md (6px) / lg (8px) / xl (12px) / full
**And** boxShadow `card-rest`、`card-hover`、`menu`（染棕极轻阴影）

**Given** EmptyState spec
**When** I create `web/components/EmptyState.tsx` (Server Component)
**Then** 居中 layout：mono label "empty archive" + display-lg "还没有 Entry。" + body-lg "从这里开始。" + Primary 按钮 "归档第一份"
**And** **无 illustration / icon / emoji**

**Given** Voice & Tone 字典
**When** I create `web/lib/voice.ts`
**Then** exports `COPY` 对象含 ≥ 12 个 microcopy 字符串（archive.success/failed、entry.delete.confirm.*、timeline.empty.*、render.failed、ui.cancel/confirm 等）

**Given** a11y 基线
**When** I update layout.tsx
**Then** `<html lang="zh-CN">` + skip link + focus ring CSS（`*:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }`）
**And** `@media (prefers-reduced-motion: reduce) { *: transition-duration: 0.001ms !important; ... }`

**Given** 视觉系统就绪
**When** alex 登录后访问 `/`
**Then** 看到暖白 #FAF8F3 + 中文衬线 + 居中 EmptyState + 深棕 Primary 按钮
**And** 切换系统 dark mode → 倒置 tokens 应用
**And** Tab 聚焦 → focus ring 可见且对比 ≥ 4.5:1
**And** 系统 reduced motion → 所有动画 < 1ms

**Implementation Notes**:
- 思源宋体不在 Google Fonts，用 system fallback 或 self-hosted `local('Source Han Serif SC')`
- Tailwind 4 的 `@theme` 块语法可替代 `tailwind.config.ts`——按 Tailwind 4 文档选最新
- **不为 Story 7 预留**——所有视觉设计在本 Story 完成

## Story 1.5: 首次云部署（Vercel + vercel.app 子域）

As alex,
I want MindPrint deployed to Vercel's default vercel.app subdomain with all env vars configured for production, accessible via HTTPS on any device,
So that I can login to my private MindPrint from any browser without local dev running.

**Acceptance Criteria:**

**Given** GitHub repo
**When** alex 在 Vercel 创建项目链接 repo
**Then** Root Directory = `web/`、Build = `npm run build`、Install = `npm install`、Node 20.x LTS

**Given** Vercel 项目
**When** alex 配置三套 Environment Variables (Development / Preview / Production)
**Then** 11 个 env vars 填入：DATABASE_URL（每 branch）、AUTH_SECRET（`openssl rand -base64 32`）、AUTH_RESEND_KEY、ALLOWED_EMAIL、R2_* 占位（Epic 2 填）、NEXTAUTH_URL、DATABASE_URL_READONLY 占位

**Given** push to main
**When** alex push 代码
**Then** Vercel auto production build 触发
**And** build 通过（lint + typecheck + next build）
**And** deployment URL 可访问

**Given** deployment 完成
**When** alex 在 macOS Chrome 访问 `https://<vercel-subdomain>.vercel.app`
**Then** middleware redirect → `/auth/signin`
**And** Magic Link 完整工作（输入邮箱 → 收信 → 点击 → 30 天 session）
**And** 登录后看到 DESIGN.md 调性的 Empty State

**Given** 多设备测试（FR-6 多设备同时登录）
**When** alex 在 iPhone Safari 访问同一 URL
**Then** 可同时登录（不顶 Mac 端 session）
**And** 视觉响应式正确
**And** 暗色模式跟随手机系统

**Given** Vercel logs
**When** alex 看 runtime logs
**Then** 无 unexpected error
**And** Magic Link 流程有 `[auth]` 前缀日志

**Implementation Notes**:
- AUTH_SECRET 不要变（变了 session 全失效）
- R2 凭据本 Story 留占位，Epic 2 填真值后 redeploy
- 自定义域名留到 Story 4.4
- 首次部署后实测多设备登录验证 FR-6

---
