// DB 查询收口（架构 Data Boundaries：业务代码不直接写 Drizzle 查询，统一经此，便于未来加测试）。
// Story 2.3 起。本 story 只加 getEntryById；getEntries / countEntries 留 Epic 3。
//
// ⚠️ server-only：经 db 触达 DATABASE_URL，禁止被任何 'use client' 组件 import。
//
// 🔑 DB 边界做 Date → ISO string 映射（schema.ts:12-15 + types.ts 契约）：
//    timestamptz 列 Drizzle 返回 `Date`，而领域 Entry 用 ISO `string`。映射在此收口，
//    使下游纯函数与组件契约稳定。**不要**用 InferSelectModel<typeof entries> 直接当 Entry。
import 'server-only';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { entries } from '@/lib/db/schema';
import type { Entry } from '@/lib/entry/types';

const uuidSchema = z.uuid();

/**
 * 单行查询 Entry。未命中或 id 非合法 UUID → null。
 *
 * 非法 UUID 守卫：URL 的 [id] 可为任意字符串；非 UUID 喂 PG `uuid` 列会抛
 * `invalid input syntax for type uuid`（→ 500）。这里当未命中处理，让调用方走
 * notFound() / 404 而非 500。
 */
export async function getEntryById(id: string): Promise<Entry | null> {
  if (!uuidSchema.safeParse(id).success) return null;

  const [row] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);

  if (!row) return null;

  // 显式映射（不 spread）：领域 Entry 无 userId 字段；Date → ISO string。
  return {
    id: row.id,
    title: row.title,
    archivedAt: row.archivedAt.toISOString(),
    originalFilename: row.originalFilename,
    sizeBytes: row.sizeBytes,
    r2ObjectKey: row.r2ObjectKey,
    createdAt: row.createdAt.toISOString(),
  };
}
