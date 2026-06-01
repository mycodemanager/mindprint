// Auth.js v5 完整配置（Node runtime：route handler + 服务端 auth() / requireAlex）。
//
// ⚠️ server-only：本文件 import db / adapter / resend / env，禁止被任何 'use client' 组件 import
//    （Story 1.3 AC13 / Task 10 用 grep 验证）。
//
// split-config：与边缘安全基座 lib/auth/auth.config.ts 配对，通过 `...authConfig` 展开共享字段
//    （trustHost / pages）。详见 auth.config.ts 顶部对 Next 16 proxy 的说明。
import 'server-only';
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { render } from '@react-email/render';
import { Resend as ResendClient } from 'resend';
import { db } from '@/lib/db/client';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { authConfig } from './auth.config';
import { MagicLinkEmail } from './magic-link-email';
import { isAllowedEmail } from './allowlist';

// 发件地址。dev：未验证自有域名时用 Resend 的 onboarding@resend.dev，且只能发到 Resend
// 账号注册邮箱（见 .env.example 注释）。生产：Story 1.5 验证自有域名后改为 noreply@<域名>。
const FROM = 'MindPrint <onboarding@resend.dev>';

const resendProvider = Resend({
  apiKey: env.AUTH_RESEND_KEY,
  from: FROM,
  // 自定义发送：用 React Email 模板渲染 + Resend SDK 发送（render() 为异步，必须 await）。
  async sendVerificationRequest({ identifier: email, url }) {
    // 防 Host header 投毒（code-review F4）：trustHost 信任请求 Host 来构造 url。一旦配置了 canonical
    //   AUTH_URL，发信前断言 magic-link 的 origin 与之一致，否则拒发——避免攻击者伪造 Host 让系统把含
    //   恶意域名的登录链接发给 alex。dev 未设 AUTH_URL 时跳过（由 trustHost 处理 localhost）。
    if (env.AUTH_URL && new URL(url).origin !== new URL(env.AUTH_URL).origin) {
      throw new Error('[auth] magic link origin mismatch — refused to send (possible host header poisoning)');
    }
    const html = await render(MagicLinkEmail({ url }));
    const text = await render(MagicLinkEmail({ url }), { plainText: true });
    const { error } = await new ResendClient(env.AUTH_RESEND_KEY).emails.send({
      from: FROM,
      to: email,
      subject: '登录 MindPrint',
      html,
      text,
    });
    // 失败必须 throw，否则会出现「页面显示已发送但实际没收到信」。
    if (error) {
      throw new Error(`[auth] Resend error: ${JSON.stringify(error)}`);
    }
    console.log('[auth] magic link sent to', email);
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 }, // 30 天（PRD A6）
  providers: [resendProvider],
  callbacks: {
    ...authConfig.callbacks,
    // 白名单（NFR-2 单用户）。email-provider 流程中本回调在「发信前」触发一次（见 @auth/core 的
    //   lib/actions/signin/send-token.js）。非白名单返回字符串 '/auth/verify-request'：Auth.js 据此
    //   短路重定向，且不发信、不写 token，并与白名单成功路径同样落到 verify-request——从而消除
    //   「verify vs error」的成员身份 oracle（code-review F1）。
    //   ⚠️ 不要返回 false：false 会抛 AccessDenied → /auth/error，反而泄露「该邮箱不在白名单」。
    //   兜底：signin 的 Server Action 仍在调 signIn 前做前置校验（见 app/auth/signin/page.tsx）。
    async signIn({ user }) {
      if (!isAllowedEmail(user.email)) {
        console.log('[auth] sign-in rejected (not allowlisted)');
        return '/auth/verify-request';
      }
      return true;
    },
  },
});
