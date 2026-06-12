# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

识别出 **7 类一致性高风险点**：DB 命名、TS 代码命名、文件组织、Server Action 契约、Route Handler 契约、错误处理与加载态、原型代码平移规则。每类下给出**所有 AI agents 必须遵守的**单一约定。

---

## Naming Patterns

### Database Naming（Drizzle schema 中）

| 元素 | 约定 | 示例 |
|---|---|---|
| **表名** | snake_case，**复数** | `entries`、`users`、`sessions`、`verification_tokens`、`accounts`（Auth.js 标准 4 表 + entries） |
| **列名** | snake_case | `archived_at`、`original_filename`、`size_bytes`、`r2_object_key` |
| **主键** | 一律 `id`（UUID v4 via `gen_random_uuid()`） | `id uuid primary key default gen_random_uuid()` |
| **外键** | `<singular_table>_id` | `user_id`（Entry 表外键到 users） |
| **时间戳列** | `<event>_at`（timestamptz） | `created_at`、`archived_at`（**注意**：硬删除——不要 `deleted_at`） |
| **Boolean 列** | 前缀 `is_` / `has_`（V1 schema 中暂无） | 未来如需：`is_starred`、`has_thumbnail` |
| **索引名** | `idx_<table>_<column[_column]>` | `idx_entries_archived_at`（时间线倒序查询） |
| **TS 字段名** | Drizzle 自动 snake_case → camelCase | DB `archived_at` → TS `archivedAt` |

### TypeScript Code Naming

| 元素 | 约定 | 示例 |
|---|---|---|
| **React 组件文件** | PascalCase `.tsx` | `EntryCard.tsx`、`Timeline.tsx`、`ArchiveModal.tsx`（与 prototype 一致） |
| **非组件 TS 文件** | kebab-case `.ts` | `lib/entry-queries.ts`、`lib/r2-client.ts`、`lib/extract-title.ts` |
| **类型 / 接口** | PascalCase | `Entry`、`User`、`ArchiveResult`、`SortDirection` |
| **函数** | camelCase，**动词开头** | `archiveEntry`、`getEntryById`、`generateSignedDownloadUrl`、`extractTitle` |
| **React 组件** | PascalCase | `<EntryCard />`、`<Timeline />` |
| **Hooks** | `use` 前缀 + camelCase | `useDragAndDrop`、`useFullRenderKeyboard` |
| **常量** | SCREAMING_SNAKE_CASE，**模块顶部** | `MAX_FILE_SIZE`、`SESSION_MAX_AGE_SECONDS`、`SIGNED_URL_TTL_SECONDS` |
| **环境变量** | SCREAMING_SNAKE_CASE | `DATABASE_URL`、`AUTH_RESEND_KEY`、`ALLOWED_EMAIL`、`R2_BUCKET_NAME` |
| **Server Action 函数名** | 动词开头 + 名词 | `archiveEntry`、`updateEntryTitle`、`deleteEntry`、`sendMagicLink` |

### URL / Route Naming

| 元素 | 约定 | 示例 |
|---|---|---|
| **页面路径** | 单数 + kebab-case + `[id]` 动态段 | `/entry/[id]`、`/auth/signin`（与 prototype 一致） |
| **API 路径** | `/api/<resource singular>/<segment>` | `/api/entry/[id]/html`、`/api/entry/[id]/download`、`/api/auth/[...nextauth]` |
| **Query params** | camelCase | `?sort=desc` |
| **HTTP 方法语义** | RESTful | GET 读、POST 创建、PATCH 修改、DELETE 删除（Route Handler 实际场景中以 GET/POST 为主） |

---

## Structure Patterns（项目目录组织）

```
web/
├── app/
│   ├── layout.tsx                  # 根布局（含 ThemeProvider）
│   ├── page.tsx                    # 时间线主屏（Server Component）
│   ├── error.tsx                   # 顶层错误边界
│   ├── loading.tsx                 # 顶层 loading（Suspense fallback）
│   ├── globals.css                 # Tailwind 入口
│   ├── entry/
│   │   └── [id]/
│   │       ├── page.tsx            # Full Render（Server Component）
│   │       └── error.tsx           # 局部错误边界（渲染失败兜底）
│   ├── auth/
│   │   ├── signin/page.tsx         # 登录页（输入邮箱）
│   │   └── verify-request/page.tsx # 邮件已发提示
│   ├── _actions/                   # Server Actions（下划线 = 非路由）
│   │   ├── archive.ts              # archiveEntry
│   │   ├── update-title.ts         # updateEntryTitle
│   │   └── delete-entry.ts         # deleteEntry
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # Auth.js 回调
│       └── entry/[id]/
│           ├── html/route.ts       # HTML 内容代理（喂 iframe srcDoc）
│           └── download/route.ts   # 下载原 .html（signed URL）
├── components/                     # 一组件一文件
│   ├── Timeline.tsx                # Server Component 主壳
│   ├── EntryCard.tsx               # Server Component
│   ├── MonthDivider.tsx            # Server Component
│   ├── FullRender.tsx              # Server Component
│   ├── ArchiveModal.tsx            # 'use client'
│   ├── Dropzone.tsx                # 'use client'
│   ├── SortToggle.tsx              # 'use client'
│   ├── InlineTitleEditor.tsx       # 'use client'
│   ├── MoreMenu.tsx                # 'use client'
│   ├── ConfirmDeleteDialog.tsx     # 'use client'
│   └── FullRenderKeyboard.tsx      # 'use client'（← / → / Esc 监听）
├── lib/
│   ├── db/
│   │   ├── schema.ts               # 所有 Drizzle 表定义集中一文件
│   │   ├── client.ts               # drizzle-orm/neon-http 实例
│   │   └── queries.ts              # 共享查询函数（getEntries / getEntryById / ...）
│   ├── auth/
│   │   ├── config.ts               # Auth.js NextAuthConfig
│   │   ├── require-alex.ts         # requireAlex() helper（NFR-2）
│   │   └── magic-link-email.tsx    # React Email 模板
│   ├── r2/
│   │   ├── client.ts               # @aws-sdk/client-s3 实例
│   │   ├── upload.ts               # uploadEntryHtml(key, body)
│   │   ├── download.ts             # generateSignedDownloadUrl(key)
│   │   └── fetch.ts                # fetchEntryHtml(key) -> Response stream
│   ├── entry/
│   │   ├── types.ts                # Entry / ArchiveResult / SortDirection
│   │   ├── extract-title.ts        # 平移自 prototype
│   │   ├── group-by-month.ts       # 平移自 prototype
│   │   ├── sort-entries.ts         # 平移自 prototype
│   │   ├── relative-time.ts        # 平移自 prototype
│   │   ├── absolute-time.ts        # 平移自 prototype
│   │   └── get-adjacent.ts         # 平移自 prototype
│   └── env.ts                      # 环境变量 Zod 校验（typed env）
├── drizzle/
│   ├── migrations/                 # generate 输出（上线后）
│   └── meta/                       # Drizzle Kit 元数据
├── drizzle.config.ts               # Drizzle Kit 配置
├── middleware.ts                   # 应用层 NFR-2（重定向未认证）
├── public/
│   └── favicon.ico
├── scripts/
│   └── backup.ts                   # 周期性备份脚本
├── .env.local                      # 本地环境变量（gitignored）
├── .env.example                    # 示例（提交到 git）
├── next.config.ts
├── tailwind.config.ts              # 与 DESIGN.md tokens 对齐
├── tsconfig.json
├── package.json
└── README.md
```

**目录约定原则：**
- **一组件一文件**——便于 git diff 跟踪与 AI agent 修改边界清晰
- **`_actions/` 下划线前缀** = Next.js App Router 约定中"不作为路由段"的标记
- **`lib/<domain>/` 按领域分组**（db / auth / r2 / entry）而非按类型分组（types / utils / helpers）——领域内聚高于类型一致
- **测试文件就近放置**（未来加测试时）：`entry-card.test.tsx` 紧邻 `EntryCard.tsx`

---

## Format Patterns

### Server Action 返回契约（强制约束）

所有 Server Action **必须**返回 `ActionResult<T>` 判别联合类型：

```typescript
// lib/entry/types.ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export interface ActionError {
  code: ActionErrorCode;
  message: string;            // 用户可见的中文消息
  field?: string;             // 可选：字段级错误（表单 inline 显示用）
}

export type ActionErrorCode =
  | 'UNAUTHORIZED'            // 未认证
  | 'INVALID_FILE_TYPE'       // 上传扩展名非 .html/.htm
  | 'FILE_TOO_LARGE'          // > 10MB
  | 'INVALID_TITLE_LENGTH'    // > 200 字符
  | 'ENTRY_NOT_FOUND'         // id 不存在
  | 'UPLOAD_FAILED'           // R2 上传失败
  | 'DB_ERROR'                // Drizzle 写入失败
  | 'EMAIL_NOT_ALLOWED'       // Magic Link signIn 非 alex 邮箱
  | 'INTERNAL_ERROR';         // 兜底
```

**约束：**
- Server Action **绝不**对客户端 throw —— 错误必须包成 `{ ok: false, error }`
- 错误 `message` 字段是**用户可见中文**（直接显示在 UI），不是开发者诊断文本
- 错误 `code` 字段是 SCREAMING_SNAKE_CASE，便于 client 端 switch 处理
- 服务端 throw 仅限 `requireAlex()` 中——middleware/中间件级，由 Next.js 默认 error.tsx 处理

### Route Handler 返回契约

| 场景 | Status | Body |
|---|---|---|
| **成功 JSON** | 200 | `{ data: T }` 直接对象，无 `ok` 包裹（与 Server Action 区分） |
| **成功 binary**（下载 / HTML 代理） | 200 | binary stream + 正确 Content-Type / Content-Disposition |
| **未认证** | 401 | **空 body**（NFR-2 资源层不泄露） |
| **资源不存在** | 404 | `{ error: { code: 'NOT_FOUND', message: '...' } }` |
| **请求格式错误** | 400 | `{ error: { code: 'BAD_REQUEST', message: '...' } }` |
| **服务端错误** | 500 | `{ error: { code: 'INTERNAL_ERROR', message: '内部错误。' } }` |

### 数据格式约定

| 维度 | 约定 |
|---|---|
| **JSON 字段命名** | camelCase（与 TS 一致；Drizzle 自动从 snake_case 列名转换） |
| **日期 / 时间** | ISO 8601 字符串（`2026-05-28T16:22:00.000Z`）；TS 内运行时用 `Date` 对象，序列化时回字符串 |
| **DB 时间戳类型** | `timestamptz`（带时区） |
| **Boolean** | `true` / `false`（不接受 0/1 / "yes"/"no"） |
| **空值** | 用 `null` 表示缺失，不用 `undefined` 或 `""`（仅 TS 内 optional 字段可用 `undefined`） |
| **ID 格式** | UUID v4 字符串（`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`） |
| **文件大小** | bytes（integer），UI 层用 `1.2 MB` 格式化显示 |
| **HTML 内容** | UTF-8 字符串；Content-Type `text/html; charset=utf-8` |

---

## Communication Patterns

### Server Action 调用模式（强制）

```typescript
// app/_actions/archive.ts
'use server';

import { z } from 'zod';
import { requireAlex } from '@/lib/auth/require-alex';
import { uploadEntryHtml } from '@/lib/r2/upload';
import { db } from '@/lib/db/client';
import { entries } from '@/lib/db/schema';
import { extractTitle } from '@/lib/entry/extract-title';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/entry/types';

const ArchiveInputSchema = z.object({
  filename: z.string(),
  sizeBytes: z.number().int().max(10 * 1024 * 1024),  // 10MB
  htmlContent: z.string(),
  titleOverride: z.string().max(200).optional(),
});

export async function archiveEntry(
  input: z.infer<typeof ArchiveInputSchema>
): Promise<ActionResult<{ id: string }>> {
  // 1) Auth
  await requireAlex();

  // 2) Validate
  const parsed = ArchiveInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_FILE_TYPE', message: '文件不符合要求。' } };
  }

  // 3) Business logic（事务性：R2 → DB；失败回滚）
  // ...

  // 4) Revalidate
  revalidatePath('/');
  revalidatePath(`/entry/${id}`);

  return { ok: true, data: { id } };
}
```

**强制规则：**
1. 文件顶部 `'use server';`
2. **第一行业务代码**永远是 `await requireAlex()`——NFR-2 应用层强制
3. **第二步**是 Zod schema 校验——客户端可能已校验但服务端必须重做
4. **变更后**显式 `revalidatePath()` ——无客户端缓存兜底
5. 返回 `ActionResult<T>` 判别联合

### Client 调用 Server Action 模式（强制）

```typescript
'use client';
import { useFormState } from 'react-dom';
import { archiveEntry } from '@/app/_actions/archive';

const [result, formAction] = useFormState(archiveEntry, null);
// ...
if (result?.ok === false) {
  // 显示 result.error.message
}
```

**禁止：**
- 不要在 client 用 `try/catch` 包 Server Action—— Action 不 throw
- 不要把 Server Action 当 REST 调用——通过 `useFormState` / `<form action={...}>` 或直接 await

### Route Handler 模式（强制）

```typescript
// app/api/entry/[id]/html/route.ts
import { NextRequest } from 'next/server';
import { requireAlex } from '@/lib/auth/require-alex';
import { fetchEntryHtml } from '@/lib/r2/fetch';
import { getEntryById } from '@/lib/db/queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) Auth（401 空 body 而非 404，与 NFR-2 资源层一致）
  try {
    await requireAlex();
  } catch {
    return new Response(null, { status: 401 });
  }

  // 2) Resolve params（Next.js 16 async params）
  const { id } = await params;

  // 3) Query DB
  const entry = await getEntryById(id);
  if (!entry) return new Response(null, { status: 404 });

  // 4) Stream from R2
  const r2Response = await fetchEntryHtml(entry.r2ObjectKey);
  return new Response(r2Response.body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

**强制规则：**
1. 所有 Route Handler 第一步 `requireAlex()`，未认证返回 **401 空 body**
2. Next.js 16 `params` 是 Promise，必须 `await`
3. Stream binary 用 `r2Response.body` 直接转 `Response`，不缓冲整个文件

---

## Process Patterns

### 错误处理分层

| 错误来源 | 处理方式 |
|---|---|
| **Server Component 抛错**（如 DB 查询失败） | React `error.tsx` boundary 捕获；`app/error.tsx` 顶层兜底；`app/entry/[id]/error.tsx` 局部兜底（含"返回时间线"链接） |
| **Server Action 错误** | 包成 `{ ok: false, error }` 返回；客户端通过 `useFormState` 拿到，inline 显示 `error.message` |
| **Route Handler 错误** | HTTP status code + JSON body；客户端 fetch 调用方 try/catch |
| **Client Component 抛错**（如 React render error） | `'use client'` 组件就近 `error.tsx` 或 `<ErrorBoundary />` |
| **iframe 渲染失败**（NFR-3 错误隔离） | iframe 自身错误不冒泡到宿主；onError 监听设占位 fallback（FR-4 D9c） |

### 日志格式（强制）

所有服务端 `console.log` / `console.error` 用 **`[domain] message`** 格式：

```typescript
console.log('[archive] uploaded to R2', { entryId, sizeBytes });
console.error('[archive] R2 upload failed', err);
console.log('[auth] magic link sent to', email);
console.log('[backup] dump complete', { rows, bytes });
```

**理由：** Vercel 日志面板 grep 友好；hobby 项目不引入 pino/winston 等库。

### Loading 状态模式

| 场景 | 实现 |
|---|---|
| **时间线主屏初次加载** | Server Component + Suspense + `loading.tsx`（skeleton 4-6 张卡片）—— EXPERIENCE.md "Cold load" |
| **Full Render 切换** | 动态路由切换 + Suspense + 局部 loading.tsx |
| **缩略预览懒加载** | IntersectionObserver 视口内才挂载 iframe；占位为 `bg-surface-container` |
| **归档上传中** | `useFormStatus()` 的 `pending` 让按钮 disabled + 文字 "上传中……" |
| **删除中** | 同上模式；modal 按钮 disabled + "删除中……" |

**约定：** **不使用 spinner 圈 / 百分比进度条**——与 EXPERIENCE.md voice "克制工具" 一致；文字"正在加载……" / "上传中……" 即可。

### 验证时机（强制双层）

| 验证点 | 实现 |
|---|---|
| **客户端 syntactic 检查** | 上传前检查扩展名 / 大小（用户体验：早期反馈） |
| **服务端权威验证** | **必须重做所有验证**——Server Action 内 Zod schema 校验 |
| **共享 schema** | Zod schema 定义在 `lib/entry/schemas.ts`，client 与 server 都 import |

**禁止：** 仅客户端验证（永远不要相信客户端）。

---

## Enforcement Guidelines

### All AI Agents MUST:

1. **认证调用强制**：每个 Server Action / Route Handler 第一行业务代码是 `await requireAlex()`。**无例外**——包括看似"public" 的端点
2. **沙箱属性强制**（经 Story 3.6 修订）：所有渲染 Entry HTML 的 iframe **必须**带 `sandbox="allow-scripts"`（仅此一个 token → opaque origin，脚本可执行但隔离宿主 cookie/DOM/storage），route 响应配 CSP `sandbox allow-scripts`。**红线**：缺失 `sandbox`、或叠加 `allow-same-origin`（与 allow-scripts 并存即逃逸沙箱）、或加 `allow-popups`/`allow-forms`/`allow-top-navigation`/`allow-modals` 等任何其他 token，均视为安全违规
3. **签名 URL 不进 DOM**：下载链接经服务端代理或一次性短时效 presigned URL，不在 client-rendered HTML 中长期可见
4. **revalidate 强制**：任何 mutation Server Action 完成必须显式 `revalidatePath()`——没有缓存兜底
5. **Zod 双层验证强制**：client 与 server 用同一 schema
6. **错误格式强制**：Server Action 返回 `ActionResult`，不抛 throw；Route Handler 用 HTTP status + JSON
7. **日志格式强制**：`[domain] message` 前缀
8. **PRD §3 Glossary 术语强制**：FRs / UJs / SMs 用的术语（Entry / 归档 / 时间线 / 完整渲染等）在代码 / 评论 / 错误消息中严格沿用，**禁同义词**
9. **原型代码平移规则**：从 prototype 平移代码时——保留类型 / 纯函数 / iframe pattern；剔除 IndexedDB / Service Worker / mock 数据。**不要"先放着等以后删"**——平移即净化

### Pattern Enforcement

- **静态层**：ESLint config 加 `eslint-plugin-no-restricted-syntax` 规则禁止特定 anti-pattern（如 Server Action 内 throw）—— Story 8 实现
- **代码评审层**：alex 自己 PR 评审时按本节 checklist 校对
- **测试层**（未来）：关键约束（如 requireAlex 必跑）可写测试验证

---

## Pattern Examples

### ✅ Good Example · Server Action

```typescript
// app/_actions/update-title.ts
'use server';

import { z } from 'zod';
import { requireAlex } from '@/lib/auth/require-alex';
import { db } from '@/lib/db/client';
import { entries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/entry/types';

const InputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
});

export async function updateEntryTitle(
  input: z.infer<typeof InputSchema>
): Promise<ActionResult<void>> {
  await requireAlex();

  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_TITLE_LENGTH', message: '标题长度需在 1–200 字符之间。' } };
  }

  try {
    await db.update(entries).set({ title: parsed.data.title }).where(eq(entries.id, parsed.data.id));
  } catch (err) {
    console.error('[update-title] db error', err);
    return { ok: false, error: { code: 'DB_ERROR', message: '更新失败。请重试。' } };
  }

  revalidatePath('/');
  revalidatePath(`/entry/${parsed.data.id}`);
  return { ok: true, data: undefined };
}
```

### ❌ Anti-Pattern · Server Action（多重违规）

```typescript
// 错误示范——不要这样写
export async function update_title(entryId: string, newTitle: string) {
  // ❌ 缺 'use server'
  // ❌ snake_case 函数名
  // ❌ 没 requireAlex()
  // ❌ 没 Zod 校验

  if (newTitle.length > 200) {
    throw new Error('Title too long');  // ❌ 抛 throw 给客户端
  }

  await db.update(entries).set({ title: newTitle }).where(eq(entries.id, entryId));
  // ❌ 没 revalidatePath
  // ❌ 没错误捕获
  // ❌ 没返回 ActionResult
}
```

### ✅ Good Example · iframe 沙箱化（route-handler src + sandbox="allow-scripts"，经 Story 3.6 修订）

```tsx
// components/ThumbnailIframe.tsx —— 缩略预览 iframe（Full Render 同模型）
<iframe
  src={`/api/entry/${id}/html`}  // ✅ route handler 流式（非 srcDoc；签名/凭据不进 DOM）
  sandbox="allow-scripts"        // ✅ 仅此 token → opaque origin：脚本可执行（渲染 JS 原型）但隔离宿主 cookie/DOM/storage
  loading="lazy"                 // ✅ 视口外不加载
  title={`${entry.title} 内容缩略`}  // ✅ a11y
  aria-hidden="true"             // ✅ 屏幕阅读器不读 iframe 内
  tabIndex={-1}
  className="absolute top-0 left-0 origin-top-left"
  style={{
    width: '250%',
    height: '250%',
    transform: 'scale(0.4)',
    border: 'none',
    pointerEvents: 'none',       // ✅ 卡片整体单击进 Full Render
  }}
/>
// 🚨 红线：绝不叠加 allow-same-origin（与 allow-scripts 并存即逃逸沙箱）
```

### ❌ Anti-Pattern · iframe 沙箱化

```tsx
// 错误示范
<iframe
  src={`/api/entry/${id}/html?token=${signedToken}`}  // ❌ 签名 URL 进 DOM
  sandbox="allow-scripts allow-same-origin"           // ❌ allow-scripts 单独 OK，但叠 allow-same-origin → 脚本可移除沙箱逃逸 = 无沙箱
  // ❌ 缺 title / aria
/>
```

### ✅ Good Example · DB Schema（Drizzle）

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
  originalFilename: text('original_filename').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  r2ObjectKey: text('r2_object_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// ✅ snake_case 列名 + camelCase TS 字段；UUID id；timestamptz；无 deleted_at（硬删除）
```
