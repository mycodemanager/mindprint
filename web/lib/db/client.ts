// Drizzle 客户端实例 —— drizzle-orm/neon-http 驱动 + @neondatabase/serverless。
// serverless-friendly：HTTP 驱动，无连接池烦恼，与 Vercel 部署兼容（架构锁定）。
//
// ⚠️ server-only：本文件经 env 触达 DATABASE_URL，禁止在任何 'use client' 组件中 import。
// DB 访问边界：业务代码不直接写 Drizzle 查询，统一经 lib/db/queries.ts（Story 2.3 起）。
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '@/lib/env';
import * as schema from './schema';

export const db = drizzle({ client: neon(env.DATABASE_URL), schema });
