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

  // ── 部署 canonical URL —— Story 1.5 收紧（生产必需 / 非生产可选）──
  // Auth.js v5 读 process.env.AUTH_URL（v4 才是 NEXTAUTH_URL）。语法层保持 optional + z.url()
  //    （Zod v4 顶层校验，替代已弃用的 z.string().url()，与本文件 z.email() 一致）；「生产必需」由
  //    schema 末尾的 .superRefine() 按 VERCEL_ENV 强制（见下）。一旦设置，config.ts 的
  //    sendVerificationRequest 会据此校验 magic-link 的 origin，防 Host header 投毒（code-review F4）。
  //    ⚠️ 不关闭 trustHost——见 auth.config.ts 注释：关闭只会在 Vercel 触发 UntrustedHost，且不增任何
  //    防投毒能力（防护由本变量的 origin 断言提供）。
  AUTH_URL: z.url().optional(),

  // ── Cloudflare R2 对象存储 —— Story 2.1 收紧完成（必需）──
  // 用 .trim().min(1) 同时拒绝空串 / 纯空白（消化 Story 1.2 code-review 的「空串」defer 项）。
  R2_ACCOUNT_ID: z
    .string()
    .trim()
    .min(1, 'R2_ACCOUNT_ID 不能为空（Cloudflare account id，构成 R2 S3 endpoint）'),
  R2_ACCESS_KEY_ID: z
    .string()
    .trim()
    .min(1, 'R2_ACCESS_KEY_ID 不能为空（R2 API token 的 Access Key ID）'),
  R2_SECRET_ACCESS_KEY: z
    .string()
    .trim()
    .min(1, 'R2_SECRET_ACCESS_KEY 不能为空（R2 API token 的 Secret Access Key）'),
  R2_BUCKET_NAME: z
    .string()
    .trim()
    .min(1, 'R2_BUCKET_NAME 不能为空（生产 bucket 名，如 mindprint-entries）'),

  // ── 备份与只读 —— Story 4.5 收紧为必需 ──
  R2_BACKUP_BUCKET_NAME: z.string().optional(),
  DATABASE_URL_READONLY: z.string().optional(),
})
  // AUTH_URL 生产必需（Story 1.5）：用 VERCEL_ENV 判定（Vercel 注入 production / preview / development）。
  //   比 NODE_ENV 更准——preview 构建的 NODE_ENV 同样是 'production'，但 preview 子域 URL 不稳定，
  //   不应被强制；故仅在 VERCEL_ENV === 'production' 时要求。本地 dev/build（无 VERCEL_ENV）保持可选，
  //   不触发 fail-fast，由 trustHost 处理 localhost。
  .superRefine((val, ctx) => {
    if (process.env.VERCEL_ENV === 'production' && !val.AUTH_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_URL'],
        message: 'AUTH_URL 在生产为必需（= 稳定生产 URL，如 https://<subdomain>.vercel.app）',
      });
    }
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
