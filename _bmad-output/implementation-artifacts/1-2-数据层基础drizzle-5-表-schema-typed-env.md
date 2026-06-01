---
baseline_commit: 9c9c432ebdab47727716d9be3f1df7be75f9c422
---
# Story 1.2: 数据层基础（Drizzle + 5 表 schema + typed env）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As alex,
I want the Postgres schema with all 5 tables (4 Auth.js + entries) on Neon, with Drizzle configured and typed env validated at startup,
so that authentication (Story 1.3) and Entry persistence (Story 2.2) have a ready foundation.

## Acceptance Criteria

**AC1 — Neon 项目与连接串**（人工步骤，见 Dev Notes「Human-in-the-loop」）
- **Given** Neon account
- **When** alex 创建 project `mindprint`，含 dev / preview / production 三个 branch
- **Then** 获得各 branch 的 `DATABASE_URL`（含 `?sslmode=require`）

**AC2 — drizzle.config.ts**
- **Given** web/ codebase
- **When** 创建 `web/drizzle.config.ts`
- **Then** schema 路径 `./lib/db/schema.ts`、migrations `./drizzle/migrations`、dialect `postgresql`、credentials 来自 `DATABASE_URL`

**AC3 — schema.ts 五张表**
- **Given** drizzle config
- **When** 创建 `web/lib/db/schema.ts`
- **Then** 导出 5 张 Drizzle 表（snake_case 列 → camelCase TS）：
  - `users`（Auth.js 标准：id uuid PK、name nullable、email text unique notnull、emailVerified timestamptz nullable、image nullable）
  - `accounts`（Auth.js：provider + providerAccountId 复合 PK + FK→users）
  - `sessions`（Auth.js：sessionToken PK、userId FK、expires timestamptz）
  - `verification_tokens`（Auth.js：identifier + token 复合 PK、expires timestamptz）
  - `entries`（id uuid PK defaultRandom、user_id FK→users、title text notnull、archived_at timestamptz notnull defaultNow、original_filename notnull、size_bytes integer notnull、r2_object_key text notnull unique、created_at timestamptz notnull defaultNow）
- **And** entries 有索引 `idx_entries_archived_at`（时间线倒序查询）
- **And** **无 `deleted_at` 列**（硬删除，FR-7）
- **And** **无未来 OQ 列**（`content_hash` / `tags` / `source_version`）

**AC4 — client.ts**
- **Given** schema
- **When** 创建 `web/lib/db/client.ts`
- **Then** 通过 `drizzle({ schema })` + `drizzle-orm/neon-http` + `@neondatabase/serverless` 导出 `db`

**AC5 — drizzle-kit push**（依赖 AC1 的真实 DATABASE_URL）
- **Given** drizzle config + schema
- **When** 运行 `npx drizzle-kit push`
- **Then** 5 张表在 Neon dev branch 创建
- **And** `npx drizzle-kit studio` 显示 5 张空表

**AC6 — typed env（lib/env.ts）**
- **Given** env validation
- **When** 创建 `web/lib/env.ts`
- **Then** 导出 Zod 校验的 `env` 对象，覆盖 11 个变量：`DATABASE_URL`、`AUTH_SECRET`、`AUTH_RESEND_KEY`、`ALLOWED_EMAIL`、`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_BACKUP_BUCKET_NAME`、`NEXTAUTH_URL`、`DATABASE_URL_READONLY`
- **And** R2 相关 vars 标 `.optional()`（Epic 2 填）
- **And** 校验在模块加载时运行（fail-fast）
- **And** 缺必需变量 → 清晰报错并指明变量名

**AC7 — .env.example**
- **Given** .env.example
- **When** 提交 `web/.env.example`
- **Then** 列出 11 个变量名 + placeholder + 中文注释
- **And** `.env.local` 被 gitignore

## Tasks / Subtasks

- [x] **Task 0：Neon provisioning [人工 / blocked-on-alex] (AC: 1, 5)**
  - [x] alex 注册/登录 Neon，创建 project `mindprint`（已确认：dev branch 连接串可用，push 成功连上真实 Neon 实例）
  - [x] 建 dev / preview / production 三个 branch — ⚠️ **仅 dev branch 已验证**（push 通过其连接串成功）；preview / production branch 是否已建**无法在本 Story 验证**，由 alex 在 Story 1.5 部署前确认
  - [x] 复制 dev branch 的 `DATABASE_URL`（含 `?sslmode=require`）到 `web/.env.local`（已确认存在，host `ep-noisy-bird-...ap-southeast-1.aws.neon.tech`，含 `sslmode=require`）
  - [x] ⚠️ HALT 条件**未触发**：alex 已提供 dev `DATABASE_URL`，Task 7 push 成功，无需 HALT
- [x] **Task 1：安装数据层依赖 (AC: 2,3,4,6)**
  - [x] `npm install drizzle-orm @neondatabase/serverless zod`（用 `--prefix web` 执行）
  - [x] `npm install -D drizzle-kit`
  - [x] （可选）`drizzle-zod`——**未安装**：本 Story 非必需（业务 schemas 在 Story 2.2 建），避免引入未用依赖
  - [x] 实际版本已记录到 File List；本 Story 无 Next API 改动（纯 Drizzle/Zod 模块），未触及 `web/AGENTS.md` 所指 Next 16 破坏性变更面
- [x] **Task 2：drizzle.config.ts (AC: 2)**
  - [x] `web/drizzle.config.ts`：`defineConfig({ schema: './lib/db/schema.ts', out: './drizzle/migrations', dialect: 'postgresql', dbCredentials: { url: process.env.DATABASE_URL! } })`
  - [x] **所选方式**：在 config 顶部 `import { config } from 'dotenv'` 后 `config({ path: '.env.local' })`（装 `-D dotenv`）。dotenv 默认不覆盖既有 process.env，故 `DATABASE_URL=... npx drizzle-kit push` 仍可覆盖（已在文件注释文档化）
- [x] **Task 3：lib/db/schema.ts 五张表 (AC: 3)**（逐表细节见 Dev Notes「Schema 设计」）
  - [x] 从 `drizzle-orm/pg-core` 引入 `pgTable, uuid, text, timestamp, integer, primaryKey, index`
  - [x] 5 表：snake_case 列名 + camelCase TS 字段；id `uuid().defaultRandom()`；时间戳 `timestamp(..., { withTimezone: true })`
  - [x] entries 加 `idx_entries_archived_at`；已确认**无** `deleted_at` / `content_hash` / `tags` / `source_version`（push 后 information_schema 校验：forbidden cols = none）
  - [x] users/accounts/sessions/verification_tokens 字段对齐 `@auth/drizzle-adapter` v5 标准（JS 字段名 camelCase + OAuth 字段 snake_case；Story 1.3 装 adapter 时可补 `accounts.type` 的 `$type` 收紧）
- [x] **Task 4：lib/db/client.ts (AC: 4)**
  - [x] `import { drizzle } from 'drizzle-orm/neon-http'` + `import { neon } from '@neondatabase/serverless'` + `import * as schema from './schema'` + `import { env } from '@/lib/env'`
  - [x] `export const db = drizzle({ client: neon(env.DATABASE_URL), schema })`（已核对 neon-http@0.45.2 driver.d.ts 的 `{ client }` overload，签名匹配）
- [x] **Task 5：lib/env.ts typed env (AC: 6)**
  - [x] Zod schema 覆盖 11 个变量；仅 `DATABASE_URL` 必需，其余 `.optional()`（策略见 Dev Notes「typed env」，每项标注收紧时机）
  - [x] 模块加载即校验（fail-fast）；**实现注记**：用 `EnvSchema.safeParse` + 显式 `throw`（列出出问题的变量名），比裸 `.parse()` 报错更清晰，语义等价
  - [x] **server-only**：grep 确认未被任何真实 `'use client'` 组件 import（Task 8 验证，0 违规）
- [x] **Task 6：.env.example + .gitignore (AC: 7)**
  - [x] `web/.env.example`：11 个变量名 + placeholder + 中文注释（含每项收紧时机）
  - [x] `.gitignore` 的 `.env*` 会一并忽略 `.env.example` → 已加 `!.env.example` 例外（`git check-ignore` 确认可提交）
  - [x] 确认 `.env.local` 被忽略（`git check-ignore` 确认 ignored）
- [x] **Task 7：push + 验证 (AC: 5) [依赖 Task 0]**
  - [x] `.env.local` 已有 dev `DATABASE_URL`：`npx drizzle-kit push` → exit 0，「Changes applied」，5 表入 Neon dev branch
  - [x] **studio 等价验证**：`drizzle-kit studio` 是 GUI（开浏览器），改用程序化 SQL 校验 information_schema 确认 **5 张空表**（row counts 全 0）+ 索引 `idx_entries_archived_at` + 复合 PK + unique/FK 约束全部存在。alex 如需可视化可自行 `npx drizzle-kit studio`
  - [x] HALT 分支未触发（DATABASE_URL 真实可用）
- [x] **Task 8：质量门 (AC: 3,4,6)**
  - [x] `npm run typecheck`（`tsc --noEmit`）通过（exit 0，无错误）
  - [x] `npm run lint` 通过（exit 0，无错误/警告）
  - [x] grep 确认 `lib/env.ts` / `lib/db/*` 未被任何**真实** `'use client'` 组件 import（真实 client 组件 = Dropzone/ArchiveModal/SortToggle，0 违规；env.ts/client.ts 中的 "use client" 仅出现在注释里，非指令）

### Review Findings

> Code-review（bmad-code-review · 三层对抗式：Blind Hunter / Edge Case Hunter / Acceptance Auditor · Opus 4.8）· 2026-06-01
> Acceptance Auditor 独立跑 `tsc`（exit 0）+ 核对驱动类型定义，确认 in-diff 全部 AC（AC2/3/4/6/7）+ Dev Notes 约束 PASS，**无 Critical/High/Medium AC 违规**。以下为对抗层提出、经 triage 保留的 patch / defer 项。

**Patch（待处理，未勾选）**

- [x] [Review][Patch] ✅ 已应用（2026-06-01）：`DATABASE_URL` 改为 `z.string().trim().min(1, ...)`，空白串现会触发清晰 fail-fast（已验证 `"   "` 被拒、合法 URL 通过）。 [web/lib/env.ts:13]
- [x] [Review][Patch] ✅ 已应用（2026-06-01）：`drizzle.config.ts` 在 `defineConfig` 前加 `if (!process.env.DATABASE_URL) throw` 守卫，缺连接串时给出明确指引而非含糊报错。 [web/drizzle.config.ts:16]

**Defer（已标记延后，留给后续 Story）**

- [x] [Review][Defer] neon-http 驱动不支持 `db.transaction()`（运行时直接 throw，已核 node_modules 源码）：归档链路（R2→DB 事务回滚）须改用 `db.batch()` 或应用层补偿；属架构锁定 neon-http 的固有约束，非本 Story 缺陷。 [web/lib/db/client.ts:11] — deferred → Story 2.2 / 2.3
- [x] [Review][Defer] `.optional()` 环境变量接受空串 `""`（`.env.example` 即以 `""` 出厂）：「未设置」与「设为空」无法区分；各变量在 1.3/1.5/Epic2/4.5 收紧为必需时，应改 `.min(1)` 或把空串归一化为 `undefined`。 [web/lib/env.ts:16] — deferred → 收紧各变量的对应 Story
- [x] [Review][Defer] env.ts 模块加载即 `throw` 是有意的 fail-fast；但后续接入 Server 路由后，需留意 `next build` 预渲染 / Edge runtime 下 `process.env` 未填充导致整体构建失败的风险。 [web/lib/env.ts:34] — deferred → Story 1.3+（接入路由时）

**Dismissed（4，作为噪声/误报丢弃）**：`archivedAt` notNull+defaultNow（符合 AC3，by-design）；schema `Date` vs 领域 `Entry` `string`（已文档化、延至 queries.ts/Story 2.3）；Zod `path.join` symbol 风险（env key 恒为 string，纯理论）；`./drizzle/migrations` 目录不存在（push-only 流程本就不产出，by-design）。

## Dev Notes

### 与 Story 1.1 的衔接（previous-story learnings —— 必读）
- `web/` 已就位（Next 16.2.6 + React 19 + Tailwind 4 + TS 5 + Turbopack）；`@/*` → `web/` 根；`lib/` 已存在；`package.json` 已有 `typecheck` 脚本。
- **`web/lib/entry/types.ts` 已定义领域 `Entry`**：`{ id, title, archivedAt: string, originalFilename, sizeBytes, r2ObjectKey, createdAt: string }`（archivedAt/createdAt 为 **ISO string**）。
- **关键映射决策（Story 1.1 已立，本 Story 必须遵守）**：Drizzle 的 `timestamptz` 列查询时返回 **`Date`**；而领域 `Entry` 用 **`string`**。因此 **不要**用 `InferSelectModel<typeof entries>` 直接充当 `Entry`；由查询层（`lib/db/queries.ts`，Story 2.3 / 3.1 建）在 DB 边界把 `Date → ISO string` 映射回 `Entry`。**本 Story 只定义表 + client，不建 queries.ts。**
- entries 表列须与领域 `Entry` 字段一一对应：`archived_at↔archivedAt`、`original_filename↔originalFilename`、`size_bytes↔sizeBytes`、`r2_object_key↔r2ObjectKey`、`created_at↔createdAt`。
- 无测试框架（架构 defer）；本 Story 验收 = `tsc` + `lint` + `drizzle-kit push/studio`（人工）。

### Schema 设计（lib/db/schema.ts）—— 逐表
> `@auth/drizzle-adapter` v5 期望特定字段名与结构；按其官方 Drizzle schema 对齐（Story 1.3 安装 adapter 时即可直接挂载）。列名 snake_case，TS 字段 camelCase。

- **users**：`id` uuid PK defaultRandom · `name` text(null) · `email` text notnull **unique** · `emailVerified` timestamptz(null) 列名 `email_verified` · `image` text(null)
- **accounts**：`userId` uuid notnull FK→`users.id`(onDelete cascade，列 `user_id`) · `type` text notnull · `provider` text notnull · `providerAccountId` text notnull(列 `provider_account_id`) · Auth.js OAuth 字段 `refresh_token`/`access_token`/`expires_at`(int)/`token_type`/`scope`/`id_token`/`session_state`(均 text/int，null) · **复合 PK** (provider, providerAccountId)。注：V1 Magic Link 不走 OAuth，但 adapter 期望该表存在——按标准建全字段（见备注问题 2）
- **sessions**：`sessionToken` text PK(列 `session_token`) · `userId` uuid notnull FK→`users.id`(cascade) · `expires` timestamptz notnull
- **verification_tokens**（表名 `verification_tokens`）：`identifier` text notnull · `token` text notnull · `expires` timestamptz notnull · **复合 PK** (identifier, token)
- **entries**：`id` uuid PK defaultRandom · `userId` uuid notnull FK→`users.id`(onDelete cascade，列 `user_id`) · `title` text notnull · `archivedAt` timestamptz notnull defaultNow(列 `archived_at`) · `originalFilename` text notnull(列 `original_filename`) · `sizeBytes` integer notnull(列 `size_bytes`) · `r2ObjectKey` text notnull **unique**(列 `r2_object_key`) · `createdAt` timestamptz notnull defaultNow(列 `created_at`)
  - **index**：`idx_entries_archived_at` on `archivedAt`
  - **禁**：`deleted_at`（硬删除 FR-7）、`content_hash`/`tags`/`source_version`（YAGNI，架构明确不预留）
- 写法逐字参考架构 ✅ DB Schema 示例（`pgTable` + `uuid/text/timestamp/integer`）。

### typed env（lib/env.ts）
- 用 Zod；`const env = EnvSchema.parse(process.env)`；导出 `env`；模块加载即校验（fail-fast）。
- **必需 vs 可选策略**（关键决策，见备注问题 1）：
  - **必需**（本 Story 即需，否则 client/push 跑不动）：`DATABASE_URL`
  - **暂 `.optional()`，随对应 Story 收紧**：`AUTH_SECRET`/`AUTH_RESEND_KEY`/`ALLOWED_EMAIL`/`NEXTAUTH_URL`（Story 1.3/1.5）、`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET_NAME`（Epic 2）、`R2_BACKUP_BUCKET_NAME`/`DATABASE_URL_READONLY`（Story 4.5）
  - 理由：避免 1.2 阶段因尚未配置的变量导致 `dev`/`build` fail-fast 报错；在 env.ts 注释里标注每个变量"何时收紧为必需"。与架构"11 vars + R2 optional + fail-fast"一致。
- **server-only**：env.ts 含 DB/密钥，**禁止**在任何 `'use client'` 组件 import。Task 8 用 grep 验证。

### Human-in-the-loop（blocked-on-alex）
- **AC1 / AC5**（Neon 项目、branch、`DATABASE_URL`、`drizzle-kit push`、studio 验证）需要 alex 的**真实 Neon 凭据**。
- dev（Amelia）能写**全部代码**（config / schema / client / env / .env.example），但**无法**在没有 `DATABASE_URL` 时执行 push / 验证空表。
- **dev-story 执行预期**：完成 Task 1–6 + Task 8 的 tsc/lint 后，若无 `DATABASE_URL`，把 Task 0/7 标 blocked，在 Completion Notes 记录"等 alex 提供 Neon dev DATABASE_URL 后跑 `drizzle-kit push`"，然后**合法 HALT**（缺必要配置）。
- 替代路径：alex 先给一个 Neon dev branch 连接串，dev 即可全程跑通含 push。

### Library / 版本
- 安装最新稳定：`drizzle-orm`、`drizzle-kit`(-D)、`@neondatabase/serverless`、`zod`（+ 可能的 `-D dotenv` 供 drizzle.config 读 env）。**记录实际版本到 File List**。
- 架构锁定：`drizzle-orm/neon-http` 驱动 + `@neondatabase/serverless`（serverless-friendly，无连接池）。
- drizzle-kit：**dev 用 `push`**；上线前（Story 4.5）切 `generate + migrate`。
- 注意 Zod 版本（v3/v4 API 略有差异）——按安装到的版本写；env schema 用基础 `z.string()` 系列，跨版本稳定。

### 文件结构（本 Story 落地）
```
web/
├── drizzle.config.ts        # 新建
├── lib/db/schema.ts         # 新建（5 表 + index）
├── lib/db/client.ts         # 新建（db 实例）
├── lib/env.ts               # 新建（typed env）
├── .env.example             # 新建（11 var + 中文注释）
├── .env.local               # alex 填（gitignored）
└── .gitignore               # 改：加 !.env.example 例外
```
- DB 访问边界：业务代码不直接写 Drizzle 查询，统一经 `lib/db/queries.ts`（Story 2.3 起）；本 Story 仅 schema + client。`lib/db/` 目录新建。

### References
- [Source: epics/epic-1-私人空间foundation-private-access.md#story-12-数据层基础drizzle-5-表-schema-typed-env]
- [Source: architecture/core-architectural-decisions.md#data-architecture] — Neon + Drizzle neon-http + 5 表概览 + schema 演化 YAGNI + push/migrate 策略
- [Source: architecture/implementation-patterns-consistency-rules.md#database-naming] — 表/列/PK/FK/索引命名约定
- [Source: architecture/implementation-patterns-consistency-rules.md#good-example-db-schema] — Drizzle pgTable 写法逐字参考
- [Source: architecture/project-structure-boundaries.md#data-boundaries] — 5 表清单 + entries 列定义 + DB 访问边界
- [Source: architecture/project-structure-boundaries.md#deployment-structure] — 11 env vars 完整清单
- [Source: implementation-artifacts/1-1-项目初始化-原型代码平移.md] — Entry 领域类型 + archivedAt:string 映射决策（previous story）

### 备注问题（给 PM / 评审）
1. **env.ts 必需性策略**：本 Story 仅 `DATABASE_URL` 必需，其余暂 `.optional()`，随 Story 收紧——避免 1.2 阶段 build fail-fast。如要求严格 11 全必需，请指出。
2. **accounts 表**：V1 Magic Link 不走 OAuth，但 `@auth/drizzle-adapter` 期望该表存在——按 adapter 标准建全字段（含 OAuth 列）。若确认所用 adapter 版本允许精简，可裁剪。

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (claude-opus-4-8, 1M context) · dev-story workflow (Amelia)

### Debug Log References

- `npx drizzle-kit push` → exit 0，输出「[✓] Changes applied」，经 `@neondatabase/serverless` driver 连 Neon dev branch。
- 程序化 schema 校验（临时脚本，运行后删除）查询 information_schema / pg_indexes，结果：
  - 5 张表全部存在且 row count 全 0；
  - `entries` 索引：`entries_pkey`、`entries_r2_object_key_unique`、`idx_entries_archived_at`；
  - `entries` 8 列全 snake_case 且 NOT NULL（id/user_id uuid、title/original_filename/r2_object_key text、archived_at/created_at timestamptz、size_bytes integer）；
  - 复合 PK：`accounts(provider+provider_account_id)`、`verification_tokens(identifier+token)`；unique：`users.email`、`entries.r2_object_key`；FK→users：accounts/sessions/entries；
  - forbidden cols（deleted_at/content_hash/tags/source_version）= none。
- `npm run typecheck` exit 0；`npm run lint` exit 0。

### Completion Notes List

- ✅ 全部 8 个 Task（含人工 Task 0/7）完成。alex 预先在 `web/.env.local` 提供了真实 Neon dev `DATABASE_URL`，故 Human-in-the-loop 依赖已满足，无需 HALT，push + 验证全程跑通。
- **依赖版本**：`drizzle-orm@0.45.2`、`@neondatabase/serverless@1.1.0`、`zod@4.4.3`（**Zod v4**，env schema 仅用跨版本稳定的 `z.string()/.min(1)/.optional()`）、`drizzle-kit@0.31.10`（-D）、`dotenv@17.4.2`（-D）。**未装** `drizzle-zod`（本 Story 非必需）。
- **schema 设计**：Auth.js 4 表字段结构对齐 `@auth/drizzle-adapter` v5（JS 字段 camelCase，OAuth 规范字段 refresh_token/access_token/… 保持 snake_case JS 名以匹配 adapter 写入键）；entries 逐字参考架构 ✅ DB Schema 示例，user_id 外键加 `onDelete: 'cascade'`（Dev Notes 要求，较架构示例更具体）。timestamptz 列默认 mode=date 返回 `Date`，与 Story 1.1 既定的「DB 边界 Date→ISO string」映射决策一致（映射放 queries.ts，Story 2.3+ 建，本 Story 不建）。
- **typed env**：仅 `DATABASE_URL` 必需，其余 10 个 `.optional()` 并在 env.ts/​.env.example 标注收紧时机（1.3 / 1.5 / Epic 2 / 4.5），避免 1.2 阶段因未配置变量触发 build fail-fast。用 safeParse + 显式 throw 给出指名变量的清晰错误。
- **drizzle.config 读 env 方式**：`dotenv` 显式 `config({ path: '.env.local' })`；dotenv 不覆盖既有 env，故 CI / `DATABASE_URL=... push` 仍可覆盖。
- **server-only 边界**：env.ts / db/* 未被任何真实 `'use client'` 组件 import（真实 client 组件仅 Dropzone/ArchiveModal/SortToggle）。注意 `lib/env.ts`、`lib/db/client.ts` 注释里出现的 "use client" 字样仅为说明文字、非指令，勿误判。
- **drizzle-kit push 不产出本地迁移文件**（无 `drizzle/` 目录）——符合 dev 用 push 策略；上线前（Story 4.5）再切 `generate + migrate`。
- ⚠️ **遗留给 alex / 后续 Story 的项**：
  1. Neon **preview / production 两个 branch** 是否已建未在本 Story 验证 → Story 1.5 部署前确认；
  2. `web/.env.local` 后续需补齐 AUTH_*/ALLOWED_EMAIL（1.3）、NEXTAUTH_URL（1.5）、R2_*（Epic 2）、备份相关（4.5），并在对应 Story 把 env.ts 中相应变量从 `.optional()` 收紧为必需；
  3. Story 1.3 安装 `@auth/drizzle-adapter` 时把 4 张 Auth 表挂上 adapter，并可为 `accounts.type` 补 `$type<AdapterAccountType>()`。
- **测试说明**：架构已 defer 测试框架（无 Vitest/Playwright），本 Story 验收 = `tsc` + `lint` + `drizzle-kit push` + information_schema 程序化校验，未引入测试依赖（符合「不擅自加依赖」约束）。

### File List

**新建：**
- `web/drizzle.config.ts` — Drizzle Kit 配置（dotenv 读 .env.local + postgresql dialect）
- `web/lib/db/schema.ts` — 5 张表 + `idx_entries_archived_at` 索引
- `web/lib/db/client.ts` — `db` 实例（neon-http + neon serverless）
- `web/lib/env.ts` — Zod typed env（11 变量，fail-fast）
- `web/.env.example` — 11 变量 placeholder + 中文注释

**修改：**
- `web/.gitignore` — 加 `!.env.example` 例外
- `web/package.json` — 新增 drizzle-orm / @neondatabase/serverless / zod（deps）+ drizzle-kit / dotenv（devDeps）
- `web/package-lock.json` — 依赖锁定（npm install 自动更新）

**外部（非本 Story 代码改动，仅记录）：**
- `web/.env.local` — alex 提供的 dev `DATABASE_URL`（gitignored，不提交）
- Neon dev branch — push 后新增 5 张空表

> 注：`web/app/layout.tsx`、`web/components/*`、`web/lib/entry/*` 为 Story 1.1 既有未提交改动，非本 Story 产出。

## Change Log

| 日期 | 变更 | 作者 |
|---|---|---|
| 2026-06-01 | 实现 Story 1.2 数据层：drizzle.config + 5 表 schema + client + typed env + .env.example/.gitignore；安装 drizzle-orm/neon-serverless/zod/drizzle-kit/dotenv；`drizzle-kit push` 建 5 表于 Neon dev branch 并程序化校验；typecheck/lint 通过。状态 → review。 | Amelia (dev) |
| 2026-06-01 | code-review（三层对抗式 + triage）：in-diff 全部 AC PASS、无 Crit/High/Med 违规；应用 2 个硬化 patch（env.ts `DATABASE_URL` trim 校验、drizzle.config `DATABASE_URL` 守卫），typecheck/lint 复跑通过；3 项 defer 登记到 deferred-work.md。状态 → done。 | Amelia (review) |
