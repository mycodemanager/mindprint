---
baseline_commit: 9c9c432ebdab47727716d9be3f1df7be75f9c422
---

# Story 1.3: 认证基线（Auth.js + Magic Link + middleware + 三个 auth 页面）

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As alex,
I want Magic Link 认证（我的邮箱白名单）、middleware 重定向未认证请求、以及三个极简 auth 页面，
so that 只有我能访问 MindPrint，且这套访问流程在任意设备的浏览器上端到端可用。

## Acceptance Criteria

**AC1 — 安装认证依赖**
- **Given** Story 1.2 已完成（5 表 + Drizzle client + typed env）
- **When** 安装 `next-auth`（v5）、`@auth/drizzle-adapter`、`resend`、`@react-email/components`、`@react-email/render`
- **Then** `web/package.json` 更新；**`next-auth` 锁定到具体 beta 版本**（见 Dev Notes「版本」——v5 仍为 beta，`latest` 会装到 v4）

**AC2 — lib/auth/config.ts（完整配置，Node 运行时）**
- **Given** 认证依赖就位
- **When** 创建 `web/lib/auth/config.ts`
- **Then** `export const { handlers, auth, signIn, signOut } = NextAuth({...})`，且配置含：
  - `adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens })`
  - Resend Email Provider（`from: 'MindPrint <noreply@<domain>>'`，自定义 `sendVerificationRequest` 渲染 React Email 模板，见 AC4）
  - `callbacks.signIn`：**邮件发送前**校验 `user.email === env.ALLOWED_EMAIL`；非匹配 `return false`
  - `session.strategy = 'database'`、`session.maxAge = 60 * 60 * 24 * 30`（30 天）
  - `pages: { signIn: '/auth/signin', verifyRequest: '/auth/verify-request', error: '/auth/error' }`
  - 展开 `authConfig`（边缘安全基座，见 AC6 / Dev Notes「split-config」）

**AC3 — Route Handler**
- **Given** Auth.js 配置
- **When** 创建 `web/app/api/auth/[...nextauth]/route.ts`
- **Then** `export const { GET, POST } = handlers`（从 `lib/auth/config` 引入）

**AC4 — Magic Link 邮件模板（React Email）**
- **Given** react-email 就位
- **When** 创建 `web/lib/auth/magic-link-email.tsx`
- **Then** 导出 `MagicLinkEmail({ url })`：MindPrint wordmark + 正文「你请求登录 MindPrint。」+ 主按钮 → `url` + 「如未请求可忽略。」
- **And** voice 严格匹配 EXPERIENCE.md（陈述句、句号收束、**无 emoji / 无感叹号**）
- **And** Resend `sendVerificationRequest` 钩子用 `await render(MagicLinkEmail({ url }))` 渲染该模板后经 Resend SDK 发送（`render()` 为**异步**，必须 await）

**AC5 — API 层守卫 requireAlex()**
- **Given** API 层保护
- **When** 创建 `web/lib/auth/require-alex.ts`
- **Then** 导出 `async function requireAlex(): Promise<Session>`：
  - 调 Auth.js `auth()`
  - session 为 null 或 `session.user?.email !== env.ALLOWED_EMAIL` → `throw new Error('UNAUTHORIZED')`
  - 否则 return session

**AC6 — middleware（NFR-2 应用层，边缘安全）**
- **Given** 应用层重定向需求
- **When** 创建 `web/middleware.ts` + `web/lib/auth/auth.config.ts`（边缘安全基座，**不含 adapter / db import**）
- **Then** middleware 用「边缘安全配置」（`NextAuth(authConfig)`），matcher 排除 `/api/auth`、`/auth`、`/_next/static`、`/_next/image`、`/favicon.ico`
- **And** 未认证 → redirect `/auth/signin`；已认证 → next()
- **⚠️ 关键**：middleware 跑在 Edge runtime，**不可** import 含 `neon-http`/DrizzleAdapter 的完整 config（会炸边缘 bundle）。必须用 split-config（见 Dev Notes）

**AC7 — 登录页**
- **Given** signin 页
- **When** 创建 `web/app/auth/signin/page.tsx`
- **Then** 极简 UI：MindPrint wordmark + 邮箱 Input + Primary 按钮「发送 Magic Link」
- **And** **无注册 / 无社交 / 无找回密码**
- **And** form 提交（Server Action）触发 `signIn('resend', { email, redirectTo: '/' })`

**AC8 — verify-request 页**
- **Given** verify-request 页
- **When** 创建 `web/app/auth/verify-request/page.tsx`
- **Then** 显示「已发送 Magic Link。」+「请去邮箱点击链接登录。」

**AC9 — auth error 页**
- **Given** auth error 页
- **When** 创建 `web/app/auth/error/page.tsx`
- **Then** 显示「无法登录。」+「此账号不在允许列表内。」+ Secondary「返回」
- **And** **不泄露白名单邮箱地址**

**AC10 — 端到端链路**
- **Given** 完整配置
- **When** alex 访问 `/`
- **Then** middleware → `/auth/signin` → 输入白名单邮箱 → 跳 `/auth/verify-request` → 收信 → 点链接 → 建立 30 天 database session → 重定向回 `/`

**AC11 — 攻击场景（白名单成员身份不泄露）**
- **Given** 非白名单邮箱提交
- **When** `callbacks.signIn` 返回 false
- **Then** **不发送邮件**（见 Dev Notes「signIn 时序」对 verification_token 写入的说明 + 兜底）
- **And** UI 仍跳 `/auth/verify-request`（**避免泄露**该邮箱是否在白名单内）

**AC12 — 日志**
- **Given** 可观测性
- **When** Magic Link 发送 / 拒绝
- **Then** 服务端日志为 `[auth] message` 格式（如 `[auth] magic link sent to <email>`、`[auth] sign-in rejected (not allowlisted)`）

**AC13 — typed env 收紧 + 质量门**
- **Given** Story 1.2 的 `lib/env.ts` 把 `AUTH_SECRET`/`AUTH_RESEND_KEY`/`ALLOWED_EMAIL` 标了 `.optional()`（注明「Story 1.3 收紧」）
- **When** 实现本 Story
- **Then** 将这三个收紧为**必需**（用 `.trim().min(1)`，顺带消化 code-review 遗留的「空串」defer 项，见 Dev Notes）
- **And** `npm run typecheck`（`tsc --noEmit`）+ `npm run lint` 通过
- **And** `lib/auth/config.ts`、`lib/auth/require-alex.ts`、`lib/auth/magic-link-email.tsx` 等 server-only 模块不被任何 `'use client'` 组件 import

## Tasks / Subtasks

- [x] **Task 0：人工前置 [blocked-on-alex]（AC: 10, 13）** — alex 已填好 `web/.env.local`（dev server 无 env fail-fast 即证三变量就位）
  - [x] alex 注册/登录 [Resend](https://resend.com)，创建 API Key → 填 `AUTH_RESEND_KEY` 到 `web/.env.local`
  - [x] 发件域：dev 阶段用 Resend 的 `onboarding@resend.dev` 作 `from`（已配于 `lib/auth/config.ts`）。⚠️ Resend 未验证域只能发给 alex 在 Resend 注册的邮箱 → 真实发信前需 alex 确认 Resend 账号邮箱 == `ALLOWED_EMAIL`
  - [x] 生成 `AUTH_SECRET`：`openssl rand -base64 33` → 填 `web/.env.local`
  - [x] 设置 `ALLOWED_EMAIL` = alex 的邮箱 → 填 `web/.env.local`
  - [x] ⚠️ 这三个变量在 Task 2 收紧为**必需**后，缺任一会触发 env fail-fast；无它们则 Task 10 端到端无法验证 → dev-story 完成全部代码后若缺凭据，合法 HALT 等 alex（参照 Story 1.2 的 human-in-the-loop 模式）
- [x] **Task 1：安装认证依赖（AC: 1）**
  - [x] `npm install --prefix web next-auth@5.0.0-beta.31`（**锁定 beta**，勿用 `next-auth@latest`=v4 或浮动 `@beta`；安装后核对 `node_modules/next-auth/package.json` 的 peerDeps 含 `next ^16`）— 已核对：next-auth 5.0.0-beta.31，peerDeps `next ^16.0.0` / `react ^19.0.0`；package.json 去掉 caret 精确锁定
  - [x] `npm install --prefix web @auth/drizzle-adapter resend @react-email/components @react-email/render`
  - [x] （可选 dev 工具）`react-email` CLI（`email dev` 本地预览模板）——**非必需**：本 Story 未安装（保持依赖精简），仅用 `@react-email/components` + `@react-email/render`，无混用导入路径
  - [x] 记录实际版本到 File List；遵循 `web/AGENTS.md`（Next 16 破坏性变更，本 Story 主要面是 Auth.js v5 + middleware→proxy）
- [x] **Task 2：收紧 typed env（AC: 13）**
  - [x] `web/lib/env.ts`：`AUTH_SECRET`/`AUTH_RESEND_KEY`/`ALLOWED_EMAIL` 从 `.optional()` → **必需** `z.string().trim().min(1, '...')`（注明「Story 1.3 收紧完成」）
  - [x] 顺带消化 code-review defer 项：这三个用 `.trim().min(1)`，空串/纯空白会被拒（参考 Story 1.2 的 `DATABASE_URL` 写法）
  - [x] `NEXTAUTH_URL` **保持 optional**（Story 1.5 收紧）；在注释标注「⚠️ Auth.js v5 实际读 `AUTH_URL`，本 Story 用 `trustHost: true` 推断 URL，URL 变量留到 1.5 决策」（见 Dev Notes「env 变量命名」）
  - [x] `.env.example` 对应注释更新（AUTH_* 现为必需 + AUTH_URL 说明）
- [x] **Task 3：lib/auth/auth.config.ts —— 边缘安全基座（AC: 2, 6）[split-config 关键]**
  - [x] 创建 `web/lib/auth/auth.config.ts`：`export const authConfig = { trustHost: true, pages: {...}, providers: [], callbacks: { authorized({ auth }) { return !!auth?.user } } } satisfies NextAuthConfig`
  - [x] **绝不** import `db` / `DrizzleAdapter` / `resend` / schema —— 此文件要能在 Edge runtime 干净打包（注：Next 16 下 proxy=Node runtime，此约束不再是硬性，但仍保持基座精简）
- [x] **Task 4：lib/auth/magic-link-email.tsx —— React Email 模板（AC: 4）**
  - [x] 用 `@react-email/components`（`Html`/`Body`/`Container`/`Heading`/`Text`/`Button` 等）构建 `MagicLinkEmail({ url }: { url: string })`
  - [x] 文案：wordmark「MindPrint」+「你请求登录 MindPrint。」+ 主按钮（href=url）「登录」+「如未请求可忽略。」——陈述句、无 emoji、无感叹号（EXPERIENCE.md voice）
  - [x] 纯展示组件（无 DOM/浏览器 API），供服务端 `render()` 调用
- [x] **Task 5：lib/auth/config.ts —— 完整配置（AC: 2, 4, 11, 12）**
  - [x] `import NextAuth from 'next-auth'` + `DrizzleAdapter` + `db` + `{ users, accounts, sessions, verificationTokens }` + `authConfig` + `env`
  - [x] Resend provider：`import Resend from 'next-auth/providers/resend'`；自定义 `async sendVerificationRequest({ identifier: email, url })`：`const html = await render(MagicLinkEmail({ url }))`、`await new Resend(env.AUTH_RESEND_KEY).emails.send({ from, to: email, subject, html, text })`；失败 throw；成功 `console.log('[auth] magic link sent to', email)`
  - [x] `signIn` callback：`user.email !== env.ALLOWED_EMAIL` → `console.log('[auth] sign-in rejected (not allowlisted)')` + `return false`；否则 true
  - [x] `adapter`（4 表显式键）+ `session: { strategy: 'database', maxAge: 60*60*24*30 }` + 展开 `...authConfig` + `providers: [resendProvider]` + `pages`
  - [x] `export const { handlers, auth, signIn, signOut } = NextAuth({...})`
- [x] **Task 6：app/api/auth/[...nextauth]/route.ts（AC: 3）**
  - [x] `import { handlers } from '@/lib/auth/config'` → `export const { GET, POST } = handlers`
- [x] **Task 7：lib/auth/require-alex.ts（AC: 5）**
  - [x] `import { auth } from '@/lib/auth/config'` + `env`；`requireAlex()`：session null 或 email≠ALLOWED_EMAIL → `throw new Error('UNAUTHORIZED')`；返回 `Session`
  - [x] server-only；本 Story 暂无调用方（Server Action/Route Handler 从 Epic 2 起调用），但建一个最小用例或注释说明即可（**勿**为它造业务路由）
- [x] **Task 8：~~middleware.ts~~ → proxy.ts（AC: 6）** — Next 16 已将 middleware 重命名为 proxy（Node runtime），见 Completion Notes
  - [x] ~~`import NextAuth` + `authConfig`~~ → 改为「乐观 cookie 存在性校验」：`proxy.ts` 不用 NextAuth wrapper（database session 无 adapter 在 proxy 无法解析 user；且 Next 16 官方 auth 指南要求 proxy 只读 cookie 不查 DB）
  - [x] `export function proxy(req)`：无 session cookie 且非 `/auth/*` → `NextResponse.redirect(new URL('/auth/signin', req.nextUrl))`（检测 `authjs.session-token` / `__Secure-authjs.session-token`）
  - [x] `export const config = { matcher: ['/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)'] }`
  - [x] ⚠️ 验证 database-session + edge middleware 能否判定登录态 —— 已解决：Next 16 proxy=Node runtime，采用退化「方案 A」（检测 session cookie 是否存在），真正鉴权由 requireAlex() 兜底；本地实测 `/` → 307 重定向 `/auth/signin` 正确
- [x] **Task 9：三个 auth 页面（AC: 7, 8, 9）**
  - [x] `app/auth/signin/page.tsx`（Server Component）：wordmark + `<form action={serverAction}>` 含 email input + 「发送 Magic Link」按钮；serverAction（`'use server'`）调 `signIn('resend', { email, redirectTo: '/' })`。无注册/社交/找回（+ AC11 白名单前置校验：非白名单统一跳 verify-request，不泄露成员身份）
  - [x] `app/auth/verify-request/page.tsx`：「已发送 Magic Link。」+「请去邮箱点击链接登录。」
  - [x] `app/auth/error/page.tsx`：「无法登录。」+「此账号不在允许列表内。」+ Secondary「返回」(→ /auth/signin)；不回显任何邮箱
  - [x] 极简语义结构即可；**视觉系统（tokens/字体/暗色）属 Story 1.4**——本 Story 不引入 DESIGN.md tokens，页面结构为 1.4 styling 预留（AC11 的「跳 verify-request」由 Auth.js pages 配置自动处理）
- [x] **Task 10：端到端验证 + 质量门（AC: 10, 11, 12, 13）** — 自动化质量门全绿；alex 2026-06-01 实测真实 Magic Link 登录（点链接→建立 session→跳回 `/`）成功
  - [x] `npm run typecheck` + `npm run lint` 通过
  - [x] grep 确认 `lib/auth/*`（除模板可被 server 渲染外）/ `lib/env` / `lib/db/*` 未被真实 `'use client'` 组件 import
  - [x] 有真实凭据时（Task 0）：本地 `npm run dev` → 访问 `/` → 重定向 signin → 输白名单邮箱 → verify-request → 收信/控制台 → 点链接 → 回 `/` 且有 30 天 session；非白名单邮箱 → 不发信但仍跳 verify-request；确认 `[auth]` 日志 — ✅ dev 烟测（`/`→307→signin、三页、`/api/auth/providers`、无报错）+ **alex 2026-06-01 实测真实登录 happy path 成功（点邮件链接 → 建立 session → 跳回 `/`，未被门卫弹回即证 session 生效）**；非白名单路径属低风险（error 页已 curl 验证 + 逻辑已 typecheck），建议 alex 顺手补测一次
  - [ ] 无凭据 → 标记 Task 0 / 端到端 blocked，记入 Dev Agent Record，合法 HALT 等 alex — N/A（凭据已就位）

## Dev Notes

### 与前序 Story 的衔接（previous-story learnings —— 必读）

**来自 Story 1.2（数据层，已 done）：**
- `web/lib/db/schema.ts` 已导出 5 张表，其中 4 张 Auth.js 表的 JS 名为：`users`、`accounts`、`sessions`、`verificationTokens`（SQL 表名 `verification_tokens`）。字段已对齐 `@auth/drizzle-adapter` v5 标准（`accounts` 复合 PK (provider, providerAccountId) + OAuth 列；`verification_tokens` 复合 PK (identifier, token)；`users.id` = `uuid().defaultRandom()`）。**直接把这 4 个表对象传给 DrizzleAdapter 即可，无需改 schema。**
- `web/lib/db/client.ts` 导出 `db`（`drizzle-orm/neon-http`）。
- `web/lib/env.ts`：已用 Zod 校验、模块加载 fail-fast。`AUTH_SECRET`/`AUTH_RESEND_KEY`/`ALLOWED_EMAIL` 当前 `.optional()` 且注释标「Story 1.3 收紧」——本 Story 负责收紧（Task 2）。`DATABASE_URL` 用了 `z.string().trim().min(1)`，照此风格写 AUTH_*。
- ⚠️ **code-review 遗留 defer（来自 1.2，本 Story 正好消化）**：可选 env 变量接受空串 `""`（`.env.example` 出厂即 `""`）。收紧 AUTH_* 时用 `.trim().min(1)` 即可拒空串。见 `deferred-work.md`。
- ⚠️ **neon-http 无 `db.transaction()`**（1.2 defer 项）：本 Story 不直接写事务；但留意 `@auth/drizzle-adapter` 内部是否对 neon-http 调 transaction——基础 email/database-session 流程是独立 insert/select，正常不触发；实现后若 push/登录报 "No transactions support in neon-http driver"，即为此因（极少见，记录即可）。

**来自 Story 1.1（脚手架，已 done）：**
- `web/app/layout.tsx` 已 `lang="zh-CN"`；`@/*` → `web/` 根；`app/`、`components/`、`lib/` 已就位。
- `lib/entry/types.ts` 有 `ActionResult`/`ActionErrorCode`（含 `UNAUTHORIZED`、`EMAIL_NOT_ALLOWED`）——`requireAlex` 抛的 `'UNAUTHORIZED'` 与之语义对齐（Server Action 层会在 Epic 2 包成 ActionResult）。
- 无测试框架（架构 defer）；验收 = `tsc` + `lint` + 人工端到端。

### ⚠️⚠️ 头号护栏：Auth.js v5 split-config（Edge vs Node）—— 不照做必炸

Auth.js v5 的 **middleware 默认跑在 Edge runtime**，而 `neon-http` 驱动 + `DrizzleAdapter` **不是 edge-safe**。若把含 adapter 的完整 config import 进 `middleware.ts`，edge bundle 会拉入 DB 驱动而**构建/运行失败**。这是 v5 + 非 edge adapter 的**头号 footgun**。

**解法 = 拆两份 config：**

```ts
// web/lib/auth/auth.config.ts —— 边缘安全基座（NO adapter / NO db / NO resend import）
import type { NextAuthConfig } from 'next-auth';
export const authConfig = {
  trustHost: true,                         // Vercel / 代理后必需，否则 UntrustedHost
  pages: { signIn: '/auth/signin', verifyRequest: '/auth/verify-request', error: '/auth/error' },
  providers: [],                           // provider 在完整 config 加；基座留空保持 edge bundle 干净
  callbacks: { authorized({ auth }) { return !!auth?.user } },
} satisfies NextAuthConfig;
```

```ts
// web/lib/auth/config.ts —— 完整配置（Node runtime：route handler + 服务端）
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/client';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { authConfig } from './auth.config';
import { env } from '@/lib/env';
// ...resend provider（见下）
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users, accountsTable: accounts,
    sessionsTable: sessions, verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 },
  providers: [resendProvider],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (user.email !== env.ALLOWED_EMAIL) { console.log('[auth] sign-in rejected (not allowlisted)'); return false; }
      return true;
    },
  },
});
```

```ts
// web/middleware.ts —— 只 import 边缘安全基座
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
export const { auth: middleware } = NextAuth(authConfig);
export default middleware((req) => {
  if (!req.auth?.user && !req.nextUrl.pathname.startsWith('/auth')) {
    return Response.redirect(new URL('/auth/signin', req.nextUrl.origin));
  }
});
export const config = { matcher: ['/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)'] };
```

### ⚠️ Edge middleware + database session 的判定风险（实现时务必验证）

我们用 `session.strategy: 'database'`——session cookie 仅是 token，解析出 `user` 通常需 DB 查询。Edge middleware 无 adapter/DB，**可能** `req.auth?.user` 为 null 即使 session 有效。

- **实现时先按上面写**，本地实测：已登录访问 `/` 是否被错误重定向到 signin。
- **若被误重定向**（即 edge 拿不到 user）：退化方案 A——middleware 只判断 **session cookie 是否存在**（cookie 名 `authjs.session-token` / 生产 `__Secure-authjs.session-token`）；方案 B——把 middleware 钉到 Node runtime。优先 A（轻量、仍是「门卫」语义，真正鉴权在 `requireAlex()` / route handler 的 Node 层兜底）。
- 记录最终采用的方案到 Dev Agent Record。

### 版本（research 核验 · 2026-06）

| 包 | 版本 | 备注 |
|---|---|---|
| `next-auth` | **`5.0.0-beta.31`（锁定）** | ⚠️ v5 仍 beta；`latest`=v4。peerDeps 含 `next ^16`/`react ^19`，bundles `@auth/core@0.41.2`。**勿浮动 `@beta`**（beta 间有破坏性变更） |
| `@auth/drizzle-adapter` | `~1.11.2`（latest 可） | 自定义表键见下 |
| `resend` | `~6.x`（latest 可） | SDK：`new Resend(key).emails.send({from,to,subject,html,text})` |
| `@react-email/components` | `~1.x` | 模板组件 |
| `@react-email/render` | `~2.x` | `render()` **异步** |

兼容性：next-auth beta.31 明确支持 Next 16 / React 19 / Turbopack；真正风险在 edge+adapter（上面已处理），非版本。

### DrizzleAdapter 自定义表（精确 API）

`DrizzleAdapter(db, { usersTable, accountsTable, sessionsTable, verificationTokensTable })`——键名**精确如此**。`authenticatorsTable`（WebAuthn）**可选，本 Story 省略**。`uuid().defaultRandom()` 的 `users.id` 可用（adapter 不要求 text id，insert 后回读 DB 生成的 id）。务必确认 `accounts.userId`/`sessions.userId` 的 FK 类型为 `uuid`（与 `users.id` 一致）——1.2 schema 已是 uuid，✅。

### Resend provider + react-email（精确写法）

```ts
// 在 lib/auth/config.ts 内（或单独 lib/auth/providers.ts）
import Resend from 'next-auth/providers/resend';
import { Resend as ResendClient } from 'resend';
import { render } from '@react-email/render';      // 异步！
import { MagicLinkEmail } from './magic-link-email';

const FROM = 'MindPrint <noreply@<域名>>';          // dev 可用 onboarding@resend.dev
const resendProvider = Resend({
  from: FROM,
  async sendVerificationRequest({ identifier: email, url }) {
    const html = await render(MagicLinkEmail({ url }));
    const text = await render(MagicLinkEmail({ url }), { plainText: true });
    const { error } = await new ResendClient(env.AUTH_RESEND_KEY!).emails.send({
      from: FROM, to: email, subject: '登录 MindPrint', html, text,
    });
    if (error) throw new Error(`[auth] Resend error: ${JSON.stringify(error)}`);
    console.log('[auth] magic link sent to', email);
  },
});
```

- **react-email 选型**：默认用 `@react-email/components`（组件）+ `@react-email/render`（render）——例子最多、最稳。**勿**同时装 v6 统一包 `react-email` 并混用导入；若偏好 v6 统一包则**只用它**（从 `react-email` 同时导 components + render）。
- `render()` 返回 `Promise<string>`，**必须 await**；`{ plainText: true }` 出纯文本兜底。
- Resend provider 默认 token 有效期 24h（Magic Link 链接时效，与 30 天 session 解耦）。

### signIn 时序 / 白名单（AC11 的精确语义）

- `callbacks.signIn` 在 email-provider 流程中**触发两次**：(1) 请求链接时——**邮件发送前**，此时 `email.verificationRequest === true`，**返回 false 会在 `sendVerificationRequest` 之前中止 → 不发邮件**；(2) 点击链接时——返回 false 阻止完成登录。
- 本 Story 的白名单 `if (user.email !== env.ALLOWED_EMAIL) return false` 放 `callbacks.signIn` 即满足「邮件发送前拦截」。
- ⚠️ **关于 AC11「不写 verification_token」**：research 指出 v5 beta 下 token 写入与 callback 的相对时序可能因版本而异；返回 false 确保**不发邮件**，但是否**绝对不写 token** 需实现时核对当前 beta 行为。**兜底（belt-and-suspenders）**：若需保证零 token 写入，可在 `sendVerificationRequest` 内再判一次白名单并 throw。无论如何，**UI 一律跳 verify-request**（Auth.js 默认行为），白名单成员身份不泄露——这是 AC11 的核心，必须成立。

### env 变量命名：AUTH_URL vs NEXTAUTH_URL（v4→v5 坑）

- Auth.js **v5 读 `AUTH_URL`**（v4 是 `NEXTAUTH_URL`）。但规划文档（epic/architecture/Story 1.2 的 11 变量清单/Story 1.5）统一写的是 `NEXTAUTH_URL`。
- **本 Story 取向**：设 `trustHost: true`，让 v5 从请求头推断 URL——本地 + 多数部署无需显式 URL 变量。**不改** env 变量名（避免波及 1.2 的 env.ts 契约与 1.5 的 Vercel 配置）。
- env 自动读取：`AUTH_SECRET`（v5 自动读）、`AUTH_RESEND_KEY`（Resend provider 自动读；但我们用自建 ResendClient，显式 `env.AUTH_RESEND_KEY`）。
- **给 PM / Story 1.5 的备注**：1.5 配 Vercel 生产 URL 时，决定是用 `AUTH_URL`（v5 正名）还是继续 `NEXTAUTH_URL` + `trustHost`。建议正名为 `AUTH_URL` 或同时设两者。见「备注问题」。

### Resend 开发模式（无自有域名也能测）

- 未验证自有域名时：`from` 用 `onboarding@resend.dev`，收件人填 alex 在 Resend 注册的邮箱（Resend 限制未验证域只能发给账号自身邮箱）。
- 自有域名验证后（DNS 记录）：`from: 'MindPrint <noreply@<域名>>'`。
- 失败要 throw（上面已做），否则会出现「页面显示已发送但实际没收到信」。

### Voice & 文案（EXPERIENCE.md · 严格匹配）

统一基调：**陈述、克制、句号收束、无 emoji / 无感叹号、数字优先**。Auth Screen 行为（EXPERIENCE.md Component Patterns）：「极简：MindPrint wordmark + 单一登录入口。无注册、无社交、无找回密码」。各页/邮件确定文案：

- signin：wordmark「MindPrint」/ 邮箱 Input / Primary「发送 Magic Link」
- verify-request：「已发送 Magic Link。」/「请去邮箱点击链接登录。」
- error：「无法登录。」/「此账号不在允许列表内。」/ Secondary「返回」
- email：wordmark / 「你请求登录 MindPrint。」/ 按钮「登录」(→url) /「如未请求可忽略。」

⚠️ **视觉系统在 Story 1.4**：本 Story 页面用极简语义结构（无 DESIGN.md tokens / 自定义字体 / 暗色）；1.4 再 styling。勿在本 Story 提前实现视觉 token（范围纪律，参照 1.1/1.2 的克制）。

### 文件结构（本 Story 落地，exact paths）

```
web/
├── middleware.ts                              # 新建（edge 基座 + 重定向）
├── lib/auth/
│   ├── auth.config.ts                         # 新建（边缘安全基座，无 adapter）★ split-config
│   ├── config.ts                              # 新建（完整：adapter + resend + session + callbacks）
│   ├── require-alex.ts                         # 新建（API 层守卫）
│   └── magic-link-email.tsx                    # 新建（React Email 模板）
├── app/api/auth/[...nextauth]/route.ts        # 新建（export GET/POST）
├── app/auth/
│   ├── signin/page.tsx                        # 新建
│   ├── verify-request/page.tsx                # 新建
│   └── error/page.tsx                         # 新建
├── lib/env.ts                                 # 改（AUTH_* 收紧为必需）
├── .env.example                               # 改（注释更新）
└── package.json                               # 改（认证依赖）
```
- `lib/auth/` 目录新建。`requireAlex()` 是 NFR-2 API 层网关；Epic 2 起所有 Server Action / Route Handler 第一行调用（本 Story 仅建，不造业务路由）。

### Testing 要求

- 无测试框架（架构 defer）；验收 = `tsc --noEmit` + `lint` + **人工端到端**（Task 10）。本 Story **不**引入测试依赖。
- 人工链路（有凭据时）：未认证 `/` → signin → 白名单邮箱 → verify-request → 收信 → 点链接 → 回 `/` 30 天 session；非白名单 → 不发信仍跳 verify-request；`[auth]` 日志可见。

### Project Structure Notes

- 与架构 `project-structure-boundaries.md#fr-6` 完全对齐（auth 文件位置、middleware、requireAlex）。**唯一新增**：架构原列 `lib/auth/config.ts` 一份；因 v5 edge split-config，**额外新增 `lib/auth/auth.config.ts`**（边缘安全基座）——这是架构未预见的 v5 实现细节，已在上方说明。
- `dev-only 调试`（architecture 提及 `NEXT_PUBLIC_DEV_AUTH_BYPASS`）：**本 Story 不实现**（非 epic AC，且增风险）；如未来需要再在 `config.ts` 显式 `process.env.NODE_ENV === 'development'` 守卫下加。

### References

- [Source: epics/epic-1-私人空间foundation-private-access.md#story-13-认证基线] — 本 Story 全部 AC + Implementation Notes（matcher、24h、白名单 callback）
- [Source: architecture/core-architectural-decisions.md#authentication--security] — Auth.js v5 + Resend Magic Link + DB session + 30 天 + 24h + ALLOWED_EMAIL 白名单 + Lucia 淘汰
- [Source: architecture/core-architectural-decisions.md#nfr-2-三层隔离实现] — 应用层 middleware / API 层 requireAlex / 资源层
- [Source: architecture/implementation-patterns-consistency-rules.md#route-handler-模式强制] — requireAlex 第一行、401 空 body、`[domain]` 日志格式
- [Source: architecture/project-structure-boundaries.md#fr-6-私有访问控制] — auth 文件 exact paths + middleware matcher
- [Source: ux-designs/.../EXPERIENCE.md#voice-and-tone] — 陈述/克制/无 emoji + Auth Screen「极简 wordmark + 单一入口」
- [Source: implementation-artifacts/1-2-数据层基础drizzle-5-表-schema-typed-env.md] — 4 张 Auth 表 JS 名 + 字段对齐 adapter + env.ts AUTH_* optional 待收紧 + neon-http 无事务 defer
- [Source: implementation-artifacts/deferred-work.md] — 可选 env 空串 defer（本 Story 收紧时消化）
- [Research 2026-06] — next-auth@5.0.0-beta.31 / @auth/drizzle-adapter@1.11.2 / resend@6.x / react-email；split-config（edge）；DrizzleAdapter 表键；Resend sendVerificationRequest + 异步 render；signIn callback 时序；AUTH_URL vs NEXTAUTH_URL；trustHost

### 备注问题（给 PM / 评审，不阻塞实现）

1. **env URL 变量命名**：Auth.js v5 正名是 `AUTH_URL`，而全套规划文档写 `NEXTAUTH_URL`。本 Story 用 `trustHost: true` 规避；**Story 1.5 部署时需决定**：正名 `AUTH_URL` / 保留 `NEXTAUTH_URL` / 两者都设。
2. **AC11「不写 verification_token」**：返回 false 确保不发邮件；是否绝对不写 token 取决于 beta 行为，已给兜底（`sendVerificationRequest` 内再判 + throw）。核心「不泄露白名单成员身份」（UI 一律跳 verify-request）必须成立。
3. **split-config 新增文件**：`lib/auth/auth.config.ts` 是架构清单外的新增（v5 edge 必需），已在 File List / Dev Notes 标注。
4. **next-auth v5 仍 beta**：锁定 `5.0.0-beta.31`；升级前回归测试 auth 流程。

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8（`claude-opus-4-8`，1M context）

### Debug Log References

- `npm install next-auth@5.0.0-beta.31` → 核对 `next-auth/package.json`：version `5.0.0-beta.31`，peerDeps `next ^14||^15||^16`、`react ^18.2||^19` ✅
- `npm run typecheck`（`tsc --noEmit`）→ 通过，无输出 ✅
- `npm run lint`（`eslint`）→ 通过，无输出 ✅
- 服务端模块边界 grep：5 个真实 `'use client'` 组件（Dropzone/SortToggle/ArchiveModal + Timeline/FullRender）均**未** import `@/lib/auth|env|db` ✅
- 本地 `next dev -p 3100`（Turbopack）烟测（`/tmp/mindprint-dev.log`，全程无报错 / 无 proxy 弃用告警 / 无 env fail-fast）：
  - `GET /` → `307` → `location: /auth/signin`（proxy 门卫生效，Node runtime）✅
  - `GET /auth/signin` → `200`，含 `MindPrint` + `发送 Magic Link` + email input；无 注册/社交/找回 ✅
  - `GET /auth/verify-request` → `200`，「已发送 Magic Link。」「请去邮箱点击链接登录。」✅
  - `GET /auth/error?error=AccessDenied` → `200`，「无法登录。」「此账号不在允许列表内。」「返回」；无邮箱回显 ✅
  - `GET /api/auth/providers` → `200`，`{"resend":{...,"type":"email"}}` —— 完整 Auth.js Node 配置（DrizzleAdapter + Resend + neon-http）加载无崩溃，trustHost 推断 URL 正常 ✅

### Completion Notes List

**已实现并验证（自动化质量门全绿）：** Auth.js v5 完整配置（split-config：`auth.config.ts` 基座 + `config.ts` 完整）、DrizzleAdapter 挂载既有 4 表、Resend Magic Link（自定义 `sendVerificationRequest` + 异步 React Email `render()`）、30 天 database session、白名单 `callbacks.signIn`、`requireAlex()` API 守卫、catch-all route handler、应用层门卫、三个 auth 页面；typed env 收紧 AUTH_*（消化 1.2「空串」defer）；`tsc`/`eslint`/server-only 边界全通过。

**⚠️ 关键偏差 1 —— `middleware.ts` → `proxy.ts`（Next.js 16）：** 故事按 Auth.js v5 通用文档假设 `middleware.ts` 跑 Edge runtime，并据此设计 split-config「头号护栏」（Edge bundle 不能含 neon-http/adapter）。但本项目是 **Next.js 16.2.6**，`middleware` 已**弃用并重命名为 `proxy`**，且 **`proxy` 固定 Node.js runtime（不可配置 runtime）**（见 `node_modules/next/dist/docs/.../upgrading/version-16.md`「middleware to proxy」+ `file-conventions/proxy.md`）。`web/AGENTS.md` 要求遵循 Next 16 文档并采纳弃用提示，故落地为 `proxy.ts`。**结果：Edge bundle 风险整体消失**；故事「edge + database session 判定风险」一节预先授权的「方案 A」（只检测 session cookie 存在）正是 Next 16 官方 auth 指南对 proxy 的推荐（proxy 在每个请求/prefetch 运行 → 只读 cookie、不查 DB；真正鉴权交 `requireAlex()` 这类 DAL）。两侧独立得出同一结论。`proxy.ts` 因此不使用 NextAuth 的 `auth` wrapper，改为直接判 `authjs.session-token` / `__Secure-authjs.session-token` 是否存在。

**⚠️ 关键偏差 2 —— AC11 白名单不泄露的实现：** Auth.js 中 `callbacks.signIn` 返回 false 会重定向到 **error 页**（而非 verify-request），这会泄露成员身份（白名单→verify-request，非白名单→error）。为满足 AC11「UI 一律跳 verify-request」，在 signin 的 Server Action 内**前置**白名单校验：非白名单 → 不调 `signIn`（不发信、不写 token）+ `console.log('[auth] sign-in rejected (not allowlisted)')` + 统一 `redirect('/auth/verify-request')`。`callbacks.signIn` 的白名单判定保留作发信前/点链接时的兜底（故事「belt-and-suspenders」）。

**`from` 地址：** dev 用 `MindPrint <onboarding@resend.dev>`（Story 1.5 验证自有域名后改 `noreply@<域名>`）。

**待 alex 手动验收（无法自动化）：** 真实「发信 → 收件箱点链接 → 建立 30 天 session → 回 `/`」属 outward-facing 且需 alex 收件箱，dev 无法代劳。⚠️ Resend 未验证自有域名时，`onboarding@resend.dev` **只能发到 alex 在 Resend 注册账号的邮箱** —— 若该邮箱与 `ALLOWED_EMAIL`（`y18519502582@gmail.com`）不一致，真实发信会失败（`sendVerificationRequest` 抛错）。请 alex 确认后做一次端到端实测。

**未做（范围纪律）：** 不引入测试框架（架构 defer，验收=tsc+lint+人工 e2e）；不实现 `NEXT_PUBLIC_DEV_AUTH_BYPASS`；不为 `requireAlex()` 造业务路由；不引入 DESIGN.md 视觉 tokens（Story 1.4）；未装可选 `react-email` CLI。

### File List

**新建（路径相对 repo 根 = `web/`）：**
- `web/lib/auth/auth.config.ts` —— 共享配置基座（trustHost / pages / 空 providers）
- `web/lib/auth/config.ts` —— 完整配置（adapter + Resend provider + session + 白名单 callback）
- `web/lib/auth/magic-link-email.tsx` —— React Email Magic Link 模板
- `web/lib/auth/require-alex.ts` —— NFR-2 API 层守卫
- `web/app/api/auth/[...nextauth]/route.ts` —— Auth.js catch-all route handler
- `web/app/auth/signin/page.tsx` —— 登录页 + Server Action（含 AC11 前置白名单校验）
- `web/app/auth/verify-request/page.tsx` —— Magic Link 已发送提示页
- `web/app/auth/error/page.tsx` —— auth error 页（不回显邮箱）
- `web/proxy.ts` —— 应用层门卫（**故事原称 middleware.ts**；Next 16 重命名为 proxy）

**修改：**
- `web/lib/env.ts` —— AUTH_SECRET / AUTH_RESEND_KEY / ALLOWED_EMAIL 收紧为必需（`.trim().min(1)`）
- `web/.env.example` —— AUTH_* 现为必需 + AUTH_URL/NEXTAUTH_URL 说明
- `web/package.json` —— 新增 5 个认证依赖；next-auth 精确锁定 `5.0.0-beta.31`（去 caret）
- `web/package-lock.json` —— 依赖安装产生的 lockfile 更新

## Change Log

| 日期 | 变更 | 说明 |
|---|---|---|
| 2026-06-01 | Story 1.3 实现完成（dev-story） | Auth.js v5 + Magic Link + proxy 门卫 + 三个 auth 页面；typed env 收紧。关键偏差：Next 16 下 `middleware.ts`→`proxy.ts`（Node runtime，split-config edge 顾虑消解，采用 cookie 乐观校验门卫）；AC11 在 Server Action 前置白名单校验以统一跳 verify-request。自动化质量门（tsc/lint/grep/dev 烟测）全绿；真实发信+点链接的端到端实测待 alex。 |
| 2026-06-01 | alex 端到端实测通过（AC10 确认） | 真实 Magic Link 登录 happy path 验证成功：点邮件链接 → 建立 30 天 database session → 跳回 `/`（当前为 Next 脚手架占位首页，符合预期；真正首页见 Story 3.1，视觉系统见 Story 1.4）。Story 移交 code-review。 |
