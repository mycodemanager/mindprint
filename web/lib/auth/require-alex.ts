// requireAlex() —— NFR-2「三层隔离」的 API 层网关（server-only）。
//
// 用法（Epic 2 起）：每个 Server Action / Route Handler 第一行调用；session 无效或邮箱不在
// 白名单则抛 'UNAUTHORIZED'，由调用方包成 ActionResult（lib/entry/types.ts 的 ActionErrorCode
// 已含 'UNAUTHORIZED'）或返回 401 空 body。
//
// ⚠️ server-only：import auth()（→ db / env），禁止被任何 'use client' 组件 import。
// 本 Story 仅建立此守卫，不创建任何业务路由（范围纪律）。
import 'server-only';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth/config';
import { isAllowedEmail } from '@/lib/auth/allowlist';

export async function requireAlex(): Promise<Session> {
  const session = await auth();
  if (!session || !isAllowedEmail(session.user?.email)) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
