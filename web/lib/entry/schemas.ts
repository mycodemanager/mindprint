// Zod schemas —— 归档/编辑输入校验（client + server 共享）。
// 架构「双层验证」铁律：client（Dropzone/Modal 早反馈）与 server（archiveEntry 权威重校验）
// import 同一 schema，绝不只信客户端。用户可见文案由 voice.ts 统一提供（见 archiveEntry 的
// 错误码映射），故此处不放面向用户的 prose 消息。
import { z } from 'zod';

export const ArchiveInputSchema = z.object({
  // .html / .htm（大小写不敏感）
  filename: z.string().trim().regex(/\.html?$/i),
  // ≤ 10MB
  sizeBytes: z
    .number()
    .int()
    .max(10 * 1024 * 1024),
  htmlContent: z.string(),
  titleOverride: z.string().trim().min(1).max(200),
});

export type ArchiveInput = z.infer<typeof ArchiveInputSchema>;

// 用于 Epic 4 编辑标题（本 story 仅定义，先建好共享 schema）。
export const UpdateTitleInputSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
});

export type UpdateTitleInput = z.infer<typeof UpdateTitleInputSchema>;
