// R2 上传 —— Entry HTML 写入对象存储。
//
// ⚠️ server-only：经 r2Client 触达 R2 凭据，禁止在任何 'use client' 组件中 import。
//
// R2 object key 约定（架构 project-structure-boundaries.md#data-boundaries，锁定）：
//   `entries/${userId}/${entryId}.html`
//   —— V1 单用户，但前缀已 user-scoped 为未来多用户预留；单 user 下扁平不分子目录。
//   本 story 不构造 key（实际构造在 Story 2.2 的 archiveEntry）；upload/fetch 只接收外部传入的 key。
import 'server-only';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from './client';
import { env } from '@/lib/env';

export async function uploadEntryHtml(
  key: string,
  body: string | Buffer,
): Promise<void> {
  // 不传 ACL：R2 不支持 ACL，传了会报错（架构 Story 2.1 Implementation Notes）。
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'text/html; charset=utf-8',
    }),
  );
  console.log('[r2] uploaded entry html', { key });
}
