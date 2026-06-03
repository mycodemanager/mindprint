'use server';

// archiveEntry —— FR-1/2/3 归档写链路（Server Action）。
// 事务性：R2 上传 → DB insert；DB 失败 → 应用层补偿删 R2 对象（neon-http 无 db.transaction()）。
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAlex } from '@/lib/auth/require-alex';
import { db } from '@/lib/db/client';
import { users, entries } from '@/lib/db/schema';
import { uploadEntryHtml } from '@/lib/r2/upload';
import { deleteEntryHtml } from '@/lib/r2/delete';
import { ArchiveInputSchema, type ArchiveInput } from '@/lib/entry/schemas';
import { COPY } from '@/lib/voice';
import type { ActionResult, ActionErrorCode } from '@/lib/entry/types';

const MAX_BYTES = 10 * 1024 * 1024;

/** 把首个 Zod 校验失败字段映射到错误码 + voice 文案。 */
function mapValidationError(field: PropertyKey | undefined): {
  code: ActionErrorCode;
  message: string;
} {
  switch (field) {
    case 'sizeBytes':
      return { code: 'FILE_TOO_LARGE', message: COPY.archive.errTooLarge };
    case 'titleOverride':
      return { code: 'INVALID_TITLE_LENGTH', message: COPY.archive.errTitle };
    case 'filename':
    default:
      return { code: 'INVALID_FILE_TYPE', message: COPY.archive.errInvalidType };
  }
}

export async function archiveEntry(
  input: ArchiveInput,
): Promise<ActionResult<{ id: string }>> {
  // 1) 鉴权（NFR-2 API 层）。requireAlex 抛 UNAUTHORIZED → 由 Next 处理，不包进 ActionResult。
  const session = await requireAlex();

  // 2) 权威校验（client 已早校验，server 必重做）。
  const parsed = ArchiveInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: mapValidationError(parsed.error.issues[0]?.path[0]) };
  }
  const { filename, htmlContent, titleOverride } = parsed.data;

  // 2b) 真实内容字节校验：不信客户端 sizeBytes（可伪造小值塞超大 htmlContent，body 限到 16MB）。
  //     直接量 htmlContent 的 UTF-8 字节，超 10MB 拒绝，并以此值写库（DB 元数据准确）。
  const actualBytes = Buffer.byteLength(htmlContent, 'utf8');
  if (actualBytes > MAX_BYTES) {
    return { ok: false, error: { code: 'FILE_TOO_LARGE', message: COPY.archive.errTooLarge } };
  }

  // 3) userId —— 经会话邮箱查 users（不依赖 session.user.id；config.ts 无 session 回调）。
  const email = session.user?.email;
  if (!email) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: COPY.archive.errGeneric } };
  }
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!user) {
    console.error('[archive] no user row for session email');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: COPY.archive.errGeneric } };
  }

  // 4) id + R2 key（约定 entries/{userId}/{entryId}.html）。
  const entryId = randomUUID();
  const r2ObjectKey = `entries/${user.id}/${entryId}.html`;

  // 5) R2 上传。
  try {
    await uploadEntryHtml(r2ObjectKey, htmlContent);
  } catch (err) {
    console.error('[archive] R2 upload failed', err);
    return { ok: false, error: { code: 'UPLOAD_FAILED', message: COPY.archive.failed } };
  }

  // 6-7) DB insert；失败 → 应用层补偿回滚（不留半个 Entry）。回滚做 2 次尝试，仍失败显式告警孤儿。
  try {
    await db.insert(entries).values({
      id: entryId,
      userId: user.id,
      title: titleOverride,
      originalFilename: filename,
      sizeBytes: actualBytes, // 服务端实测字节，非客户端声明值
      r2ObjectKey,
    });
  } catch (err) {
    console.error('[archive] DB insert failed — rolling back R2 object', err);
    let rolledBack = false;
    for (let attempt = 1; attempt <= 2 && !rolledBack; attempt++) {
      try {
        await deleteEntryHtml(r2ObjectKey);
        rolledBack = true;
      } catch (rollbackErr) {
        console.error(`[archive] R2 rollback attempt ${attempt} failed`, { r2ObjectKey, rollbackErr });
      }
    }
    if (!rolledBack) {
      // 双重失败 → 孤儿对象。架构 Data Boundaries 规划了周期清理脚本（Epic 4）兜底；此处显式告警留痕。
      console.error('[archive] ORPHAN R2 object left after failed rollback', { r2ObjectKey });
    }
    return { ok: false, error: { code: 'DB_ERROR', message: COPY.archive.errGeneric } };
  }

  // 8) 失效缓存（无客户端缓存兜底）。
  revalidatePath('/');
  revalidatePath(`/entry/${entryId}`);

  // 9) 成功。
  console.log('[archive] archived', { entryId, sizeBytes: actualBytes });
  return { ok: true, data: { id: entryId } };
}
