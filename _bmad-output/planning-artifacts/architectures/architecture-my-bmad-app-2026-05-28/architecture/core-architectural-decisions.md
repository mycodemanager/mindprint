# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions（阻塞实现，必须先定）：**
- 元数据库 = **Neon serverless Postgres**
- 对象存储 = **Cloudflare R2**（alex 自有 CF 账号 + S3 兼容 + 零 egress）
- 认证 = **Auth.js v5 + Resend Email Provider**（Magic Link）
- ORM = **Drizzle ORM 0.x + drizzle-orm/neon-http 驱动**
- 沙箱化机制 = **同源 srcDoc + `sandbox=""`**（NFR-1 锁定）
- API 风格 = **混合 · RSC 读 + Server Actions 写 + Route Handlers 按场景**
- 数据验证 = **Zod**
- 部署 = **Vercel**

**Important Decisions（塑造架构）：**
- 前端状态 = **纯 RSC + URL state + 最小 client state**
- 缩略预览 = **方案 a · 缩放 iframe + 视口懒渲染**（OQ-8 锁定）
- 备份策略 = **三重 · Neon PITR + R2 11-9 持久性 + 周期跨服务备份**
- CI/CD = **Vercel auto-deploy + GitHub Actions（lint + type-check）**

**Deferred Decisions（推到 step-05 / 实现阶段）：**
- 具体 Drizzle schema 设计 → step-05 patterns
- Tailwind tokens 与 DESIGN.md 绑定 → 实现阶段 Story 0
- 测试框架引入（Vitest / Playwright）→ 测试策略章节
- 缩略预览懒渲染 viewport 阈值具体值 → 实现阶段 + M3 retro

---

## Data Architecture

**数据库**：Neon serverless Postgres（latest，2026-05）

| 决策 | 选择 | 理由 |
|---|---|---|
| **DB 引擎** | Neon Postgres | scale-to-zero 适合 hobby 访问频率（每月 2-3 次）；纯 Postgres 标准便于未来迁出；与 Drizzle `neon-http` 是 2026 主推搭配 |
| **驱动** | `drizzle-orm/neon-http` + `@neondatabase/serverless` | HTTP 驱动 serverless-friendly，无连接池烦恼；与 Vercel 部署兼容 |
| **ORM** | Drizzle ORM | TypeScript-first、运行时近零开销（~60KB）、schema-as-code、迁移工具内置 |
| **迁移工具** | drizzle-kit | **生产环境用 `migrate`**（保留迁移历史）；**开发迭代用 `push`** 直到上线，上线后切换到 generate + migrate |
| **数据验证** | Zod + drizzle-zod | 与 Drizzle schema 自动生成验证 schema；与 Auth.js 内部依赖统一 |

**Schema 概览（详细在 step-05）：**
- `users`（单行——alex 自己）
- `sessions`（Auth.js 标准）
- `verification_tokens`（Auth.js Magic Link 临时凭据）
- `entries`（核心表：`id`、`title`、`archived_at`、`original_filename`、`size_bytes`、`r2_object_key`、`created_at`、`deleted_at`）

**Schema 演化策略（来自 step-02 ADR 悬而未决）：**
- **YAGNI 立场**——V1 schema 只含 PRD 当前 FR 所需字段，**不预留**未来 OQ 字段（`content_hash` / `tags` / `source_version`）
- 理由：Drizzle Kit 迁移成本低；与 PRD §6.2 "下游不应为暂不做功能预留脚手架" 一致
- 触发：未来 OQ-3 / OQ-7 触发时，按需 generate migration

**缓存策略**：
- 服务端：Next.js 16 `revalidatePath` / `revalidateTag` 在 mutation 后失效
- 客户端：无独立缓存层（纯 RSC + Server Actions 路径，无 SWR/TanStack Query）

---

## Authentication & Security

**认证机制**：Auth.js v5 + Resend Email Provider · Magic Link

| 决策 | 选择 | 理由 |
|---|---|---|
| **Auth 库** | Auth.js v5 (NextAuth) | Next.js 生态事实标准（1.5M 周下载）；Drizzle adapter 完善（`@auth/drizzle-adapter`）；Email Provider 原生支持 Magic Link |
| **Session 模式** | DB session（非 JWT） | Magic Link 流要求 DB（verification_tokens 表）；DB session 便于"30 天有效期 + 多设备登录 + 主动 revoke" |
| **Email Provider** | Resend | DX 最佳、React Email 模板原生、免费层 3000/月（hobby 永久免费区间） |
| **Magic Link 链接有效期** | 24 小时（Auth.js Email Provider 默认） | 与 PRD A6 "30 天会话" 解耦——24h 是单次链接时效，30 天是登录后会话时长 |
| **Session 时长** | 30 天（PRD A6） | Auth.js session `maxAge = 60 * 60 * 24 * 30` |
| **唯一允许的邮箱** | alex 的固定邮箱（环境变量 `ALLOWED_EMAIL`） | NFR-2 "仅 alex 可访问"——Auth.js `signIn` callback 中校验邮箱白名单，非 alex 邮箱直接拒绝 |
| **Lucia 已淘汰** | 不考虑 | 2024 末 sunset，Auth.js 是当前唯一稳定维护选项 |

**NFR-1 HTML 渲染沙箱化（锁定）**：

| 决策 | 选择 | 实现 |
|---|---|---|
| **机制** | **同源 srcDoc + `sandbox=""`** | iframe 内联 HTML（srcDoc）+ 空 sandbox 属性 |
| **凭据隔离** | iframe srcDoc 获得 **opaque origin**（浏览器规范 HTML Living Standard） | 即便宿主同源，iframe 也不可访问 MindPrint 的 cookie / localStorage / sessionStorage |
| **行为隔离** | sandbox 空属性 = 所有能力默认关闭 | 阻止 script 执行 / form 提交 / popup / topnav / plugins 等 |
| **HTML 流路径** | client ← Route Handler ← R2（服务端代理） | 签名 URL 不进 DOM；服务端可未来加 content validation / size 检查 |
| **缩略预览同样用此机制** | sandbox + 缩放 iframe（OQ-8 方案 a） | 与 Full Render 共享同一沙箱模型，符合 §4.2 FR-4 注释 |

**NFR-2 三层隔离实现**：

| 层 | 实现 |
|---|---|
| **应用层** | Next.js middleware（`middleware.ts`）拦截所有非 `/auth/*` 路径——未认证重定向至 `/auth/signin` |
| **API 层** | 所有 Route Handlers / Server Actions 入口处校验 session；未认证返回 **401 Response**（非 404，不泄露 Entry 是否存在）。封装为 `requireAlex()` helper |
| **资源层** | R2 桶**禁用 public access**；下载链接（FR-7）经服务端生成 **短时效 presigned URL**（5 分钟），URL 不进浏览器历史 |

**Magic Link 滥发防护**：单一邮箱白名单已自然阻止——非 alex 邮箱在 signIn callback 处即拒绝，不发邮件。

---

## API & Communication Patterns

**API 风格**：混合模式（Next.js 16 App Router 惯用法）

| 场景 | 实现 | 路径示例 |
|---|---|---|
| **时间线主屏数据** | Server Component 直接 await Drizzle 查询 | `app/page.tsx` |
| **Full Render 元数据** | Server Component dynamic route | `app/entry/[id]/page.tsx` |
| **归档上传**（FR-1/2/3） | Server Action | `app/_actions/archive.ts` 中 `'use server'` |
| **编辑标题**（FR-7） | Server Action | `app/_actions/update-title.ts` |
| **删除**（FR-7） | Server Action | `app/_actions/delete-entry.ts` |
| **Auth.js 回调**（Magic Link 链接点击） | Route Handler | `app/api/auth/[...nextauth]/route.ts` |
| **下载原 .html**（FR-7） | Route Handler（Content-Disposition header） | `app/api/entry/[id]/download/route.ts` |
| **HTML 内容代理**（Full Render iframe srcDoc 内容来源） | Route Handler 返回 HTML body | `app/api/entry/[id]/html/route.ts` |

**错误处理标准**：

- **Server Actions**：返回 `{ ok: true, data }` 或 `{ ok: false, error: { code, message } }` 类型化结构（不抛 throw 给客户端）；客户端 form action 通过 `useFormState` 接收
- **Route Handlers**：标准 HTTP status code + JSON body `{ error: { code, message } }`
- **认证失败**：所有端点 401 + 空 body（NFR-2 资源层不泄露）
- **未找到**（自己的 Entry 但 id 不存在）：404 + 短消息

**revalidate 策略**：
- 归档成功 → `revalidatePath('/')` + `revalidatePath('/entry/[id]')`
- 编辑标题 / 删除 → `revalidatePath('/')` + `revalidatePath('/entry/[id]')`
- 排序方向 = URL search param `?sort=asc|desc`，自动按 query 派生

---

## Frontend Architecture

**状态管理**：纯 RSC + URL state + 最小 client state

| 状态种类 | 存放位置 |
|---|---|
| **Entry 列表数据** | Server Component（每次请求新查） |
| **当前 Entry 数据**（Full Render） | Server Component（动态路由） |
| **排序方向** | URL search param `?sort=asc\|desc` |
| **归档 modal 开关 / 拖拽 overlay 显示** | `useState` in client component |
| **删除二次确认 modal 开关** | `useState` in client component |
| **inline 标题编辑态** | `useState` + Server Action |
| **当前用户身份** | Auth.js `auth()` helper（Server Components）/ `useSession()`（client，但 MindPrint UI 几乎不依赖此） |

**Server / Client Component 边界**：

- **默认 Server Component**：所有 `app/**/page.tsx`、`app/**/layout.tsx`、`components/Timeline.tsx`、`components/EntryCard.tsx`、`components/MonthDivider.tsx`、`components/FullRender.tsx` 主壳
- **必须 Client Component**（`'use client'` 顶部）：
  - `components/ArchiveModal.tsx`（拖拽 + 表单交互）
  - `components/SortToggle.tsx`（点击切 URL）
  - `components/InlineTitleEditor.tsx`（单击进编辑态、blur/Enter/Esc 键盘）
  - `components/MoreMenu.tsx`（dropdown 开关）
  - `components/ConfirmDeleteDialog.tsx`（modal 状态）
  - `components/Dropzone.tsx`（全屏 drag listener）
  - `components/FullRenderKeyboard.tsx`（← / → / Esc 监听，从 prototype 抽出）

**组件契约平移自原型**：EntryCard / FullRender / Timeline / ArchiveModal / MonthDivider 的视觉与行为契约直接平移；持久化层与 mock 数据剔除，改接 Server Component + Server Action。

**缩略预览实现（OQ-8 锁定）**：方案 a · 缩放 iframe + 视口懒渲染

| 实现细节 | 决策 |
|---|---|
| iframe 内容来源 | `srcDoc` 由 Server Component 内联渲染时传入（同 Full Render 的数据源 Route Handler） |
| 缩放方式 | `transform: scale()` + 固定原始尺寸（如 1200×900 缩到 280×210） |
| 懒渲染 | `IntersectionObserver` 视口外 iframe 不挂载 srcDoc（仅显示 surface-container 占位） |
| 失败 fallback | iframe load error 或超时 → 退化为"显示标题 + 归档时间"占位（FR-4 D9c）；**禁止静默降级到文本摘要**——若实施阶段或 M3 retro 发现性能不足，按 FR-4 可验收条件触发 PM 回顾 |

**性能预算（NFR-3 软目标）**：
- 时间线首屏（50 条目）< 2s — 通过 Server Component 单次 DB 查询 + RSC streaming + 缩略预览懒渲染达成
- Full Render（单击卡到 HTML 可见）< 1s — Route Handler 直接从 R2 流式 fetch HTML

---

## Infrastructure & Deployment

**部署平台**：Vercel

| 维度 | 决策 | 备注 |
|---|---|---|
| **平台** | Vercel | Next.js 原生最佳 DX、Server Actions / RSC day-1 支持、preview branches |
| **Vercel 项目** | 单一项目，连接 GitHub 仓库 | `main` → production；其他分支 → preview |
| **域名** | 自定义域名（如 `mindprint.<alex-domain>`）+ Vercel 自动 HTTPS | 上线前 alex 指定 |
| **环境变量** | Vercel project env vars（dev / preview / production 分离） | 含 `DATABASE_URL`、`AUTH_SECRET`、`AUTH_RESEND_KEY`、`ALLOWED_EMAIL`、`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME` |
| **对象存储** | Cloudflare R2 · alex 自己 CF 账号下的 bucket（建议名 `mindprint-entries`） | 桶**禁用 public access**；服务端用 `@aws-sdk/client-s3` 通过 R2 S3 兼容 endpoint 访问 |
| **R2 endpoint** | `https://<account-id>.r2.cloudflarestorage.com` | S3 兼容路径风格 |
| **DNS 管理** | Cloudflare DNS（alex 现有 CF 账号下） | R2 同账号，简化未来加自定义域到 R2 等 |

**CI/CD**：

| 触发 | 动作 |
|---|---|
| **任何 push（任何分支）** | Vercel 自动部署 preview |
| **push to `main`** | Vercel 部署 production |
| **PR / push** | GitHub Actions 跑：`npm ci` → `npm run lint`（next lint）→ `npm run typecheck`（`tsc --noEmit`）→ 未来加测试 |
| **每周日 02:00 UTC（cron）** | GitHub Actions 跑备份脚本（见下） |

**备份策略**（NFR-3 hard requirement → 三重保险）：

1. **Neon 自带 PITR**：免费层 7 天历史 + 6 小时 PITR 窗口（应付误删 / 短时事故）
2. **R2 11-9 durability**：Cloudflare 声明 99.999999999% 持久性（应付硬件失败 / 单点损坏）
3. **周期性跨服务备份（每周）**：GitHub Action cron 触发——
   - 调用 Neon connection 跑 `pg_dump` 导出 metadata
   - 列举 R2 bucket 所有对象生成清单 JSON
   - 把 metadata SQL + 清单 JSON gzip 后 push 到 **独立的 R2 backup bucket**（`mindprint-backups`）+ GitHub Releases（双地点）
   - alex Mac 周期性（如 launchctl agent 每月）拉取最新 backup 包到本地
   - **跨厂商灾难场景**（Vercel 项目误删 / CF 账号锁定 / Neon 服务故障）下仍有兜底

**监控 / 日志**：
- Vercel 内置日志（dev / production）
- Vercel Web Analytics（免费层够 hobby 用，承接 §8.1 SM-1 "实际打开回看次数" 计量需求）
- 不引入额外 APM（hobby 单用户不必）

**Scaling Strategy**：
- 单用户 / N 百条 Entry / GB 量级——**hobby 规模下不需要 scaling 策略**
- 若未来 alex 突破 hobby 边界（OQ 触发），retro 时重评

---

## Decision Impact Analysis

**Implementation Sequence（实现顺序，给 epics/stories 阶段参考）：**

1. **Story 0 · 项目初始化 + 原型代码平移**：`create-next-app` 跑 `web/`；从 `prototype/pwa-explore/` 平移 `lib/mock-entries.ts` 的类型 + 纯函数、`components/{EntryCard, FullRender, Timeline, MonthDivider, ArchiveModal, SortToggle}.tsx` 的 UI 契约（剔除 IndexedDB 依赖）；剔除 Service Worker / Serwist
2. **Story 1 · 数据层**：Neon project + Drizzle 配置 + schema (`users` / `sessions` / `verification_tokens` / `entries`) + `drizzle.config.ts` + 首次 migration push
3. **Story 2 · 认证基线**：Auth.js v5 + Drizzle adapter + Resend Email Provider + middleware + `ALLOWED_EMAIL` 校验 + 登录页 UI
4. **Story 3 · 归档链路（FR-1/2/3）**：Server Action `archiveEntry` + R2 上传 + Drizzle insert + revalidatePath
5. **Story 4 · 时间线主屏（FR-4）**：Server Component 列表查询 + 月份分组 + 排序 URL state + 卡片（含缩略预览懒渲染）
6. **Story 5 · 完整渲染（FR-5）**：动态路由 + HTML 代理 Route Handler + 顶部 chrome + 上一/下一导航 + 键盘
7. **Story 6 · 管理动作（FR-7）**：inline title 编辑 Server Action + 下载 Route Handler（presigned URL）+ 删除 Server Action（含 R2 对象删除）
8. **Story 7 · 视觉系统 + DESIGN.md tokens**：Tailwind 4 config 绑定 DESIGN.md tokens；暗色模式 prefers-color-scheme
9. **Story 8 · CI 与备份**：GitHub Actions（lint + typecheck）+ 周期性备份脚本 + R2 backup bucket
10. **Story 9 · 上线准备**：自定义域名 + 环境变量 + 文档（README + Runbook）

**Cross-Component Dependencies（决策之间的依赖关系）：**

- **认证 → 所有其他**：Magic Link 完成前任何 Server Action / Route Handler 调用都被 middleware 拒。**FR-6 是 FR-1 ~ FR-7 全部能力的前置依赖**（PRD §4.4）
- **DB schema → Auth.js + Entry 操作**：Drizzle schema 必须含 Auth.js 4 张标准表 + entries 表；`@auth/drizzle-adapter` 期望特定字段名（先定 schema 再展开 Auth.js）
- **R2 bucket → 归档 / 下载 / HTML 代理**：R2 桶配置 + bucket policy 必须先就位，否则 Story 3/5/6 跑不通
- **沙箱化机制（srcDoc + sandbox=""）→ FR-4 缩略预览 + FR-5 完整渲染**：两个 FR 共享同一沙箱模型；改沙箱要同时影响二者
- **revalidatePath → 所有 Server Action**：变更动作必须显式 revalidate，否则客户端看到陈旧数据（无客户端缓存层兜底）
- **备份脚本 → Neon connection + R2 IAM**：脚本需要 Neon read-only connection string + R2 backup bucket 写权限（与生产 bucket 分离）
