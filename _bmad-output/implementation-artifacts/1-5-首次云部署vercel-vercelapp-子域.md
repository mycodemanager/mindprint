---
baseline_commit: 1040cbfe7982390c18232e21b22bc733ed15387e
---

# Story 1.5: 首次云部署（Vercel + vercel.app 子域）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As alex（唯一用户），
I want 把 MindPrint 部署到 Vercel 的默认 `*.vercel.app` 子域、三套环境变量配齐生产值、并完成首次生产构建上线，
so that 我能在任意设备的浏览器上通过 HTTPS 登录我的私人 MindPrint，不再依赖本地 `next dev`，并实测多设备同时登录（FR-6）。

## Acceptance Criteria

> ⚠️ **本 story 以"部署 + 验证"为主、代码加固为辅。** 大部分动作是 alex 在 Vercel / Neon / Resend / Cloudflare 控制台的**手动 ops**（dev agent 无法代点），dev 的代码产出集中在 env 加固 + `.env.example` + 部署 runbook。详见 Dev Notes「角色分工」。
>
> ⚠️ **AC 已按实装现实重写**：epic 原文 Story 1.2 的 11 变量清单写 `NEXTAUTH_URL`（Auth.js **v4** 名），实装用 `AUTH_URL`（v5）。详见「关键偏差 1」。

**AC1 — Vercel 项目配置**
1. 在 Vercel 创建项目并连接 GitHub repo `mycodemanager/mindprint`：**Root Directory = `web/`**、Framework Preset = Next.js、Build = `npm run build`、Install = `npm install`、Node 20.x（22.x 亦可）。
2. Git 集成：`main` → Production，其他分支 → Preview（架构 §Infrastructure 决策）。

**AC2 — 三套环境变量（Development / Preview / Production）**
3. Production 环境填入**真值**：`DATABASE_URL`（Neon production branch 连接串，含 `?sslmode=require`）、`AUTH_SECRET`（`openssl rand -base64 33` 生成）、`AUTH_RESEND_KEY`、`ALLOWED_EMAIL`（alex 邮箱）、`AUTH_URL`（= 本项目稳定生产 URL `https://<subdomain>.vercel.app`，**本 story 新收紧**）。
4. `R2_*` 四个变量本 story **留空占位**（Epic 2 填）；`R2_BACKUP_BUCKET_NAME` / `DATABASE_URL_READONLY` 留空占位（Story 4.5 填）。
5. ⚠️ `web/lib/env.ts` 在**模块加载即 Zod 校验**（fail-fast），`next build` 会触发它 —— 故所有**必需**变量必须同时存在于 Vercel 的**构建期**环境（Vercel 默认构建期注入同 scope 的 env，满足）。可选变量留空不触发 fail-fast（已用 `.optional()`）。

**AC3 — 生产 Neon 分支 schema 就位**
6. Neon production branch 已含全部 5 张表（`users` / `accounts` / `sessions` / `verification_tokens` / `entries`）。本 story 用 `drizzle-kit push` 推到 production branch（迁移策略从 `push` 切到 `generate + migrate` 留 **Story 4.5**，本 story 不做）。

**AC4 — 生产邮件发送（Resend）可送达**
7. Magic Link 在生产环境能实际送到 alex 邮箱。**V1 路径（零 DNS，本 story 采用）**：`FROM` 保持 `onboarding@resend.dev`，且 `ALLOWED_EMAIL` **必须等于 alex 注册 Resend 账号的邮箱**（`onboarding@resend.dev` 只能发往 Resend 账号自身邮箱）。✅ **alex 已于 2026-06-02 确认：登录邮箱 = Resend 账号注册邮箱 —— 路径 A 直接可用，本 story 无需任何 DNS / 发信域名配置。** 验证自有发信域名 + 改 `noreply@<域名>` 随**自定义域名留到 Story 4.4**。详见「关键偏差 2」。

**AC5 — 部署触发 + 构建通过**
8. `push` 到 `main` → Vercel 自动 Production 构建触发 → `next build`（含 lint/typecheck）**全绿**（Vercel 构建网络可靠，CJK 字体分块下载不受本机 gstatic 抖动影响，见 Story 1.4 deferred-work）→ deployment URL 可访问。

**AC6 — 端到端登录（vercel.app 子域）**
9. alex 在 macOS Chrome 访问 `https://<subdomain>.vercel.app` → `proxy.ts` 重定向 `/auth/signin` → 输入白名单邮箱 → 收 Magic Link → 点击 → 建立 30 天 database session → 重定向回 `/` → 看到 DESIGN.md 调性的 Empty State（Story 1.4 视觉）。

**AC7 — 多设备同时登录（FR-6 硬约束）**
10. alex 在 iPhone Safari 访问同一 URL → 可**同时登录**（database session 天然多行，不顶掉 Mac 端 session）→ 移动端视觉响应式正确 → 暗色跟随手机系统。

**AC8 — 安全加固（消化 Story 1.3 code-review F4）**
11. `AUTH_URL` 在生产为**必需**且等于 canonical 生产 URL；`sendVerificationRequest` 的 origin 校验（`config.ts:33`）据此生效，拒发 origin 不一致的 magic-link（防 Host header 投毒）。
12. `env.ts` 对 `AUTH_URL` 的收紧**不得破坏本地 `next dev` / `next build`**（本地通常不设 AUTH_URL）—— 采"生产必需、非生产可选"的条件式校验（见「关键偏差 1」实现指引）。
13. `trustHost` 决策：设了 `AUTH_URL` pin 住 canonical origin 后，host 投毒已被 origin 校验挡住；是否同时关 `trustHost` 须按 Auth.js v5 + Vercel 实际行为定（读 installed 文档），**不可盲目关闭导致 `UntrustedHost`**。详见「关键偏差 3」。

**AC9 — Vercel 运行时日志干净**
14. Vercel runtime logs 无 unexpected error；Magic Link 流程可见 `[auth]` 前缀日志（`magic link sent to …` 等）。

**AC10 — 质量门 + 范围边界**
15. **不做**（全部留 Story 4.4）：自定义域名、GitHub Actions CI、Vercel Web Analytics。**不做**：R2 真凭据（Epic 2）、迁移 generate+migrate 切换（Story 4.5）、备份脚本（Story 4.5）。
16. ⚠️ `AUTH_SECRET` 一旦设定**不要再变**（变更会令所有已签发 session 失效）。

## Tasks / Subtasks

> 🧩 **图例**：`[dev]` = dev agent 可在代码库内完成；`[ops·alex]` = alex 在外部控制台手动执行（dev 把精确步骤写进 runbook，无法代点）。

- [x] **Task 1 — `env.ts`：`AUTH_URL` 生产加固（[dev]，AC: 11,12,5）**
  - [x] 把 `AUTH_URL` 从无条件 `optional()` 改为**条件式**：生产（`process.env.VERCEL_ENV === 'production'` 或等价判据）下为必需且须是合法 URL；非生产保持 optional（避免本地 dev/build fail-fast）。用 Zod v4 风格 `z.url()`（与既有 `z.email()` 一致，替代已弃用的 `z.string().url()`）。
  - [x] 保留并复核 `config.ts` 的 origin 校验（`if (env.AUTH_URL && new URL(url).origin !== …)`）—— 收紧后生产恒走该分支。**不改 signIn callback / allowlist / requireAlex 任何鉴权逻辑**（1.3 安全红线）。
- [x] **Task 2 — `trustHost` 决策与落地（[dev]，AC: 13）**
  - [x] 读 installed 文档（`web/node_modules/next/dist/docs` 的 auth/部署相关 + Auth.js v5 trustHost/AUTH_URL 约定），确认在"已设 `AUTH_URL`"前提下 Vercel 上 `trustHost` 应保留 `true` 还是可安全关闭；在 `auth.config.ts:16` 落地结论并更新注释说明理由。默认倾向：**保留 `trustHost: true` + 依赖 `AUTH_URL` origin pin**（既避免 `UntrustedHost` 又防投毒），除非文档明确支持关闭。
- [x] **Task 3 — `.env.example` 与发信说明（[dev]，AC: 3,7）**
  - [x] 更新 `web/.env.example` 的 `AUTH_URL` 注释：标注"生产必需 = `https://<subdomain>.vercel.app`"。
  - [x] 在 `.env.example` 或 runbook 写清 Resend V1 发信约束：`onboarding@resend.dev` 只能发往 Resend 账号注册邮箱 → `ALLOWED_EMAIL` 必须 = 该邮箱（否则生产收不到 Magic Link）。
- [x] **Task 4 — 部署 Runbook（[dev]，AC: 1,2,3,6,7）**
  - [x] 产出部署操作手册（建议 `web/DEPLOY.md` 或本 story 内「部署 Runbook」即可）—— 含 Neon production branch、Resend、Vercel 项目 + 三套 env、首次部署、多设备验证的**逐步精确步骤**（见下方 Dev Notes 已起草，dev 校订并落盘）。
- [x] **Task 5 — 构建自检（[dev]，AC: 5,8）**
  - [x] `npm run typecheck && npm run lint` 全绿；`next build` 通过（本机若卡 gstatic 抖动属环境问题，记录即可——Vercel 首次生产构建为权威验证）。
- [x] **Task 6 — Vercel/Neon/Resend 配置与首次部署（[ops·alex]，AC: 1,2,3,4）**
  - [x] 按 runbook：Neon 建/确认 production branch 并 `drizzle-kit push` 5 表；Resend 取 API key 并确认账号邮箱 = `ALLOWED_EMAIL`；Vercel 建项目（Root=`web/`）+ 配三套 env（含 `AUTH_URL` = 生产子域）；`git push origin main` 触发生产构建。
- [x] **Task 7 — 端到端 + 多设备验收（[ops·alex]，AC: 6,7,9）**
  - [x] macOS Chrome 全链路登录；iPhone Safari 同时登录（不顶 Mac）；查 Vercel logs 无异常、有 `[auth]` 日志；确认明/暗与响应式。（AC9 残留：邮件扫描器预取致一次性 token 偶发 `Verification`，已记 deferred-work follow-up；`UnknownAction` 发信后跳转已在本 Story 修复。）
- [x] **Task 8 — 收尾（[dev]，AC: all）**
  - [x] 填写 Dev Agent Record + File List + Change Log；记录最终 deployment URL（`AUTH_URL` 取值）与多设备验收结果。

## Dev Notes

### 角色分工（本 story 的特殊性 —— 必读）

本 story 与 1.1–1.4 不同：**主体是外部控制台 ops**，不是写代码。dev agent 能做的是 `[dev]` 标记的代码/文档任务（Task 1–5, 8）；`[ops·alex]` 任务（Task 6–7）须 alex 在 Vercel / Neon / Resend 控制台手动执行——dev 的职责是把这些步骤写成**精确到可照做**的 runbook。dev-story 执行到 `[ops·alex]` 任务时，应**输出 runbook 并 HALT 交给 alex**，待 alex 回报部署/验收结果后再收尾 Task 8。

### 与前序 Story 的衔接（previous-story learnings —— 必读）

- **`proxy.ts` 不是 `middleware.ts`（Next 16）**：本项目 middleware 已按 Next 16 重命名为 `web/proxy.ts`，固定 Node runtime。它做**乐观 cookie 存在性校验**（看 `authjs.session-token` / 生产的 `__Secure-authjs.session-token` 是否存在），**不是安全边界**（cookie 可伪造，code-review F3）。生产 https 下 session cookie 带 `__Secure-` 前缀——`proxy.ts:19` 已含两种名，无需改。
- **`env.ts` 模块加载 fail-fast**：`next build` 会评估它（Story 1.2/1.3 deferred 已预警构建/Edge 风险）。**Vercel 构建期注入同 scope env**，故必需变量在构建期可用。Task 1 收紧 `AUTH_URL` 时务必用**条件式**，否则本地 `npm run build`（无 AUTH_URL）会炸。
- **Story 1.4：`next build` 构建期从 `fonts.gstatic.com` 下载 CJK 字体分块**，本机网络抖动会偶发失败（已记 deferred-work）。**Vercel 构建网络可靠**，首次生产构建即权威确认 build 绿（AC5）。
- **🔒 安全红线**：1.3 的 auth 逻辑（`signIn` callback 成员身份 oracle、`isAllowedEmail`、`requireAlex`、host 投毒防御）刚过 Codex 评审。本 story 的加固**只动**：`env.ts` 的 `AUTH_URL` 校验收紧、`auth.config.ts` 的 `trustHost`、`.env.example` 注释。**严禁**改 `signIn` callback 逻辑、`allowlist.ts`、`require-alex.ts`、`sendVerificationRequest` 的发信/校验语义（仅在 Task 1 复核 origin 分支，不改其判断）。

### ⚠️ 关键偏差 1 —— `AUTH_URL`（非 `NEXTAUTH_URL`）+ 条件式收紧

epic Story 1.2 的「11 变量」清单写 `NEXTAUTH_URL`——那是 **Auth.js v4** 的名。实装（`env.ts:38`）正确用 **`AUTH_URL`**（v5）。本 story 的"收紧 canonical URL"指 `AUTH_URL`。

**实现指引**（Task 1）：不要无条件 `.min(1)`/required，否则破坏本地 dev/build（本地不设 AUTH_URL，靠 `trustHost` 处理 localhost）。改为**生产必需**，例如：

```ts
// AUTH_URL：生产必需（防 Host 投毒 + 固定 magic-link origin）；非生产可选（本地靠 trustHost）。
AUTH_URL: z.url().optional(),
// …safeParse 后追加：
})
.superRefine((val, ctx) => {
  if (process.env.VERCEL_ENV === 'production' && !val.AUTH_URL) {
    ctx.addIssue({ code: 'custom', path: ['AUTH_URL'], message: 'AUTH_URL 在生产为必需（= https://<subdomain>.vercel.app）' });
  }
});
```

> `z.url()` 是 Zod v4 写法（与 `env.ts` 既有 `z.email()` 一致）；`z.string().url()` 在 Zod 4 已弃用。判据用 `VERCEL_ENV === 'production'`（Vercel 自动注入：`production` / `preview` / `development`）比 `NODE_ENV` 更准（preview 构建 NODE_ENV 也是 production）。dev 以 installed Zod/Auth.js 文档为准微调。

### ⚠️ 关键偏差 2 —— 生产 Magic Link 发送（首次部署最易踩的坑）

`config.ts:23` 的 `FROM = 'MindPrint <onboarding@resend.dev>'`。**Resend 的 `onboarding@resend.dev` 测试发件人只能把邮件发到「你注册 Resend 账号的那个邮箱」。**

- **路径 A（V1 采用，零 DNS）**：保持 `onboarding@resend.dev`，并确保 **`ALLOWED_EMAIL` = alex 注册 Resend 的邮箱**。这样生产 Magic Link 立即可用，无需任何 DNS。**这是 AC4 的验收前提，必须在 runbook 显眼标注。** ✅ **已确认满足（alex 2026-06-02：登录邮箱即 Resend 账号邮箱）——不阻塞。**
- **路径 B（留 Story 4.4）**：在 Resend 验证一个 alex 自有域名（加 DNS TXT/MX/DKIM 记录），把 `FROM` 改 `noreply@<该域名>`，即可发往任意邮箱。注意：**发信域名与 app 运行域名无关**——即便 app 在 `*.vercel.app`，发信域名可以是 alex 的任意域名。因与自定义域名同属"域名配置"，统一留到 **Story 4.4**。

> 若 alex 的登录邮箱恰好不是 Resend 账号邮箱，路径 A 会"页面显示已发送但收不到信"。`sendVerificationRequest` 里 Resend error 会 throw（`config.ts:46`），dev 让 alex 在部署后第一时间测一次登录即可暴露。

### ⚠️ 关键偏差 3 —— `trustHost` 不要盲目关闭

deferred-work F4 原文写"部署时收紧 `AUTH_URL` 为必需 **+ 关闭 `trustHost`**"。但 `auth.config.ts:16` 注释明确：`trustHost: true` 是**Vercel/代理后必需**，否则 Auth.js 抛 `UntrustedHost`。

**正解**：F4 的真实目标是"防 Host header 投毒"。一旦设了 `AUTH_URL`，`config.ts:33` 的 origin 断言就会**在发信前**拒绝 origin 不一致的 magic-link —— 投毒已被挡住，**与 `trustHost` 是否为 true 无关**。因此：

- **默认保留 `trustHost: true`**（避免 `UntrustedHost`），靠 `AUTH_URL` origin pin 防投毒 —— 这是大多数 Auth.js v5 on Vercel 的推荐姿势。
- 仅当 installed 文档明确支持"设 `AUTH_URL` 后可关 `trustHost` 且 Vercel 不报错"时才关闭。dev 在 Task 2 读文档定论并在注释记录依据。

### 部署 Runbook（草案 —— dev 在 Task 4 校订并落盘 `web/DEPLOY.md`）

> 顺序有依赖：Neon → Resend → Vercel 项目（拿到子域）→ 回填 `AUTH_URL` → 部署 → 验收。`AUTH_URL` 有"先有子域才能填"的鸡生蛋：先建项目拿到 `<project>.vercel.app` 稳定子域，再把它填进 Production env 的 `AUTH_URL`，然后 redeploy。

**① Neon（production branch）**
1. Neon 控制台 → `mindprint` 项目 → 确认/创建 `production` branch → 复制其连接串（含 `?sslmode=require`）。
2. 本地用该串临时跑 `cd web && DATABASE_URL='<production串>' npx drizzle-kit push` → 确认 5 表创建（或 `drizzle-kit studio` 看空表）。（迁移 generate+migrate 切换留 4.5。）

**② Resend**
3. Resend 控制台取 API key（`AUTH_RESEND_KEY`）。
4. **确认 Resend 账号注册邮箱 = 计划填入的 `ALLOWED_EMAIL`**（路径 A 前提，偏差 2）。

**③ Vercel 项目**
5. Vercel → New Project → Import `mycodemanager/mindprint` → **Root Directory 选 `web/`** → Framework 自动识别 Next.js → Build `npm run build` / Install `npm install` / Node 20.x。
6. 配置 Environment Variables（先按 Production 填；Preview/Development 可复用或留占位）：
   - `DATABASE_URL` = Neon production 串
   - `AUTH_SECRET` = `openssl rand -base64 33` 的输出（**一旦定不要改**，AC16）
   - `AUTH_RESEND_KEY` = Resend key
   - `ALLOWED_EMAIL` = alex 邮箱（= Resend 账号邮箱）
   - `AUTH_URL` = （首次部署后回填）`https://<project>.vercel.app`
   - `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` = 留空（Epic 2）
   - `R2_BACKUP_BUCKET_NAME` / `DATABASE_URL_READONLY` = 留空（4.5）

**④ 部署**
7. 首次：Vercel 触发构建（或 `git push origin main`）。构建绿后拿到稳定子域 `https://<project>.vercel.app`。
8. 回填 `AUTH_URL` = 该子域 → 在 Vercel 重新 deploy（让 `AUTH_URL` 生效）。

**⑤ 验收（FR-6）**
9. macOS Chrome 访问子域 → 走通 Magic Link 全链路 → 看到 Empty State。
10. iPhone Safari 访问同 URL → 同时登录不顶 Mac → 明/暗 + 响应式正确。
11. Vercel logs 无异常 + 有 `[auth]` 日志。

### Project Structure Notes

- **修改**（`[dev]`）：`web/lib/env.ts`（AUTH_URL 条件式收紧）、`web/lib/auth/auth.config.ts`（trustHost 决策注释）、`web/.env.example`（AUTH_URL/Resend 注释）。可能新建 `web/DEPLOY.md`（runbook）。
- **不改**：`signIn` callback / `allowlist.ts` / `require-alex.ts` / `proxy.ts` / `config.ts` 的发信与校验逻辑（仅 Task 1 复核 origin 分支）。
- **不创建**：`vercel.json`（Root Directory 在 Vercel UI 配置即可，无需文件）；`.github/workflows/*`（CI 属 Story 4.4）；R2 相关代码（Epic 2）。
- **不引入**：Vercel Analytics（Story 4.4）、自定义域名（Story 4.4）、迁移文件 generate+migrate（Story 4.5）。

### Testing 要求

- 架构 defer 测试框架（与 1.1–1.4 一致）；本 story 验收 = `tsc` + `eslint` + **Vercel 生产 `next build` 绿** + **alex 多设备人工实测登录**（FR-6）。
- dev 自检：本地 typecheck/lint 绿；env.ts 收紧后本地 `next dev`/`next build` 仍可跑（未设 AUTH_URL 不 fail）。
- ⚠️ 人工验收点（交 alex，部署后）：① vercel.app 子域 HTTPS 可达；② Magic Link 实际收信并登录成功；③ iPhone + Mac 同时在线不互踢；④ Vercel logs 干净。

### References

- [Source: epics/epic-1-私人空间foundation-private-access.md#story-15] — Story 1.5 原始 user story + 6 段 AC（注意 NEXTAUTH_URL→AUTH_URL 偏差已修正）。
- [Source: architectures/.../architecture/core-architectural-decisions.md#Infrastructure-Deployment] — Vercel 单项目 / main→prod / 三套 env / 自定义域名留后 / CI=Vercel auto-deploy + GitHub Actions（后者属 4.4）。
- [Source: prds/prd-my-bmad-app-2026-05-28/prd.md#FR-6] — 多设备同时登录（brief V1 硬约束）；[#NFR-2] 三层隔离（应用/API/资源）；[#A6] 30 天 session；[#NFR-3] 浏览器覆盖 + 响应感软目标。
- [Source: prds/.../addendum.md#2.2] — 数据所有权 vs 无自有服务器张力（R2 用 alex 自有账号）。
- [Source: web/lib/env.ts] — 当前 env schema（AUTH_URL optional / R2 optional / fail-fast 校验）；[web/lib/auth/config.ts] — FROM=onboarding@resend.dev、sendVerificationRequest origin 校验（F4 防御）；[web/lib/auth/auth.config.ts:16] — trustHost:true；[web/proxy.ts] — Next 16 proxy 乐观 cookie 门卫 + 生产 `__Secure-` cookie。
- [Source: implementation-artifacts/deferred-work.md] — 1.3-F4（AUTH_URL 必需 + trustHost，→ 本 story）、env 空串收紧（已在 env.ts 用 .trim().min(1) 消化）、env.ts 构建 fail-fast 风险。
- [Source: web/node_modules/next/dist/docs] — Next 16 部署 / proxy / 环境变量文档（AGENTS.md 要求：写码前读 installed 文档）；Auth.js v5 `trustHost` / `AUTH_URL` 约定。

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — dev-story workflow

### Debug Log References

- `npm run typecheck`（tsc --noEmit）→ ✅ 0 错误。
- `npm run lint`（eslint）→ ✅ 0 错误。
- `npm run build`（next build）→ 首次命中 Story 1.4 已记录的 `fonts.gstatic.com` CJK 字体分块下载抖动
  （`Module not found: @vercel/turbopack-next/internal/font/google/font`，来自 `app/layout.tsx` 的 `Noto Sans SC`），
  **重试即 `✓ Compiled successfully`**（全 6 路由 + Proxy middleware 正常）。属本机网络环境问题，非代码缺陷；
  Vercel 构建网络可靠，AC5 以 Vercel 首次生产构建为权威验证。
- 验证 `AUTH_URL` 生产收紧对本地无副作用：本地 `.env.local` 未设 `AUTH_URL` 且 `VERCEL_ENV` 未设 →
  `superRefine` 不触发，build 通过 env.ts 校验（AC12 满足）。
- 源码核验 `trustHost` 决策（Task 2）：`@auth/core/lib/utils/env.js:40`（VERCEL 环境 trustHost 自动为 true）+
  `assert.js:56`（falsy trustHost → UntrustedHost）→ 证实「不应关闭 trustHost」（AC13 / 关键偏差 3）。

### Completion Notes List

**已完成（[dev] 代码侧，Tasks 1–5）：**
- ✅ **Task 1（AC11/12/5）**：`web/lib/env.ts` 的 `AUTH_URL` 由 `z.string().url().optional()` 改为 Zod v4
  `z.url().optional()`，并在 schema 末尾加 `.superRefine()`：`VERCEL_ENV === 'production'` 时 `AUTH_URL` 必需且须合法 URL，
  非生产（含本地、preview）保持可选 → 不破坏本地 dev/build。复核未改动 `config.ts` 的 origin 断言与任何鉴权逻辑（1.3 安全红线）。
- ✅ **Task 2（AC13）**：读 installed 源码后，`web/lib/auth/auth.config.ts` **保留 `trustHost: true`**，仅更新注释记录依据
  （关闭只会在 Vercel 触发 `UntrustedHost` 且不增防护；防投毒由 `AUTH_URL` + `config.ts:33` origin 断言达成）。修正了 deferred-work F4 原文「关 trustHost」的误导。
- ✅ **Task 3（AC3/7）**：`web/.env.example` 更新 `AUTH_URL`（生产必需 = `https://<subdomain>.vercel.app`、本地可留空）
  与 Resend V1 发信约束（`ALLOWED_EMAIL` 必须 = Resend 账号注册邮箱）注释。
- ✅ **Task 4（AC1/2/3/6/7）**：落盘 `web/DEPLOY.md` 部署 runbook（Neon→Resend→Vercel→回填 AUTH_URL→验收 的逐步精确步骤 + 常见坑 + 范围边界）。
- ✅ **Task 5（AC5/8）**：typecheck / lint / build 自检全绿（见 Debug Log）。

**已完成（[ops·alex] + dev 收尾，Tasks 6–8，2026-06-02）：**
- ✅ **Task 6（AC1/2/3/4）**：Vercel 项目（Root=`web/`）+ 三套 env 配齐，生产部署上线。**部署期排障（dev 用 Vercel CLI/REST API 处理）**：① 初始 `framework=null`（项目疑似以 root=`.` 导入、未回填）→ Vercel 跑了 `next build` 却没用 Next 适配器、全路由平台 404 → 经 API 设 `framework=nextjs`；② `AUTH_URL` 原为空串 → API 写入真值。生产稳定子域 = **https://mindprint-seven.vercel.app**（短名 `mindprint` 被占，Vercel 分配 `-seven`）。
- ✅ **Task 7（AC6/7/9）**：macOS Chrome 全链路登录成功、刷新仍停 Empty State（30 天 database session 有效，反证生产 Neon 5 表就位）；iPhone Safari 同时登录、Mac 不被顶（**FR-6 ✅**）。日志见 `[auth] magic link sent`。AC9 残留见下。
- ✅ **Task 8**：Dev Agent Record + File List + Change Log 已填；最终 deployment URL = `AUTH_URL` = `https://mindprint-seven.vercel.app`；多设备验收通过。

**部署首测发现（1.3 auth 集成、首次 e2e 才暴露）：**
- ✅ **已修**：发信后跳转打到 `/api/auth/verify-request`（`UnknownAction`，next-auth #11101）→ signin 页改 `signIn(..., {redirect:false})` + 显式 `redirect('/auth/verify-request')`（仅改导航、不动鉴权语义，守 1.3 红线）。
- 📌 **已记 deferred-work（follow-up，建议 4.4）**：邮件扫描器对 magic link 做 GET 预取、消费一次性 token → 偶发 `Verification`（首测回调被命中两次：成功 1 + 12s 后失败 1；alex 真实点击恰为第一次故登录成功）。健壮修法 = magic link 落「点击确认」中间页（仅 POST 消费 token）。
- ⚠️ **次要**：Vercel 项目 Node 版本为 **24.x**（story 建议 20.x/22.x）；Next 16 兼容、不阻塞，可在 Settings 调回。

### File List

- `web/lib/env.ts` —（修改）`AUTH_URL` 改 `z.url().optional()` + `.superRefine()` 生产必需（VERCEL_ENV 判定）。
- `web/lib/auth/auth.config.ts` —（修改）`trustHost: true` 保留 + 决策注释（源码依据）。
- `web/.env.example` —（修改）`AUTH_URL` / Resend 发信约束注释更新。
- `web/app/auth/signin/page.tsx` —（修改）发信后 `redirect:false` + 显式跳 `/auth/verify-request`（修 next-auth #11101 的 `UnknownAction`）。
- `web/DEPLOY.md` —（新建）首次云部署 runbook。
- `_bmad-output/implementation-artifacts/1-5-首次云部署vercel-vercelapp-子域.md` —（修改）frontmatter baseline_commit、Tasks 勾选、Dev Agent Record、File List、Change Log、Status。
- `_bmad-output/implementation-artifacts/deferred-work.md` —（修改）追加「dev/deploy of 1-5」段：1.3-F4 闭环 + 预取 follow-up + #11101 已修记录。
- `_bmad-output/implementation-artifacts/sprint-status.yaml` —（修改）`1-5` 状态 ready-for-dev → in-progress → review。

## Change Log

| 日期 | 变更 | 备注 |
|---|---|---|
| 2026-06-02 | Story 1.5 开发：`AUTH_URL` 生产加固 + `trustHost` 决策 + `.env.example` + `web/DEPLOY.md` runbook | [dev] Tasks 1–5 完成；typecheck/lint/build 绿；Tasks 6–7（ops）已 HALT 交接 alex |
| 2026-06-02 | 部署上线 + 排障 + 收尾：修 `framework=nextjs` 与空 `AUTH_URL`（全路由 404 根因）、修 next-auth #11101 发信后跳转、多设备登录验收通过、记 deferred-work | [ops+dev] Tasks 6–8 完成；生产 `https://mindprint-seven.vercel.app`；Status → review |
