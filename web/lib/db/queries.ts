// DB 查询收口（架构 Data Boundaries：业务代码不直接写 Drizzle 查询，统一经此，便于未来加测试）。
// Story 2.3 加 getEntryById；Story 3.1 加 getEntries（时间线全量 + archivedAt 排序）。countEntries 暂未需要。
//
// ⚠️ server-only：经 db 触达 DATABASE_URL，禁止被任何 'use client' 组件 import。
//
// 🔑 DB 边界做 Date → ISO string 映射（schema.ts:12-15 + types.ts 契约）：
//    timestamptz 列 Drizzle 返回 `Date`，而领域 Entry 用 ISO `string`。映射经 rowToEntry 收口，
//    使下游纯函数与组件契约稳定。**不要**把 DB 行类型直接当 Entry（Date 会漏进领域层）。
import 'server-only';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { entries } from '@/lib/db/schema';
import type { Entry, SortDirection } from '@/lib/entry/types';

const uuidSchema = z.uuid();

type EntryRow = typeof entries.$inferSelect;

/**
 * DB 行（timestamptz → Date）→ 领域 Entry（archivedAt/createdAt 为 ISO string）。
 * 显式映射不 spread：剔除领域 Entry 不含的 userId；Date → ISO。getEntryById / getEntries 共用，防两处漂移。
 */
function rowToEntry(row: EntryRow): Entry {
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

  return row ? rowToEntry(row) : null;
}

/**
 * 全量加载 Entry，按 archivedAt 排序（命中 idx_entries_archived_at 索引）。
 * desc = 最新在前（默认）/ asc = 最早在前。
 *
 * V1 单用户：不按 userId 过滤（alex 是唯一用户，与 getEntryById 一致）；
 * 多用户化时再 .where(eq(entries.userId, session.user.id))。不分页（V1 ≤ 50 条全量）。
 */
export async function getEntries(sort: SortDirection = 'desc'): Promise<Entry[]> {
  const rows = await db
    .select()
    .from(entries)
    .orderBy(sort === 'desc' ? desc(entries.archivedAt) : asc(entries.archivedAt));

  return rows.map(rowToEntry);
}
