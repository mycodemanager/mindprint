// NFR-2 单用户白名单的唯一判定入口（server-only）。
//
// 背景（code-review F2）：表单对邮箱做 trim+lowercase，而此前 env.ALLOWED_EMAIL 只 trim，
//   signin Server Action / callbacks.signIn / requireAlex 三处各自比较，口径不一致——
//   一旦 ALLOWED_EMAIL 带大写就会把合法的 alex 锁死。这里集中归一化 + 比较，三处共用，
//   且与 Auth.js email-provider 的 defaultNormalizer（toLowerCase + trim）对齐。
//
// ⚠️ server-only：import env（→ DB/密钥聚合），禁止被任何 'use client' 组件 import。
import 'server-only';
import { env } from '@/lib/env';

// 邮箱归一化：trim + lowercase。与 @auth/core send-token.js 的 defaultNormalizer 同口径。
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// 是否为白名单邮箱。env.ALLOWED_EMAIL 已在 lib/env.ts 归一化为小写并校验过格式。
export function isAllowedEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && normalizeEmail(email) === env.ALLOWED_EMAIL;
}
