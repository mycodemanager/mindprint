// MindPrint V1 数据层 schema —— 5 张表：Auth.js 标准 4 表（users / accounts /
// sessions / verification_tokens）+ 核心 entries。
//
// 命名约定（架构 implementation-patterns-consistency-rules.md#database-naming）：
//   · SQL 表名 snake_case 复数；列名 snake_case；TS 字段名 camelCase。
//   · Auth.js OAuth 规范字段（refresh_token 等）沿用 snake_case JS 字段名，
//     以对齐 @auth/drizzle-adapter 写入的键。
//
// ⚠️ Auth.js 4 表字段结构对齐 @auth/drizzle-adapter v5 标准；Story 1.3 安装 adapter 时
//    可直接挂载（届时可为 accounts.type 补 `.$type<AdapterAccountType>()` 类型收紧）。
//
// 时间戳映射决策（Story 1.1 已立，本 Story 必须遵守）：timestamptz 列查询时返回 `Date`；
// 而领域 Entry 用 ISO `string`。因此「不要」用 InferSelectModel<typeof entries> 直接充当 Entry，
// 由 lib/db/queries.ts（Story 2.3 / 3.1 建）在 DB 边界做 Date → ISO string 映射。
// 本 Story 只定义表 + client，不建 queries.ts。

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

// ── users（Auth.js 标准；V1 单用户 = alex）────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
});

// ── accounts（Auth.js 标准）──────────────────────────────────────────
// V1 Magic Link 不走 OAuth，但 adapter 期望该表存在 —— 按标准建全字段（含 OAuth 列）。
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

// ── sessions（Auth.js DB session；PRD A6 = 30 天会话）────────────────
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

// ── verification_tokens（Auth.js Magic Link 临时凭据）─────────────────
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ── entries（核心表）逐字参考架构 ✅ DB Schema 示例 ───────────────────
// 列与领域 Entry 字段一一对应：archived_at↔archivedAt、original_filename↔originalFilename、
// size_bytes↔sizeBytes、r2_object_key↔r2ObjectKey、created_at↔createdAt。
// 禁：deleted_at（硬删除 FR-7）、content_hash / tags / source_version（YAGNI，架构明确不预留）。
export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    originalFilename: text('original_filename').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    r2ObjectKey: text('r2_object_key').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // 时间线倒序查询索引
  (table) => [index('idx_entries_archived_at').on(table.archivedAt)],
);
