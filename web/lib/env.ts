// Typed env —— 模块加载即用 Zod 校验 process.env（fail-fast）。
//
// ⚠️ server-only：本文件聚合 DB 连接串 / 认证密钥 / R2 凭据，
//    禁止在任何 'use client' 组件中 import（Story 1.2 Task 8 用 grep 验证）。
//
// 必需 / 可选策略（Story 1.2 决策）：变量随对应 Story 收紧为必需 —— 避免尚未配置的变量
// 提前触发 dev/build fail-fast。每个可选变量旁标注「何时收紧」。
// Story 1.3 已收紧：AUTH_SECRET / AUTH_RESEND_KEY / ALLOWED_EMAIL（认证基线必需）。
import 'server-only';
import { z } from 'zod';

const EnvSchema = z.object({
  // ── 必需（本 Story 即需；client 实例 + drizzle-kit push 依赖）──
  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL 不能为空（Neon 连接串，含 ?sslmode=require）'),

  // ── 认证 Auth.js —— Story 1.3 收紧完成（必需）──
  // 用 .trim().min(1) 同时拒绝空串 / 纯空白（消化 Story 1.2 code-review 的「空串」defer 项）。
  AUTH_SECRET: z
    .string()
    .trim()
    .min(1, 'AUTH_SECRET 不能为空（会话加密密钥，`openssl rand -base64 33` 生成）'),
  AUTH_RESEND_KEY: z
    .string()
    .trim()
    .min(1, 'AUTH_RESEND_KEY 不能为空（Resend API key，Magic Link 发信）'),
  // 归一化为 trim+lowercase 并校验邮箱格式，与 Auth.js email-provider 的 normalizer 对齐，
  // 避免大小写不一致把白名单用户锁死（code-review F2）。三处比较统一走 lib/auth/allowlist.ts。
  ALLOWED_EMAIL: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('ALLOWED_EMAIL 必须是合法邮箱（NFR-2 单用户白名单，填 alex 的邮箱）')),

  // ── 部署 canonical URL —— Story 1.5 收紧为必需 ──
  // Auth.js v5 读 process.env.AUTH_URL（v4 才是 NEXTAUTH_URL）。本 Story 用 `trustHost: true`
  //    从请求头推断，故此变量 optional。一旦设置，sendVerificationRequest 会据此校验 magic-link 的
  //    origin，防 Host header 投毒（code-review F4）。Story 1.5 收紧为必需 + 关 trustHost。
  AUTH_URL: z.string().url().optional(),

  // ── Cloudflare R2 对象存储 —— Epic 2 收紧为必需 ──
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // ── 备份与只读 —— Story 4.5 收紧为必需 ──
  R2_BACKUP_BUCKET_NAME: z.string().optional(),
  DATABASE_URL_READONLY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // fail-fast：清晰报错并指明出问题的变量名
  const details = parsed.error.issues
    .map((issue) => `  · ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `❌ 环境变量校验失败（检查 web/.env.local，缺什么参考 web/.env.example）：\n${details}`,
  );
}

export const env = parsed.data;
