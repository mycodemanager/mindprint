// Auth.js 共享配置基座（无 adapter / 无 db / 无 resend import）。
//
// 设计来源（Story 1.3 split-config）：完整配置 lib/auth/config.ts 通过 `...authConfig`
// 展开本基座，集中维护 trustHost / pages 等与运行时无关的字段。
//
// ⚠️ Next.js 16 说明：故事原文按「middleware 跑 Edge runtime、不能 import adapter」来设计
//    split-config。但 Next 16 已将 middleware 重命名为 proxy，且 proxy 固定 Node.js runtime
//    （见 node_modules/next/dist/docs 的 upgrading/version-16）。因此「边缘 bundle 会拉入 DB
//    驱动而炸」的风险在本项目不再成立。proxy.ts 改为做「乐观 cookie 存在性校验」做门卫
//    （Next 16 官方 auth 指南推荐：proxy 只读 cookie、不查 DB），真正鉴权由 Node 层的
//    requireAlex() 兜底。故下方 `authorized` 回调在当前实现中并未被 proxy 调用，仅作为
//    配置基座的一部分保留（语义：有 session.user 即视为已授权）。
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  // trustHost —— Story 1.5 决策：保留 true，不关闭（deferred-work F4 原写"关 trustHost"已修正）。
  //   依据 installed 源码 @auth/core/lib/utils/env.js:40：trustHost 未显式设时，VERCEL 环境会自动
  //   推断为 true；而 @auth/core/lib/utils/assert.js:56 对 falsy trustHost 直接判 UntrustedHost 拒绝
  //   所有请求 —— 显式关闭会让 Vercel/代理后登录直接崩。F4 的"防 Host header 投毒"目标改由 AUTH_URL
  //   + config.ts:33 的 origin 断言达成（关闭 trustHost 不增任何防护）。故生产姿势 =
  //   trustHost:true + 设 AUTH_URL pin canonical origin（Auth.js v5 on Vercel 推荐做法）。
  trustHost: true,
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  providers: [], // provider 在完整 config.ts 加；基座留空保持轻量
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
