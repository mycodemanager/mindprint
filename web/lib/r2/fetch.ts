// R2 读取 —— 从对象存储流式取回 Entry HTML，包成 Response。
//
// ⚠️ server-only：经 r2Client 触达 R2 凭据，禁止在任何 'use client' 组件中 import。
// 用法：Story 2.3 的 Route Handler /api/entry/[id]/html 直接 `new Response(r2Response.body, ...)` 转发。
import 'server-only';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from './client';
import { env } from '@/lib/env';

export async function fetchEntryHtml(key: string): Promise<Response> {
  const out = await r2Client.send(
    new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
  );

  // GetObject 成功理论上必有 Body；防御性兜底。
  if (!out.Body) {
    return new Response(null, { status: 404 });
  }

  // out.Body 在 Node 运行时带 sdk stream mixin；transformToWebStream() 转 Web ReadableStream，
  // 流式回客户端（不缓冲整文件）。key 不存在时 send() 会抛 NoSuchKey，由调用方（2.3 route）转 404。
  return new Response(out.Body.transformToWebStream(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
