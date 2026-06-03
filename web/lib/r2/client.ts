// R2 客户端实例 —— @aws-sdk/client-s3 经 Cloudflare R2 的 S3 兼容 endpoint。
//
// ⚠️ server-only：本文件经 env 触达 R2 凭据，禁止在任何 'use client' 组件中 import。
// R2 访问边界（架构 project-structure-boundaries.md#data-boundaries）：业务代码不直接调
//   @aws-sdk/client-s3，一律经 lib/r2/*（upload / fetch / 未来 download）。
import 'server-only';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';

// R2 校验和兼容性（关键，勿删）：@aws-sdk/client-s3 v3.729.0+ 默认对 PutObject/UploadPart
//   加 CRC32 校验和（requestChecksumCalculation 默认 'WHEN_SUPPORTED'）。早期 R2 不支持 →
//   PutObject 报 `NotImplemented: Header 'x-amz-checksum-crc32' ... not implemented`，上传直接失败。
//   Cloudflare 已于 2025-02 服务端修复，但对 S3 兼容（非 AWS）存储仍推荐显式设为 'WHEN_REQUIRED'，
//   恢复旧行为（仅操作必需时才算校验和），零成本规避加头 / 响应校验在 R2 上的各种边角失败。
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
