// R2 删除 —— 移除 Entry HTML 对象。
//
// ⚠️ server-only：经 r2Client 触达 R2 凭据，禁止在任何 'use client' 组件中 import。
// 用途：archiveEntry 失败时的应用层补偿回滚（neon-http 无事务）+ Epic 4 永久删除复用。
import 'server-only';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from './client';
import { env } from '@/lib/env';

export async function deleteEntryHtml(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
  );
  console.log('[r2] deleted entry html', { key });
}
