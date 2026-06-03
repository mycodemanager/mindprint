---
baseline_commit: de1d6a62a12597d003b50295a32648defa3379a9
---

# Story 2.1: R2 存储基础（bucket + IAM + S3 SDK helper）

Status: done

<!-- Epic 2 的第一个 story；首次接入对象存储。一半是 alex 的 Cloudflare 控制台基建（dev 无法代点），一半是 dev 的代码（依赖 + env 收紧 + lib/r2 helper + 烟雾测试）。 -->

## Story

As alex,
I want Cloudflare R2 bucket 配置在我自己的 CF 账号下并带正确的 IAM scope，以及一个把所有 R2 操作收口的 helper 模块，
so that 后续 story（2.2 归档 / 2.3 Full Render / Epic 4 下载·删除）能在干净的函数边界后面 upload / fetch / delete Entry 的 HTML 文件。

## Acceptance Criteria

**AC1 — bucket + IAM token（`[ops·alex]`）**
- 在 CF dashboard 创建 R2 bucket `mindprint-entries`，**public access 禁用**。
- 创建 R2 API token，scope 限定到 `mindprint-entries` 这一个 bucket，权限 **Object Read & Write**（含 Delete —— 后续 2.2 回滚 / Epic 4 删除需要）。
- 获得 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` 三个值。

**AC2 — env 填值 + 收紧（`[ops·alex]` 填值 + `[code·dev]` 收紧）**
- 本地 `web/.env.local` 填入 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` + `R2_BUCKET_NAME=mindprint-entries`（替换 Story 1.5 留的空占位）。
- Vercel 环境变量（**至少 Production**）填入同样四个 R2 变量。
- `web/lib/env.ts` 把这四个 R2 变量从 `.optional()` 收紧为**必需**；收紧后 redeploy / `next build` 校验通过。

**AC3 — 安装 S3 SDK（`[code·dev]`）**
- 安装 `@aws-sdk/client-s3`（+ `@aws-sdk/s3-request-presigner`，供 Epic 4 下载用）入 `dependencies`。

**AC4 — R2 client helper（`[code·dev]`）**
- 创建 `web/lib/r2/client.ts`，exports `r2Client`（配置好的 `S3Client`）：
  - `endpoint = https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  - `region = 'auto'`
  - `credentials = { accessKeyId, secretAccessKey }`
  - **`requestChecksumCalculation: 'WHEN_REQUIRED'` + `responseChecksumValidation: 'WHEN_REQUIRED'`**（R2 兼容性必需，见 Dev Notes「R2 校验和坑」）。

**AC5 — R2 upload（`[code·dev]`）**
- 创建 `web/lib/r2/upload.ts`，exports `async function uploadEntryHtml(key: string, body: string | Buffer): Promise<void>`，用 `PutObjectCommand`，`ContentType: 'text/html; charset=utf-8'`。

**AC6 — R2 fetch（`[code·dev]`）**
- 创建 `web/lib/r2/fetch.ts`，exports `async function fetchEntryHtml(key: string): Promise<Response>`，用 `GetObjectCommand`，返回 streaming `Response`，`Content-Type: text/html; charset=utf-8`。

**AC7 — R2 key 约定（`[code·dev]` 文档化）**
- 在代码中（JSDoc / 注释）明确 key 格式 `entries/${userId}/${entryId}.html`（V1 单用户但前缀已 user-scoped）。**本 story 不构造 key**（实际构造在 2.2 的 `archiveEntry`），只把约定写清楚。

**AC8 — 烟雾测试（`[code·dev]` + `[ops·alex]` 验证）**
- 跑临时脚本：`uploadEntryHtml(testKey, '<html>hello</html>')` → `fetchEntryHtml(testKey)`。
- **Then** fetch 出来的 body 字节与上传一致。
- **And** R2 dashboard 看到该测试对象。
- **And** 未授权直接 GET S3 endpoint 上该对象 URL → **401/403**（证明 public access 禁用生效），**不是 200**。
- 验证后清理测试对象（dashboard 手动删，或脚本内 `DeleteObjectCommand`）。

## Tasks / Subtasks

> 标签：`[ops·alex]` = Cloudflare/Vercel 控制台操作，dev 无法代点；`[code·dev]` = 代码实现。
> **顺序关键**：AC1/AC2 的 ops 取值必须在 dev 收紧 `env.ts`（T5）**之前或同时**完成填入 Vercel，否则生产构建 fail-fast（见 Dev Notes「部署 fail-fast 耦合」）。本地开发同理：`.env.local` 没填 R2 值时，收紧后 `next dev` / 任何 import `env.ts` 的路径都会 fail-fast。

- [x] **T1 `[ops·alex]` 建 bucket**（AC1）✅ upload/fetch 实测命中 `mindprint-entries` 成功
  - [x] CF dashboard → R2 → Create bucket `mindprint-entries`。
  - [x] **Public access = disabled**（未授权 GET 实测被拒 → 见 AC8）。
- [x] **T2 `[ops·alex]` 建 API token**（AC1）✅ 凭据实测可用
  - [x] R2 → Manage R2 API Tokens → Create API Token。
  - [x] Permissions **Object Read & Write**；Scope **仅 `mindprint-entries`**。
  - [x] 取得 `Access Key ID` / `Secret Access Key` / `Account ID`。
- [ ] **T3 `[ops·alex]` 填 env**（AC2）—— 本地 ✅ / Vercel 待办
  - [x] `web/.env.local`：4 个 R2 变量已填（烟雾测试通过即证）。
  - [ ] ⛔ Vercel → Environment Variables（≥Production）填同样四个 —— **下次部署前必须**，否则生产 `next build` fail-fast。
- [x] **T4 `[code·dev]` 装依赖**（AC3）
  - [x] `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`（+ `npm i -D tsx` 供烟雾测试）。
  - [x] 确认进 `package.json` `dependencies`（均 `^3.1058.0`）；`s3-request-presigner` 本 story **不 import**（Epic 4 `download.ts` 才用），未据此创建 `download.ts`。
- [x] **T5 `[code·dev]` 收紧 env.ts + .env.example**（AC2 — 代码侧）
  - [x] `web/lib/env.ts`：四个 R2 变量从 `z.string().optional()` 改为 `.trim().min(1, '<中文报错>')`（沿用 AUTH 变量模式；消化 deferred「空串」项）。
  - [x] 更新注释 `Epic 2 收紧为必需` → `Story 2.1 收紧完成（必需）`。`R2_BACKUP_BUCKET_NAME` / `DATABASE_URL_READONLY` 保持 optional。
  - [x] `web/.env.example`：R2 块注释改为 `（Story 2.1：现为必需，留空会 fail-fast）`。
- [x] **T6 `[code·dev]` lib/r2/client.ts**（AC4）
  - [x] `import 'server-only'` 顶部；`import { env } from '@/lib/env'`。
  - [x] export `r2Client`（region `auto` + endpoint + credentials + `requestChecksumCalculation`/`responseChecksumValidation: 'WHEN_REQUIRED'`，附原因注释）。
- [x] **T7 `[code·dev]` lib/r2/upload.ts**（AC5, AC7）
  - [x] `uploadEntryHtml(key, body)` → `PutObjectCommand`（`ContentType: 'text/html; charset=utf-8'`，不传 `ACL`，`[r2]` 日志）。
  - [x] JSDoc 写明 key 约定 `entries/${userId}/${entryId}.html`（AC7）。
- [x] **T8 `[code·dev]` lib/r2/fetch.ts**（AC6）
  - [x] `fetchEntryHtml(key): Promise<Response>` → `GetObjectCommand` + `Body.transformToWebStream()`，`Content-Type: text/html; charset=utf-8`，Body 缺失防御性 404。
- [x] **T9 `[code·dev]` 烟雾测试**（AC8）✅ 通过
  - [x] 写 `web/scripts/r2-smoke.ts`：import 真实 `uploadEntryHtml`/`fetchEntryHtml`，upload→fetch→断言字节一致→清理。
  - [x] 运行通过：`[r2] uploaded` → `✅ round-trip 字节一致` → `🧹 已删除测试对象`（命令见 Dev Notes；需先 `npm i -D server-only`）。
  - [x] 未授权 GET endpoint 实测 **HTTP 400 `InvalidArgument: Authorization`**（非 200 → bucket 私有确认）；fetch 成功即证对象存在；测试对象已清理。
- [x] **T10 `[code·dev]` 绿灯**
  - [x] `npm run typecheck`（tsc --noEmit）+ `npm run lint`（eslint）均通过。

> ✅ **T1/T2 完成、T3 本地完成**（凭据实测可用、烟雾测试通过、bucket 私有已验）。**唯一剩余**：把 4 个 R2 变量填入 **Vercel（≥Production）**—— 在下次 push `main` / 部署前完成，否则生产 `next build` 因缺 R2 变量 fail-fast（与 Story 1.5 `AUTH_URL` 同机制）。

## Dev Notes

### 本 story 的本质与边界
- **范围**：只做对象存储的**基础设施 + helper 收口**。`client.ts` / `upload.ts` / `fetch.ts` 三个文件 + env 收紧 + 依赖 + 烟雾测试。
- **明确不做**（防 scope creep）：
  - ❌ `lib/r2/download.ts`（presigned URL）→ **Epic 4 / Story 4.2**（虽然 `s3-request-presigner` 本 story 已装）。
  - ❌ `deleteEntryHtml` helper → **Story 2.2**（归档回滚时引入）。本 story 烟雾测试若要删测试对象，可在脚本里直接用 `DeleteObjectCommand`，不建可复用 helper。
  - ❌ `archiveEntry` / Dropzone / ArchiveModal / Full Render → 2.2 / 2.3。
  - ❌ 真正构造 entry key、写 DB → 2.2。本 story `upload`/`fetch` 只接收外部传入的 `key` 字符串。

### 架构合规（强制 —— 来自架构文档）
- **文件位置**（[project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)）：`web/lib/r2/{client,upload,fetch}.ts`。一领域一目录。
- **R2 访问边界**（同上 Data Boundaries §）：业务代码**禁止**直接调 `@aws-sdk/client-s3`，一律经 `lib/r2/*`。本 story 正是建立这层收口。
- **平台无关性**：`lib/r2/*` 用 S3 兼容 API，未来切 S3 / B2 只改 endpoint。
- **命名**（[implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)）：函数动词开头 camelCase（`uploadEntryHtml` / `fetchEntryHtml`）；环境变量 SCREAMING_SNAKE；R2 endpoint 用 `R2_ACCOUNT_ID`。
- **日志格式**：服务端 `console.*` 用 `[r2] message` 前缀（grep 友好，不引日志库）。
- **R2 key 约定锁定**：`entries/{user_id}/{entry_id}.html` —— user_id 前缀为未来多用户预留，单 user 下扁平。本 story 只文档化（AC7），不构造。
- **endpoint 路径风格**：默认 virtual-hosted（R2 支持 `<bucket>.<acct>.r2.cloudflarestorage.com`）即可，**不需** `forcePathStyle`。若实测 bucket 名作子域出现解析/证书问题，再加 `forcePathStyle: true` 兜底。

### R2 校验和坑（latest tech，务必照做）
- `@aws-sdk/client-s3` v3.729.0（2025-01）起默认对 `PutObject`/`UploadPart` 加 CRC32 校验和（`requestChecksumCalculation: 'WHEN_SUPPORTED'`）。早期 R2 不支持 → 报 `NotImplemented: Header 'x-amz-checksum-crc32' ... not implemented`，**上传直接失败**。
- Cloudflare 已于 2025-02 服务端修复，但对 S3 兼容（非 AWS）存储，**推荐**显式在 `S3Client` 配置：
  ```ts
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  ```
  —— 恢复旧行为（仅在操作必需时才算校验和），零成本规避 PutObject 加头 + GetObject 响应校验在 R2 上的各种边角失败。**本 story client.ts 必须带这两项**（AC4），并写注释说明原因，避免后人“清理”掉。
- 安装到的版本约为 `@aws-sdk/client-s3@^3.1058`（2026-06 latest）。caret 与仓库现有依赖风格一致。

### fetch 返回 Response（实现细节）
- `GetObjectCommand` 的 `output.Body` 在 Node/Next 运行时是带 sdk stream mixin 的对象，提供 `transformToWebStream()` / `transformToByteArray()` / `transformToString()`。
- 流式（不缓冲整文件）返回：
  ```ts
  const out = await r2Client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  return new Response(out.Body.transformToWebStream(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  ```
- 这正对接 2.3 的 Route Handler（`new Response(r2Response.body, …)`，见架构 Route Handler 模式）。Content-Type 直接硬编码 `text/html; charset=utf-8`（与存储一致），不必回读 `out.ContentType`。
- key 不存在时 SDK 抛 `NoSuchKey` —— 本 story 不处理（让其抛，调用方 2.3 的 route 负责 404）。

### 烟雾测试怎么跑（关键坑：server-only）
- `lib/r2/client.ts → lib/env.ts → import 'server-only'`。`server-only` 包在**没有 `react-server` 解析条件**的普通 Node/tsx 运行下会**抛错**（"cannot be imported from a Client Component"）。Next 的 RSC 层会设该条件，普通脚本不会。
- **主路径**（从 `web/` 跑；需先 `npm i -D tsx server-only`）✅ 2026-06 实测有效：
  ```bash
  cd web
  node --conditions=react-server --env-file=.env.local --import tsx scripts/r2-smoke.ts
  ```
  - ⚠️ **`npm i -D server-only`（关键）**：Next 16/Turbopack **虚拟提供** `server-only`，node_modules 里**无真实包** → 独立 tsx 跑会 `Cannot find module 'server-only'`（不是「不能在 client import」的抛错）。装上真实包（其 `exports` 带 `react-server` 条件→空实现），再配下面的 `--conditions` 即解析到 no-op。
  - `--conditions=react-server`：让 `server-only` 解析到空实现（不抛）。tsx v4.22 实测尊重该条件。
  - `--env-file=.env.local`：Node ≥20.6 原生加载 env（早于任何模块导入，故 `env.ts` 能读到 R2 值）。
  - 注意：import `env.ts` 会**校验全部必需变量**（DATABASE_URL / AUTH_* 等），Story 1.2/1.3/1.5 已配齐故通过。
  - （此模式同样适用 **Story 4.5 的 `scripts/backup.ts`** —— 任何 import server-only 模块的独立脚本都按此跑。）
- **备选路径**（若 conditions/tsx 哪天有摩擦）：临时建 `app/api/_smoke-r2/route.ts`，`npm run dev` 后用已登录浏览器命中 → 在真实 server runtime 跑、无需 flag；验证完删除该 route。
- 未授权 403 验证：`curl -i https://<account-id>.r2.cloudflarestorage.com/mindprint-entries/<testKey>` → 期望 401/403（SigV4 未签名），**非 200**。R2 默认无公开 URL（未开 r2.dev），这一步证明 endpoint 不可匿名读。
- 字节一致：脚本里 `fetchEntryHtml` 后 `await res.text()`（或 `transformToString`），与上传字符串 `===` 断言。

### 部署 fail-fast 耦合（顺序风险，务必注意）
- 收紧 `env.ts`（T5）后，R2 四变量变必需 → 走的是和 `AUTH_URL` 一样的模块级 `throw` fail-fast 机制（[DEPLOY.md:89-91](web/DEPLOY.md)）。
- 后果：**Vercel Production 若未填 R2 值，`next build` 会在构建期失败**。因此 **T3（填 Vercel）必须先于 / 同步于 T5 的合并上线**。本地同理：`.env.local` 没填就收紧，`next dev` 起不来。
- 建议 dev 顺序：先确认 alex 已完成 T1–T3（拿到凭据并填好本地 + Vercel）→ 再做 T4–T10 代码。若 alex 尚未建好 bucket，dev 可先写代码但**不要**合并 env 收紧，或临时本地填值跑通后再协调上线时机。

### 来自 Epic 1 的实现经验（previous story intelligence）
- **env.ts 模式**（[web/lib/env.ts](web/lib/env.ts)）：单一 `EnvSchema` + `safeParse(process.env)` + 失败抛中文聚合错误；必需变量用 `.trim().min(1, '<中文说明>')`（AUTH_SECRET/AUTH_RESEND_KEY 即此模式，**直接照抄**给 R2 变量）。`import 'server-only'` 已在顶部，新 R2 helper 同样加。
- **deferred「空串」项**（[deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)）：`z.string().optional()` 会放行 `""`。本 story 收紧 R2 变量时用 `.trim().min(1)` 正好闭环这条（点名 Epic 2）。
- **neon-http 无事务**：与本 story **无关**（2.1 不碰 DB）；是 2.2 归档回滚要走应用层补偿的约束，先知道即可。
- **db/client.ts / schema.ts**：已存在，`entries.r2ObjectKey` 列 `notNull().unique()` 已就位（[schema.ts:97](web/lib/db/schema.ts)）；本 story 不改 schema、不建 queries.ts。

### git intelligence
- 最近提交均为 Epic 1（1.1–1.5）：scaffold、数据层、认证、视觉、首次部署。建立的约定：每 story 单独提交；env 变量随 story 渐进收紧；ops 步骤写进 runbook（1.5 的 `DEPLOY.md`）。本 story 可在 `DEPLOY.md` 风格下把 R2 ops 步骤留痕（可选）。
- 现有依赖：`next 16.2.6` / `react 19.2.4` / `drizzle-orm ^0.45` / `zod ^4` / `next-auth 5.0.0-beta.31`。无 `@aws-sdk/*`、无 `tsx`（烟雾测试需补 `-D tsx`）。

### Project Structure Notes
- 新增：`web/lib/r2/client.ts`、`web/lib/r2/upload.ts`、`web/lib/r2/fetch.ts`、`web/scripts/r2-smoke.ts`（临时，可删）。
- 修改：`web/lib/env.ts`（收紧 R2 四变量）、`web/.env.example`（注释）、`web/package.json` + `web/package-lock.json`（依赖）、`web/.env.local`（`[ops·alex]` 填值，gitignored）。
- 与架构目录结构一致；`download.ts` 暂不建（Epic 4），不算偏差。

### References
- 架构 · 基础设施/部署（R2 endpoint、bucket 私有、env 列表）：[core-architectural-decisions.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md#infrastructure--deployment)
- 架构 · 文件结构 + 数据/R2 边界 + key 约定：[project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)
- 架构 · 命名/日志/边界强制规则：[implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)
- Epic 2 原文（本 story 来源）：[epic-2-归档第一份-entryfirst-archive.md](_bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/epic-2-归档第一份-entryfirst-archive.md#story-21-r2-存储基础bucket--iam--s3-sdk-helper)
- 延后项（空串收紧点名 Epic 2）：[deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)
- 部署 fail-fast 机制先例：[DEPLOY.md](web/DEPLOY.md)
- R2 + aws-sdk 校验和坑：[Cloudflare Community: v3.729.0 breaks PutObject](https://community.cloudflare.com/t/aws-sdk-client-s3-v3-729-0-breaks-uploadpart-and-putobject-r2-s3-api-compatibility/758637) · [aws-sdk-js-v3 #6810 S3 default integrity change](https://github.com/aws/aws-sdk-js-v3/issues/6810) · [R2 S3 API compatibility docs](https://developers.cloudflare.com/r2/api/s3/api/)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (1M context) · 2026-06-02

### Debug Log References

- `npm run typecheck` → 0 错误（验证 S3Client 的 `requestChecksumCalculation`/`responseChecksumValidation` 配置项 + `Body.transformToWebStream()` 类型在 `@aws-sdk/client-s3@3.1058` 下成立）。
- `npm run lint` → 0 错误。
- 未跑 `next build` / 烟雾测试：env.ts 收紧后 R2 四变量为必需，`.env.local` 仍为空占位 → 会 fail-fast（预期）。等 alex 填真实凭据后再验。

### Completion Notes List

**已完成（代码侧，lint + typecheck 绿）：**
- T4：装 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`（`^3.1058.0`，当前 latest）+ `tsx`（devDep，烟雾测试用）。presigner 本 story 不 import（留 Epic 4 download）。
- T5：`lib/env.ts` 四个 R2 变量收紧为 `.trim().min(1)`（必需），消化 deferred「空串」项；`.env.example` 注释同步。`R2_BACKUP_BUCKET_NAME`/`DATABASE_URL_READONLY` 仍 optional（Story 4.5）。
- T6/T7/T8：`lib/r2/{client,upload,fetch}.ts`。client.ts 带 R2 校验和兼容配置（`WHEN_REQUIRED`，附原因注释，防被「清理」）；upload 不传 ACL、`[r2]` 日志、JSDoc 锁 key 约定；fetch 用 `transformToWebStream()` 流式返回 Response，对接 2.3 route。
- T9（部分）：`scripts/r2-smoke.ts` 已写（含 `--conditions=react-server` + `--env-file` 运行说明，规避 `server-only` 抛错）。
- T10：typecheck + lint 通过。

**ops + 验证（alex 已完成 / 实测通过 2026-06-02）：**
- ✅ T1/T2：alex 建好 bucket `mindprint-entries` + scoped API token；凭据填入 `web/.env.local`。
- ✅ T9 / AC8：烟雾测试实测通过（真实 helper）—— `[r2] uploaded` → `✅ round-trip 字节一致` → 清理；未授权 GET endpoint 回 **HTTP 400 `InvalidArgument: Authorization`**（非 200 → bucket 私有确认）。
- 运行坑（已解决）：Next 16 不提供真实 `server-only` 包 → 独立脚本 `Cannot find module 'server-only'`。解法：`npm i -D server-only` + `--conditions=react-server`。Dev Notes 命令已更正（同模式留给 4.5 backup.ts）。
- ⚠️ 非阻塞警告：AWS SDK v3 提示 2027-01 后需 Node≥22（现 20.20.2）。已记入 `deferred-work.md`。

**唯一剩余（不阻塞 review）：**
- ⛔ T3-Vercel：把 4 个 R2 变量填入 Vercel（≥Production）。**下次 push `main` / 部署前必须**，否则生产 `next build` fail-fast（与 1.5 `AUTH_URL` 同机制）。

**状态**：`review`（AC1/AC2 本地/AC4–AC8 全部满足并实测；AC2-Vercel 为部署前 ops，已显著标注）。

### File List

**新增（`[code·dev]`）：**
- `web/lib/r2/client.ts`
- `web/lib/r2/upload.ts`
- `web/lib/r2/fetch.ts`
- `web/scripts/r2-smoke.ts`（临时烟雾测试，验证后可删）

**修改（`[code·dev]`）：**
- `web/lib/env.ts`（R2 四变量收紧为必需）
- `web/.env.example`（R2 块注释）
- `web/package.json` + `web/package-lock.json`（dep `@aws-sdk/client-s3`、`@aws-sdk/s3-request-presigner`；devDep `tsx`、`server-only`）

**`[ops·alex]` 已改（gitignored，不入 git）：**
- `web/.env.local`（4 个 R2 值已填）

## Senior Developer Review (Codex)

**Reviewer**: Codex CLI v0.130.0（model gpt-5.5，reasoning xhigh）· 2026-06-02 · `codex review`（未提交改动全量，对抗式）
**Outcome**: ✅ 生产 helper（`client.ts` / `upload.ts` / `fetch.ts` / `env.ts`）**未发现问题**（"implementation largely matches the story"）。2 条 **P2** finding，均在烟雾测试脚本，**均已修复并复验**。

### Action Items
- [x] **[P2] 失败时清理测试对象** — `web/scripts/r2-smoke.ts`：upload 成功后若 fetch / 断言抛错，会跳过 `DeleteObjectCommand` → 真实 bucket 留孤儿对象。**已修**：upload 后用 `try/finally` 包裹 fetch+断言+私有性检查，cleanup 必跑。
- [x] **[P2] 私有性检查纳入退出状态** — `web/scripts/r2-smoke.ts`：AC8 要求「未授权 GET 非 200」，原脚本仅**打印** curl 命令、不实际校验、仍 exit 0。**已修**：脚本自做未授权 `fetch(objectUrl)`，`status === 200` 即抛错 fail。

### Re-verification（2026-06-02）
- `npm run typecheck` 通过。
- 重跑烟雾测试：`✅ round-trip 字节一致` → `✅ bucket 私有：未授权 GET → HTTP 400（非 200）` → `🧹 已删除测试对象`。两条 finding 闭环。
- 未发现 High/P1；生产 R2 helper 层保持原样（无需改动）。
