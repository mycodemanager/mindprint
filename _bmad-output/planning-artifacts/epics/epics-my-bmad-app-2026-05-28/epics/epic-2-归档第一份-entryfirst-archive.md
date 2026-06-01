# Epic 2: 归档第一份 Entry（First Archive）

**Epic Goal**：实现"alex 把 .html 拖入 MindPrint → 看到它被沙箱化呈现"的完整链路。完成后 alex 能归档第一份 Entry 并立即看到它在 Full Render 视图内原貌呈现（虽然还没有时间线浏览能力）。

**Implementation Scope**：
- Cloudflare R2 setup：`mindprint-entries` 生产 bucket（禁 public access）+ IAM 凭据
- R2 helper 模块（`lib/r2/{client, upload, fetch}.ts`）—— 用 `@aws-sdk/client-s3` 经 S3 兼容 endpoint
- archiveEntry Server Action（`app/_actions/archive.ts`）—— 事务性：R2 上传 → Drizzle insert → revalidatePath；失败回滚 R2 对象
- Zod schema（`lib/entry/schemas.ts`，client + server 共享）
- extract-title 纯函数（已在 Epic 1 平移；本 Epic 接入）
- Dropzone 组件（`'use client'`，整屏 drag listener + 文件类型 / 大小早期校验）
- ArchiveModal + Upload Preview Form（标题预填 + 200 字符编辑 + 确认 / 取消）
- Full Render **基础视图**：`app/entry/[id]/page.tsx` Server Component + FullRender Server Component 主壳 + Top Chrome 简化版（返回 + 标题 + 时间）+ iframe `sandbox=""` + srcDoc 模式
- HTML 内容代理 Route Handler（`/api/entry/[id]/html`）——服务端从 R2 流式 fetch + 401 空 body 未认证
- error.tsx 局部错误边界（含"返回时间线"链接）
- 状态契约：归档中（modal 按钮 disabled + "上传中……"）/ 归档失败（inline 错误 + 重试）/ Full Render 加载 / Full Render 失败

**FRs covered**: **FR-1, FR-2, FR-3, FR-5（基础渲染，无上一下一）**
**NFRs covered**: **NFR-1 沙箱化首次实装** + NFR-2 资源层（R2 桶私有）
**UX-DRs covered**: UX-DR12（Dropzone 双形态 + 整屏 listener）+ UX-DR13（Upload Preview Form）+ UX-DR15（Top Chrome 基础）+ UX-DR23（归档中状态）+ UX-DR24（Full Render 加载）+ UX-DR25（Full Render 失败）

**Standalone Test**：登录后的 alex 拖入一份 .html 到主屏 → 看到 Archive Modal 含标题预填 → 编辑标题 + 确认 → 自动跳到 Full Render 视图 → HTML 原貌呈现（沙箱化）→ 点击"返回时间线"回主屏（此时主屏仍是 Empty State，因为 Epic 3 才做时间线渲染——但 Entry 已在 DB 与 R2 中持久化）。

> **注**：本 epic 完成时主屏看起来仍是空（Epic 3 才接入 timeline 渲染），但归档动作已完整工作——刷新页面 Entry 不丢失（DB + R2 已写入），FR-3 的"≤ 1 跳转看到完整渲染"已满足。

## Story 2.1: R2 存储基础（bucket + IAM + S3 SDK helper）

As alex,
I want Cloudflare R2 buckets configured under my own CF account with proper IAM scopes, and a helper module abstracting all R2 operations,
So that subsequent stories can upload / fetch / delete Entry HTML files behind clean function boundaries.

**Acceptance Criteria:**

**Given** Cloudflare 账号
**When** alex 在 CF dashboard 创建 R2 bucket `mindprint-entries`
**Then** bucket 配置 **public access disabled** ✓
**And** alex 创建 R2 API token，scope 限到 `mindprint-entries` bucket，权限 Read+Write+Delete
**And** 获得 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`

**Given** R2 凭据
**When** alex 更新 Vercel env vars + 本地 `.env.local`
**Then** R2 三个 vars + `R2_BUCKET_NAME=mindprint-entries` 填入（之前 Story 1.5 占位被替换）
**And** redeploy 后 `lib/env.ts` 校验通过

**Given** S3 SDK
**When** 我安装 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
**Then** 入 dependencies

**Given** R2 client helper
**When** 我创建 `web/lib/r2/client.ts`
**Then** exports `r2Client` configured S3Client:
- endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
- region = "auto"
- credentials = { accessKeyId, secretAccessKey }

**Given** R2 upload
**When** 我创建 `web/lib/r2/upload.ts`
**Then** exports `async function uploadEntryHtml(key: string, body: string | Buffer): Promise<void>` 用 `PutObjectCommand` (ContentType `text/html; charset=utf-8`)

**Given** R2 fetch
**When** 我创建 `web/lib/r2/fetch.ts`
**Then** exports `async function fetchEntryHtml(key: string): Promise<Response>` 用 `GetObjectCommand`，返回 streaming Response with proper Content-Type

**Given** R2 key 约定
**When** key 格式
**Then** 文档明确 `entries/${userId}/${entryId}.html`（V1 单用户但前缀已 user-scoped）

**Given** 烟雾测试
**When** alex 跑临时脚本：upload "<html>hello</html>" 到测试 key → fetch 同 key
**Then** fetch body 字节与上传一致
**And** R2 dashboard 看到对象
**And** 直接访问公开 URL → 403（public access disabled 生效）

**Implementation Notes**:
- R2 与 S3 兼容差异：region 用 "auto"；不要传 ACL
- V1 ≤ 10MB 单 PutObject 即可（不需 multipart）

## Story 2.2: 归档链路（Dropzone + ArchiveModal + archiveEntry Server Action）

As alex,
I want to drag a .html file onto MindPrint, see metadata preview with editable title, and submit the archive to persist transactionally,
So that I can put new thinking artifacts in with low friction and trust nothing leaks into a partial state.

**Acceptance Criteria:**

**Given** Zod schemas
**When** 我创建 `web/lib/entry/schemas.ts`
**Then** exports `ArchiveInputSchema` Zod object：
- `filename: string()` ends with `.html` or `.htm` (case-insensitive)
- `sizeBytes: number().int().max(10 * 1024 * 1024)`
- `htmlContent: string()`
- `titleOverride: string().min(1).max(200)`
**And** exports `UpdateTitleInputSchema` (id uuid + title 1-200 chars)

**Given** Server Action
**When** 我创建 `web/app/_actions/archive.ts`
**Then** `'use server'` 顶部
**And** exports `async function archiveEntry(input): Promise<ActionResult<{ id: string }>>`：
1. `await requireAlex()` — 第一行
2. Zod 校验失败 → `{ ok: false, error: { code, message } }` with voice copy
3. 生成 `entryId = randomUUID()`
4. 计算 `r2ObjectKey = 'entries/' + userId + '/' + entryId + '.html'`
5. `await uploadEntryHtml(r2ObjectKey, htmlContent)`
6. Try `await db.insert(entries).values(...)`
7. Catch DB 失败 → `await deleteEntryHtml(r2ObjectKey)` (rollback) → `{ ok: false, error: { code: 'DB_ERROR' } }`
8. `revalidatePath('/')`, `revalidatePath('/entry/' + id)`
9. Return `{ ok: true, data: { id } }`

**Given** Dropzone client component
**When** 我创建 `web/components/Dropzone.tsx` (`'use client'`)
**Then** 整屏 drag listener (window dragenter / dragover / dragleave / drop)
**And** 拖拽悬停 → overlay：surface-container-high 背景 + primary 实线边 + 中央 "放下以归档"
**And** drop → handleFile：扩展名 / 大小 / 多文件 三层校验，失败 setErrorBanner with voice copy
**And** error banner role="alert" 显示 4 秒

**Given** ArchiveModal
**When** 我创建 `web/components/ArchiveModal.tsx` (`'use client'`)
**Then** 居中 modal：缩略图占位 + Label "标题" + Input 下划线形态（预填 `extractTitle(content, filename)`）+ mono 元数据只读 + "取消" / "确认归档"
**And** 200 字符上限实时显示
**And** submit via `useFormState` 调 archiveEntry

**Given** Empty State 接入
**When** EmptyState "归档第一份" 按钮被点击
**Then** 触发隐藏 `<input type="file" accept=".html,.htm" />`
**And** 选中文件流程同 drop

**Given** 归档中状态
**When** 点击 "确认归档"
**Then** modal 按钮 disabled + 文字 "上传中……"
**And** **不显示 spinner 圈或百分比**

**Given** 归档成功
**When** archiveEntry returns `{ ok: true, data: { id } }`
**Then** modal 关闭
**And** `router.push('/entry/' + id)` 跳转 Full Render (Story 2.3 接入)

**Given** 归档失败
**When** Server Action returns `{ ok: false, error }`
**Then** modal 底部 inline error message（error.message 文案）
**And** 主按钮变 "重试"
**And** **不残留半个 Entry**（事务性保证）

**Given** 后置验证
**When** alex 在 Drizzle Studio 看 entries 表
**Then** 新 row 含正确 title / archived_at / original_filename / size_bytes / r2_object_key
**And** R2 dashboard 在 `entries/{userId}/{entryId}.html` 看到对象

**Implementation Notes**:
- File 转字符串：`await file.text()` (UTF-8)
- Server Action 默认 body limit 1MB，需在 `next.config.ts` 调 `experimental.serverActions.bodySizeLimit` 到 10MB+
- extract-title 在 client 调用即可（已平移）

## Story 2.3: Full Render 基础 + 归档跳转衔接

As alex,
I want a dynamic /entry/[id] page that fetches the Entry's HTML from R2 via a Route Handler proxy and renders it inside a sandboxed iframe with simplified Top Chrome,
So that immediately after archiving, I see the file rendered with the protective sandbox preventing it from accessing MindPrint's session.

**Acceptance Criteria:**

**Given** db query
**When** 我在 `lib/db/queries.ts` 加 `getEntryById(id: string): Promise<Entry | null>`
**Then** 用 Drizzle `db.select().from(entries).where(eq(entries.id, id))` 单行查询

**Given** dynamic route
**When** 我创建 `web/app/entry/[id]/page.tsx` (Server Component)
**Then** 接收 `{ params: Promise<{ id: string }> }`
**And** `await requireAlex()` 第一行
**And** `await getEntryById(id)`; null → `notFound()`
**And** 渲染 `<FullRender entry={entry} />`

**Given** FullRender Server Component
**When** 我更新 `web/components/FullRender.tsx`
**Then** layout：
- Top: `<FullRenderTopChrome entry={entry} />`
- Main: `<iframe src={"/api/entry/" + entry.id + "/html"} sandbox="" className="w-full h-full" title={`${entry.title} 完整渲染`} />`
- Footer: mono-metadata "Esc 返回时间线"
**And** iframe **必须**有 `sandbox=""` 空属性
**And** **禁** `sandbox="allow-*"`
**And** iframe **必须**有 `title` 属性 (a11y)

**Given** FullRenderTopChrome
**When** 我创建 `web/components/FullRenderTopChrome.tsx`
**Then** layout：左 `<Link href="/" aria-label="返回时间线">←</Link>` + 中 `<h1>{title}</h1>` headline-sm + `<time>{absoluteTime}</time>` mono-metadata + 右留空（Story 3.4 / 4.1 加入按钮）
**And** 1px dust 底边

**Given** HTML 代理
**When** 我创建 `web/app/api/entry/[id]/html/route.ts`
**Then** GET handler:
1. Try `await requireAlex()` catch → `return new Response(null, { status: 401 })` (NFR-2 空 body)
2. `const { id } = await params`
3. `const entry = await getEntryById(id)`; null → 404
4. `const r2Response = await fetchEntryHtml(entry.r2ObjectKey)`
5. Return Response with body stream + Content-Type `text/html; charset=utf-8`

**Given** error boundary
**When** 我创建 `web/app/entry/[id]/error.tsx` ('use client')
**Then** 渲染 "渲染未能完成。" + "Entry 仍在档案库中。" + `<Link href="/">返回时间线</Link>` + "下载原文件"占位（Epic 4 接入 disabled）

**Given** loading
**When** 我创建 `web/app/entry/[id]/loading.tsx`
**Then** surface-container-low 占位 + caption "正在加载……"

**Given** 归档→Full Render 衔接
**When** Story 2.2 的 archiveEntry 成功 + `router.push('/entry/' + id)`
**Then** alex 在 ≤ 1 跳转看到 Entry 完整渲染（FR-3 满足）
**And** 浏览器 ← 返回主屏（仍 Empty State，Epic 3 才接入）
**And** 刷新 `/entry/{id}` URL → Entry 仍可见（持久化）

**Given** NFR-1 沙箱化验证
**When** 测试 HTML 含 `<script>document.cookie</script>` 或 `<script>parent.location='https://attacker.com'</script>`
**Then** iframe 内 script **不执行**（sandbox 空属性阻 script）

**Given** 401 验证
**When** 未登录浏览器直接访问 `/api/entry/<some-uuid>/html`
**Then** 返回 401 + 空 body（**不返回 404**，避免泄露 Entry 是否存在）

**Implementation Notes**:
- Next.js 16 `params` 是 Promise → 必须 `await params`
- iframe src 指向 Route Handler 而非 R2 直连——避免签名 URL 入 DOM
- iframe `sandbox=""` + same-origin src → iframe 获得 opaque origin → cookie/localStorage 隔离

---
