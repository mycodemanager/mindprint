# Story 1.3 代码评审包（喂给 Codex / 不同 LLM）

> 用途：本 Story 由 **Claude Opus 4.8** 实现。请用一个**不共享其假设**的模型做对抗式评审。
> 本文件自带上下文 + 重点审查项 + AC 清单 + 完整 diff，可整份喂给 Codex。

## 0. 给评审者的话（先读）

- **项目**：MindPrint —— 单用户（仅 alex）个人归档应用。Next.js **16.2.6**（App Router, Turbopack）+ React 19 + Drizzle(neon-http) + Auth.js v5(beta) + Resend。
- **本 Story 范围**：认证基线 = Auth.js v5 Magic Link + 应用层门卫 + 三个 auth 页面 + typed env 收紧。**不含**：首页/业务路由（后续 Story）、视觉系统（Story 1.4）、测试框架（架构 defer，验收=tsc+lint+人工 e2e）。
- **已验证**：`tsc --noEmit` ✅、`eslint` ✅、server-only 边界 grep ✅、本地 dev 真机 Magic Link 登录 happy path ✅。
- **请聚焦正确性 / 安全 / 我的两处判断**（见 §1）；**不要**纠结视觉样式、测试缺失、首页占位（均为有意的范围外）。
- ⚠️ git 注意：baseline commit 仅含脚手架（Story 1.1/1.2 未提交），故工作树里 `components/`、`lib/entry/`、`lib/db/` 等是**前序 Story** 的，不在本次评审范围。下方 diff 已**精确裁剪**到 Story 1.3 的 12 个文件。

## 1. 两处需要重点挑刺的判断（最可能出错的地方）

### 判断 A：`middleware.ts` → `proxy.ts` + 「乐观 cookie 校验」门卫
故事原文按「middleware 跑 Edge runtime、不能 import DB 驱动」设计 split-config。但 Next.js 16 已把 middleware **弃用并重命名为 `proxy`**，且 proxy **固定 Node.js runtime**。我据此改为 `proxy.ts`，门卫**只检测 session cookie 是否存在**（不查 DB），真正鉴权交 `requireAlex()`（数据层）。
**请审：**
- 只判断 cookie **存在性**（非有效性）做门卫是否可接受？攻击者伪造一个 `authjs.session-token` cookie 即可绕过 proxy 跳转 —— 这是否构成风险？（设计前提：任何渲染敏感数据的路径都必须再过 `requireAlex()`；本 Story 暂无此类数据路径。请确认这个前提是否被打破，或是否有页面在**不经 requireAlex** 的情况下泄露数据。）
- cookie 名 `authjs.session-token` / `__Secure-authjs.session-token` 是否覆盖 Auth.js v5 database-session 的全部情况？是否漏了 `__Host-` 前缀或分块 cookie（`.0`/`.1`）？
- matcher `'/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)'`：是否过度/不足？注意它只排除 `/api/auth`，其他 `/api/*` 会被门卫拦并跳 HTML signin —— 对未来 API 路由是否是坑？

### 判断 B：AC11「不泄露白名单成员身份」的实现
Auth.js 中 `callbacks.signIn` 返回 false 会跳到 **error 页**（白名单→verify-request、非白名单→error，会泄露）。为此我在 signin 的 **Server Action 内前置**白名单校验：非白名单 → 不调 `signIn`（不发信/不写 token）+ 记日志 + 统一 `redirect('/auth/verify-request')`；`callbacks.signIn` 保留作兜底。
**请审：**
- 前置校验对邮箱做了 `.trim().toLowerCase()`，而 `callbacks.signIn` 用 `user.email !== env.ALLOWED_EMAIL`（严格）。两处归一化是否一致？是否存在「前置放行但 callback 拒绝」或反之的边界（导致合法用户被误拒 / 或泄露）？
- 是否还有其他到达 error 页的路径会泄露信息（如过期链接=Verification error 仍显示「不在允许列表内」文案——文案是否会误导/泄露）？
- `redirect()` 抛 `NEXT_REDIRECT` 与 `signIn()` 的 redirect 是否有被意外 catch 吞掉的风险？

## 2. 其他值得看的点
- `lib/auth/config.ts`：Resend `sendVerificationRequest` 的错误处理（`error` 时 throw）、`from: onboarding@resend.dev`（dev）、`render()` 必须 await；DrizzleAdapter 4 表显式键是否与 schema 对齐。
- `session: { strategy: 'database', maxAge: 60*60*24*30 }` + `trustHost: true` 的安全含义（trustHost 信任 Host 头）。
- server-only 边界：`lib/auth/config.ts` / `require-alex.ts` / `lib/env.ts` 是否可能被任何 `'use client'` 组件 import（应不会）。
- `lib/auth/auth.config.ts` 的 `authorized` 回调在当前实现中其实未被 proxy 调用（proxy 不用 NextAuth wrapper）——是否算需要清理的 dead code？
- `lib/env.ts`：AUTH_* 用 `.trim().min(1)` 收紧；是否还有遗漏的空串/校验问题。

## 3. AC 可追溯性清单（13 条）
| AC | 要点 | 实现位置 |
|---|---|---|
| AC1 | 装认证依赖、next-auth 锁定 beta | `package.json`（next-auth 精确 `5.0.0-beta.31`） |
| AC2 | `config.ts` 完整配置 | `lib/auth/config.ts` + `lib/auth/auth.config.ts` |
| AC3 | catch-all route handler | `app/api/auth/[...nextauth]/route.ts` |
| AC4 | Magic Link 邮件模板（voice 无 emoji/感叹号） | `lib/auth/magic-link-email.tsx` |
| AC5 | `requireAlex()` 守卫 | `lib/auth/require-alex.ts` |
| AC6 | 门卫重定向（原 middleware） | `proxy.ts`（见判断 A） |
| AC7 | 登录页（无注册/社交/找回） | `app/auth/signin/page.tsx` |
| AC8 | verify-request 页 | `app/auth/verify-request/page.tsx` |
| AC9 | error 页（不回显邮箱） | `app/auth/error/page.tsx` |
| AC10 | 端到端链路 | 真机实测通过（点链接→session→`/`） |
| AC11 | 白名单不泄露 | signin Server Action 前置校验 + callback 兜底（见判断 B） |
| AC12 | `[auth]` 日志格式 | `config.ts` + `signin/page.tsx` |
| AC13 | env 收紧 + 质量门 + server-only 隔离 | `lib/env.ts` + tsc/lint/grep（已过） |

## 4. 评审范围外的参考文件（如需上下文，前序 Story 1.1/1.2，本次未改）
- `web/lib/db/schema.ts` —— Auth.js 4 表定义（审 config.ts 的 adapter 表键映射时参考）
- `web/lib/db/client.ts` —— `db`（neon-http）
- `web/lib/entry/types.ts` —— `ActionErrorCode`（含 `UNAUTHORIZED`，require-alex 抛错与之对齐）

---

## 5. Story 1.3 完整 diff（vs baseline，仅本 Story 路径）

```diff
diff --git a/.env.example b/.env.example
new file mode 100644
index 0000000..7a4b042
--- /dev/null
+++ b/.env.example
@@ -0,0 +1,38 @@
+# ════════════════════════════════════════════════════════════════════
+# MindPrint 环境变量示例
+# 用法：复制本文件为 .env.local 并填入真实值（.env.local 已被 gitignore）。
+# 切勿把真实密钥提交到 git。
+# 收紧时间表见 lib/env.ts —— DATABASE_URL 与 AUTH_*（Story 1.3）现为必需，其余随对应 Story 收紧。
+# ════════════════════════════════════════════════════════════════════
+
+# ── 必需（Story 1.2 数据层）─────────────────────────────────────────
+# Neon Postgres 连接串，务必含 ?sslmode=require（用 dev branch 的连接串）
+DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require"
+
+# ── 认证 Auth.js（Story 1.3：现为必需，留空会 fail-fast）──────────────
+# 会话加密密钥：`openssl rand -base64 33` 生成
+AUTH_SECRET=""
+# Resend API key（Magic Link 发信）。未验证自有域名时 from 用 onboarding@resend.dev，
+# 且只能发到 Resend 账号注册邮箱（见 lib/auth/config.ts 注释）。
+AUTH_RESEND_KEY=""
+# 唯一允许登录的邮箱（NFR-2 单用户白名单，填 alex 的邮箱）
+ALLOWED_EMAIL=""
+
+# ── 部署（Story 1.5 收紧为必需）────────────────────────────────────
+# 站点完整 URL，如 https://mindprint.example.app
+# ⚠️ Auth.js v5 实际读 AUTH_URL（v4 才是 NEXTAUTH_URL）。本阶段用 trustHost 推断 URL，
+#    无需显式设置；Story 1.5 部署时再决定正名 AUTH_URL 或保留 NEXTAUTH_URL。
+NEXTAUTH_URL=""
+
+# ── Cloudflare R2 对象存储（Epic 2 收紧为必需）─────────────────────
+R2_ACCOUNT_ID=""
+R2_ACCESS_KEY_ID=""
+R2_SECRET_ACCESS_KEY=""
+# 生产 bucket 名（建议 mindprint-entries）
+R2_BUCKET_NAME=""
+
+# ── 备份与只读（Story 4.5 收紧为必需）──────────────────────────────
+# 独立备份 bucket，与生产 bucket 分离（建议 mindprint-backups）
+R2_BACKUP_BUCKET_NAME=""
+# Neon 只读连接串（周期备份脚本用）
+DATABASE_URL_READONLY=""
diff --git a/app/api/auth/[...nextauth]/route.ts b/app/api/auth/[...nextauth]/route.ts
new file mode 100644
index 0000000..30b14aa
--- /dev/null
+++ b/app/api/auth/[...nextauth]/route.ts
@@ -0,0 +1,4 @@
+// Auth.js catch-all Route Handler —— 暴露 GET/POST 给 /api/auth/*（signin、callback、verify 等）。
+import { handlers } from '@/lib/auth/config';
+
+export const { GET, POST } = handlers;
diff --git a/app/auth/error/page.tsx b/app/auth/error/page.tsx
new file mode 100644
index 0000000..0bcb0b3
--- /dev/null
+++ b/app/auth/error/page.tsx
@@ -0,0 +1,17 @@
+// auth error 页。
+// ⚠️ 不回显任何邮箱 / 错误参数（AC9：不泄露白名单邮箱地址 / 成员身份）。
+// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构。
+import Link from 'next/link';
+
+export default function AuthErrorPage() {
+  return (
+    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
+      <h1 className="text-xl font-semibold tracking-tight">MindPrint</h1>
+      <p>无法登录。</p>
+      <p>此账号不在允许列表内。</p>
+      <Link href="/auth/signin" className="rounded-md border px-3 py-2 font-medium">
+        返回
+      </Link>
+    </main>
+  );
+}
diff --git a/app/auth/signin/page.tsx b/app/auth/signin/page.tsx
new file mode 100644
index 0000000..aad3d88
--- /dev/null
+++ b/app/auth/signin/page.tsx
@@ -0,0 +1,49 @@
+// 登录页（Server Component）。极简：MindPrint wordmark + 邮箱 + 「发送 Magic Link」。
+// 无注册 / 无社交 / 无找回密码（EXPERIENCE.md：单一登录入口）。
+// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构 + 基础布局，不引入 DESIGN.md tokens。
+import { redirect } from 'next/navigation';
+import { signIn } from '@/lib/auth/config';
+import { env } from '@/lib/env';
+
+export default function SignInPage() {
+  async function sendMagicLink(formData: FormData) {
+    'use server';
+    const email = String(formData.get('email') ?? '')
+      .trim()
+      .toLowerCase();
+
+    // 白名单前置校验（AC11）：非白名单 → 不调 signIn（不发信、不写 token），统一跳 verify-request。
+    // 这样无论邮箱是否在白名单，UI 都走向 verify-request，不泄露成员身份；
+    // 真正的发信前拦截另由 callbacks.signIn 兜底（lib/auth/config.ts）。
+    if (!email || email !== env.ALLOWED_EMAIL) {
+      console.log('[auth] sign-in rejected (not allowlisted)');
+      redirect('/auth/verify-request');
+    }
+
+    // 白名单：发 Magic Link；signIn 成功后由 Auth.js 跳到 verifyRequest 页（pages 配置）。
+    await signIn('resend', { email, redirectTo: '/' });
+  }
+
+  return (
+    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
+      <h1 className="text-xl font-semibold tracking-tight">MindPrint</h1>
+      <form action={sendMagicLink} className="flex w-full max-w-xs flex-col gap-4">
+        <label htmlFor="email" className="sr-only">
+          邮箱
+        </label>
+        <input
+          id="email"
+          name="email"
+          type="email"
+          required
+          autoComplete="email"
+          placeholder="邮箱"
+          className="rounded-md border px-3 py-2"
+        />
+        <button type="submit" className="rounded-md border px-3 py-2 font-medium">
+          发送 Magic Link
+        </button>
+      </form>
+    </main>
+  );
+}
diff --git a/app/auth/verify-request/page.tsx b/app/auth/verify-request/page.tsx
new file mode 100644
index 0000000..4777b27
--- /dev/null
+++ b/app/auth/verify-request/page.tsx
@@ -0,0 +1,12 @@
+// verify-request 页：Magic Link 已发出后的提示页。
+// 白名单与非白名单提交都跳到这里（AC11：不泄露成员身份）。
+// ⚠️ 视觉系统属 Story 1.4；此处仅极简语义结构。
+export default function VerifyRequestPage() {
+  return (
+    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
+      <h1 className="text-xl font-semibold tracking-tight">MindPrint</h1>
+      <p>已发送 Magic Link。</p>
+      <p>请去邮箱点击链接登录。</p>
+    </main>
+  );
+}
diff --git a/lib/auth/auth.config.ts b/lib/auth/auth.config.ts
new file mode 100644
index 0000000..43512c1
--- /dev/null
+++ b/lib/auth/auth.config.ts
@@ -0,0 +1,28 @@
+// Auth.js 共享配置基座（无 adapter / 无 db / 无 resend import）。
+//
+// 设计来源（Story 1.3 split-config）：完整配置 lib/auth/config.ts 通过 `...authConfig`
+// 展开本基座，集中维护 trustHost / pages 等与运行时无关的字段。
+//
+// ⚠️ Next.js 16 说明：故事原文按「middleware 跑 Edge runtime、不能 import adapter」来设计
+//    split-config。但 Next 16 已将 middleware 重命名为 proxy，且 proxy 固定 Node.js runtime
+//    （见 node_modules/next/dist/docs 的 upgrading/version-16）。因此「边缘 bundle 会拉入 DB
+//    驱动而炸」的风险在本项目不再成立。proxy.ts 改为做「乐观 cookie 存在性校验」做门卫
+//    （Next 16 官方 auth 指南推荐：proxy 只读 cookie、不查 DB），真正鉴权由 Node 层的
+//    requireAlex() 兜底。故下方 `authorized` 回调在当前实现中并未被 proxy 调用，仅作为
+//    配置基座的一部分保留（语义：有 session.user 即视为已授权）。
+import type { NextAuthConfig } from 'next-auth';
+
+export const authConfig = {
+  trustHost: true, // 代理 / Vercel 后必需，否则 UntrustedHost；配合不显式设 AUTH_URL
+  pages: {
+    signIn: '/auth/signin',
+    verifyRequest: '/auth/verify-request',
+    error: '/auth/error',
+  },
+  providers: [], // provider 在完整 config.ts 加；基座留空保持轻量
+  callbacks: {
+    authorized({ auth }) {
+      return !!auth?.user;
+    },
+  },
+} satisfies NextAuthConfig;
diff --git a/lib/auth/config.ts b/lib/auth/config.ts
new file mode 100644
index 0000000..bfb4d73
--- /dev/null
+++ b/lib/auth/config.ts
@@ -0,0 +1,69 @@
+// Auth.js v5 完整配置（Node runtime：route handler + 服务端 auth() / requireAlex）。
+//
+// ⚠️ server-only：本文件 import db / adapter / resend / env，禁止被任何 'use client' 组件 import
+//    （Story 1.3 AC13 / Task 10 用 grep 验证）。
+//
+// split-config：与边缘安全基座 lib/auth/auth.config.ts 配对，通过 `...authConfig` 展开共享字段
+//    （trustHost / pages）。详见 auth.config.ts 顶部对 Next 16 proxy 的说明。
+import NextAuth from 'next-auth';
+import Resend from 'next-auth/providers/resend';
+import { DrizzleAdapter } from '@auth/drizzle-adapter';
+import { render } from '@react-email/render';
+import { Resend as ResendClient } from 'resend';
+import { db } from '@/lib/db/client';
+import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
+import { env } from '@/lib/env';
+import { authConfig } from './auth.config';
+import { MagicLinkEmail } from './magic-link-email';
+
+// 发件地址。dev：未验证自有域名时用 Resend 的 onboarding@resend.dev，且只能发到 Resend
+// 账号注册邮箱（见 .env.example 注释）。生产：Story 1.5 验证自有域名后改为 noreply@<域名>。
+const FROM = 'MindPrint <onboarding@resend.dev>';
+
+const resendProvider = Resend({
+  apiKey: env.AUTH_RESEND_KEY,
+  from: FROM,
+  // 自定义发送：用 React Email 模板渲染 + Resend SDK 发送（render() 为异步，必须 await）。
+  async sendVerificationRequest({ identifier: email, url }) {
+    const html = await render(MagicLinkEmail({ url }));
+    const text = await render(MagicLinkEmail({ url }), { plainText: true });
+    const { error } = await new ResendClient(env.AUTH_RESEND_KEY).emails.send({
+      from: FROM,
+      to: email,
+      subject: '登录 MindPrint',
+      html,
+      text,
+    });
+    // 失败必须 throw，否则会出现「页面显示已发送但实际没收到信」。
+    if (error) {
+      throw new Error(`[auth] Resend error: ${JSON.stringify(error)}`);
+    }
+    console.log('[auth] magic link sent to', email);
+  },
+});
+
+export const { handlers, auth, signIn, signOut } = NextAuth({
+  ...authConfig,
+  adapter: DrizzleAdapter(db, {
+    usersTable: users,
+    accountsTable: accounts,
+    sessionsTable: sessions,
+    verificationTokensTable: verificationTokens,
+  }),
+  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 }, // 30 天（PRD A6）
+  providers: [resendProvider],
+  callbacks: {
+    ...authConfig.callbacks,
+    // 白名单（NFR-2 单用户）。email-provider 流程中本回调在「发信前」触发一次：
+    // 返回 false → 在 sendVerificationRequest 之前中止 → 不发邮件（AC11）。
+    // 兜底：signin 的 Server Action 还会在调 signIn 前再判一次白名单并统一跳 verify-request，
+    // 以保证非白名单不泄露成员身份（见 app/auth/signin/page.tsx）。
+    async signIn({ user }) {
+      if (user.email !== env.ALLOWED_EMAIL) {
+        console.log('[auth] sign-in rejected (not allowlisted)');
+        return false;
+      }
+      return true;
+    },
+  },
+});
diff --git a/lib/auth/magic-link-email.tsx b/lib/auth/magic-link-email.tsx
new file mode 100644
index 0000000..270eb1a
--- /dev/null
+++ b/lib/auth/magic-link-email.tsx
@@ -0,0 +1,81 @@
+// Magic Link 邮件模板（React Email）。
+//
+// 纯展示组件，无 DOM / 浏览器 API：由服务端 render()（@react-email/render）渲染为 HTML/纯文本，
+// 经 Resend 发送（见 lib/auth/config.ts 的 sendVerificationRequest）。
+//
+// Voice（EXPERIENCE.md，严格匹配）：陈述、克制、句号收束、无 emoji / 无感叹号。
+// ⚠️ 视觉系统（DESIGN.md tokens / 字体 / 暗色）属 Story 1.4；此处仅用邮件客户端必需的内联样式。
+import {
+  Body,
+  Button,
+  Container,
+  Head,
+  Heading,
+  Html,
+  Preview,
+  Text,
+} from '@react-email/components';
+
+export function MagicLinkEmail({ url }: { url: string }) {
+  return (
+    <Html lang="zh-CN">
+      <Head />
+      <Preview>登录 MindPrint</Preview>
+      <Body style={body}>
+        <Container style={container}>
+          <Heading style={wordmark}>MindPrint</Heading>
+          <Text style={paragraph}>你请求登录 MindPrint。</Text>
+          <Button href={url} style={button}>
+            登录
+          </Button>
+          <Text style={muted}>如未请求可忽略。</Text>
+        </Container>
+      </Body>
+    </Html>
+  );
+}
+
+// 内联样式（邮件客户端不读外部 CSS）—— 中性、克制，非 DESIGN.md tokens。
+const body: React.CSSProperties = {
+  backgroundColor: '#ffffff',
+  fontFamily:
+    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
+  color: '#18181b',
+};
+
+const container: React.CSSProperties = {
+  margin: '0 auto',
+  padding: '40px 24px',
+  maxWidth: '420px',
+};
+
+const wordmark: React.CSSProperties = {
+  fontSize: '20px',
+  fontWeight: 600,
+  letterSpacing: '-0.01em',
+  margin: '0 0 24px',
+};
+
+const paragraph: React.CSSProperties = {
+  fontSize: '15px',
+  lineHeight: '24px',
+  margin: '0 0 24px',
+};
+
+const button: React.CSSProperties = {
+  display: 'inline-block',
+  backgroundColor: '#18181b',
+  color: '#ffffff',
+  fontSize: '15px',
+  fontWeight: 500,
+  padding: '12px 24px',
+  borderRadius: '8px',
+  textDecoration: 'none',
+};
+
+const muted: React.CSSProperties = {
+  fontSize: '13px',
+  lineHeight: '20px',
+  color: '#71717a',
+  margin: '24px 0 0',
+};
diff --git a/lib/auth/require-alex.ts b/lib/auth/require-alex.ts
new file mode 100644
index 0000000..dfc31aa
--- /dev/null
+++ b/lib/auth/require-alex.ts
@@ -0,0 +1,19 @@
+// requireAlex() —— NFR-2「三层隔离」的 API 层网关（server-only）。
+//
+// 用法（Epic 2 起）：每个 Server Action / Route Handler 第一行调用；session 无效或邮箱不在
+// 白名单则抛 'UNAUTHORIZED'，由调用方包成 ActionResult（lib/entry/types.ts 的 ActionErrorCode
+// 已含 'UNAUTHORIZED'）或返回 401 空 body。
+//
+// ⚠️ server-only：import auth()（→ db / env），禁止被任何 'use client' 组件 import。
+// 本 Story 仅建立此守卫，不创建任何业务路由（范围纪律）。
+import type { Session } from 'next-auth';
+import { auth } from '@/lib/auth/config';
+import { env } from '@/lib/env';
+
+export async function requireAlex(): Promise<Session> {
+  const session = await auth();
+  if (!session || session.user?.email !== env.ALLOWED_EMAIL) {
+    throw new Error('UNAUTHORIZED');
+  }
+  return session;
+}
diff --git a/lib/env.ts b/lib/env.ts
new file mode 100644
index 0000000..370dc84
--- /dev/null
+++ b/lib/env.ts
@@ -0,0 +1,58 @@
+// Typed env —— 模块加载即用 Zod 校验 process.env（fail-fast）。
+//
+// ⚠️ server-only：本文件聚合 DB 连接串 / 认证密钥 / R2 凭据，
+//    禁止在任何 'use client' 组件中 import（Story 1.2 Task 8 用 grep 验证）。
+//
+// 必需 / 可选策略（Story 1.2 决策）：变量随对应 Story 收紧为必需 —— 避免尚未配置的变量
+// 提前触发 dev/build fail-fast。每个可选变量旁标注「何时收紧」。
+// Story 1.3 已收紧：AUTH_SECRET / AUTH_RESEND_KEY / ALLOWED_EMAIL（认证基线必需）。
+import { z } from 'zod';
+
+const EnvSchema = z.object({
+  // ── 必需（本 Story 即需；client 实例 + drizzle-kit push 依赖）──
+  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL 不能为空（Neon 连接串，含 ?sslmode=require）'),
+
+  // ── 认证 Auth.js —— Story 1.3 收紧完成（必需）──
+  // 用 .trim().min(1) 同时拒绝空串 / 纯空白（消化 Story 1.2 code-review 的「空串」defer 项）。
+  AUTH_SECRET: z
+    .string()
+    .trim()
+    .min(1, 'AUTH_SECRET 不能为空（会话加密密钥，`openssl rand -base64 33` 生成）'),
+  AUTH_RESEND_KEY: z
+    .string()
+    .trim()
+    .min(1, 'AUTH_RESEND_KEY 不能为空（Resend API key，Magic Link 发信）'),
+  ALLOWED_EMAIL: z
+    .string()
+    .trim()
+    .min(1, 'ALLOWED_EMAIL 不能为空（NFR-2 单用户白名单，填 alex 的邮箱）'),
+
+  // ── 部署 —— Story 1.5 收紧为必需 ──
+  // ⚠️ Auth.js v5 实际读 `AUTH_URL`（v4 才是 `NEXTAUTH_URL`）。本 Story 用 `trustHost: true`
+  //    从请求头推断 URL，故此变量保持 optional；URL 变量命名留到 Story 1.5 部署时决策。
+  NEXTAUTH_URL: z.string().optional(),
+
+  // ── Cloudflare R2 对象存储 —— Epic 2 收紧为必需 ──
+  R2_ACCOUNT_ID: z.string().optional(),
+  R2_ACCESS_KEY_ID: z.string().optional(),
+  R2_SECRET_ACCESS_KEY: z.string().optional(),
+  R2_BUCKET_NAME: z.string().optional(),
+
+  // ── 备份与只读 —— Story 4.5 收紧为必需 ──
+  R2_BACKUP_BUCKET_NAME: z.string().optional(),
+  DATABASE_URL_READONLY: z.string().optional(),
+});
+
+const parsed = EnvSchema.safeParse(process.env);
+
+if (!parsed.success) {
+  // fail-fast：清晰报错并指明出问题的变量名
+  const details = parsed.error.issues
+    .map((issue) => `  · ${issue.path.join('.') || '(root)'}: ${issue.message}`)
+    .join('\n');
+  throw new Error(
+    `❌ 环境变量校验失败（检查 web/.env.local，缺什么参考 web/.env.example）：\n${details}`,
+  );
+}
+
+export const env = parsed.data;
diff --git a/package.json b/package.json
index 5ee96c8..f8c19ef 100644
--- a/package.json
+++ b/package.json
@@ -6,18 +6,29 @@
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
-    "lint": "eslint"
+    "lint": "eslint",
+    "typecheck": "tsc --noEmit"
   },
   "dependencies": {
+    "@auth/drizzle-adapter": "^1.11.2",
+    "@neondatabase/serverless": "^1.1.0",
+    "@react-email/components": "^1.0.12",
+    "@react-email/render": "^2.0.8",
+    "drizzle-orm": "^0.45.2",
     "next": "16.2.6",
+    "next-auth": "5.0.0-beta.31",
     "react": "19.2.4",
-    "react-dom": "19.2.4"
+    "react-dom": "19.2.4",
+    "resend": "^6.12.4",
+    "zod": "^4.4.3"
   },
   "devDependencies": {
     "@tailwindcss/postcss": "^4",
     "@types/node": "^20",
     "@types/react": "^19",
     "@types/react-dom": "^19",
+    "dotenv": "^17.4.2",
+    "drizzle-kit": "^0.31.10",
     "eslint": "^9",
     "eslint-config-next": "16.2.6",
     "tailwindcss": "^4",
diff --git a/proxy.ts b/proxy.ts
new file mode 100644
index 0000000..0ea91d6
--- /dev/null
+++ b/proxy.ts
@@ -0,0 +1,32 @@
+// 应用层门卫（NFR-2 应用层重定向）。
+//
+// ⚠️ 文件名说明：故事原文写 `middleware.ts`。但本项目是 Next.js 16，middleware 已被重命名为
+//    `proxy`（且 proxy 固定 Node.js runtime，不再是 Edge）——见 node_modules/next/dist/docs 的
+//    upgrading/version-16「middleware to proxy」。AGENTS.md 要求遵循 Next 16 文档并采纳弃用提示，
+//    故落地为 proxy.ts。这也使故事「头号护栏」（Edge bundle 不能含 DB 驱动）不再适用。
+//
+// 鉴权策略（Next 16 官方 auth 指南 + 故事「方案 A」）：proxy 在每个请求（含 prefetch）上运行，
+//    因此这里只做「乐观校验」——只看 Auth.js 的 database-session cookie 是否存在，不查 DB。
+//    真正的鉴权（校验 session 有效性 + 白名单）由 Node 层的 requireAlex() / route handler 兜底
+//    （NFR-2 API 层 + 资源层）。门卫语义：无 session cookie 且访问非 /auth 路径 → 跳登录页。
+import { NextResponse } from 'next/server';
+import type { NextRequest } from 'next/server';
+
+// Auth.js v5 session cookie 名：dev(http) = `authjs.session-token`，
+// 生产(https) = `__Secure-authjs.session-token`。
+const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];
+
+export function proxy(req: NextRequest) {
+  const hasSessionCookie = SESSION_COOKIES.some((name) => req.cookies.has(name));
+
+  if (!hasSessionCookie && !req.nextUrl.pathname.startsWith('/auth')) {
+    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
+  }
+
+  return NextResponse.next();
+}
+
+// matcher 排除 /api/auth（认证端点必须可达）、/auth（登录相关页）、Next 静态资源、favicon。
+export const config = {
+  matcher: ['/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)'],
+};
```
