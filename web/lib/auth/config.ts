// Auth.js v5 完整配置（Node runtime：route handler + 服务端 auth() / requireAlex）。
//
// ⚠️ server-only：本文件 import db / adapter / resend / env，禁止被任何 'use client' 组件 import
//    （Story 1.3 AC13 / Task 10 用 grep 验证）。
//
// split-config：与边缘安全基座 lib/auth/auth.config.ts 配对，通过 `...authConfig` 展开共享字段
//    （trustHost / pages）。详见 auth.config.ts 顶部对 Next 16 proxy 的说明。
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

// 发件地址。dev：未验证自有域名时用 Resend 的 onboarding@resend.dev，且只能发到 Resend
// 账号注册邮箱（见 .env.example 注释）。生产：Story 1.5 验证自有域名后改为 noreply@<域名>。
const FROM = 'MindPrint <onboarding@resend.dev>';

const resendProvider = Resend({
  apiKey: env.AUTH_RESEND_KEY,
  from: FROM,
  // 自定义发送：用 React Email 模板渲染 + Resend SDK 发送（render() 为异步，必须 await）。
  async sendVerificationRequest({ identifier: email, url }) {
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
    // 白名单（NFR-2 单用户）。email-provider 流程中本回调在「发信前」触发一次：
    // 返回 false → 在 sendVerificationRequest 之前中止 → 不发邮件（AC11）。
    // 兜底：signin 的 Server Action 还会在调 signIn 前再判一次白名单并统一跳 verify-request，
    // 以保证非白名单不泄露成员身份（见 app/auth/signin/page.tsx）。
    async signIn({ user }) {
      if (user.email !== env.ALLOWED_EMAIL) {
        console.log('[auth] sign-in rejected (not allowlisted)');
        return false;
      }
      return true;
    },
  },
});
