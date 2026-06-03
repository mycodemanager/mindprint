---
baseline_commit: 678c349f5f5eb2afc45e286d7e6ce3143e0d6eba
---

# Story 2.2: 归档链路（Dropzone + ArchiveModal + archiveEntry Server Action）

Status: review

<!-- Epic 2 第二个 story。把 2.1 的 R2 helper 接上 UI：拖入 .html → 预览编辑标题 → 事务性归档（R2+DB，失败回滚）。纯代码 story（无 ops），但完整链路验证需浏览器（登录 + 拖拽），见 Dev Notes 测试节。 -->

## Story

As alex,
I want 把 .html 文件拖到 MindPrint、看到元数据预览 + 可编辑标题、确认后事务性持久化,
so that 我能低摩擦地放入新的思考产物,并相信不会留下半个残缺状态。

## Acceptance Criteria（源自 Epic 2 Story 2.2）

**AC1 — Zod schemas（`lib/entry/schemas.ts`，client+server 共享）**
- `ArchiveInputSchema`：`filename`（以 `.html`/`.htm` 结尾，大小写不敏感）、`sizeBytes`（int，≤ 10·1024·1024）、`htmlContent`（string）、`titleOverride`（min 1 / max 200）。
- `UpdateTitleInputSchema`：`id`（uuid）+ `title`（1–200）。（本 story 仅定义；用于 Epic 4，先建好共享。）

**AC2 — archiveEntry Server Action（`app/_actions/archive.ts`）**
- `'use server'` 顶部；`export async function archiveEntry(input): Promise<ActionResult<{ id: string }>>`：
  1. `await requireAlex()` —— 第一行（抛 `UNAUTHORIZED` 即由 Next 处理，**不**包进 ActionResult）。
  2. 解析 userId（见 Dev Notes「userId 来源」）。
  3. Zod 校验失败 → `{ ok:false, error:{ code, message } }`（message 走 voice.ts 文案）。
  4. `entryId = randomUUID()`；`r2ObjectKey = 'entries/' + userId + '/' + entryId + '.html'`。
  5. `await uploadEntryHtml(r2ObjectKey, htmlContent)`（2.1 已就位）。
  6. `try { await db.insert(entries).values({...}) }`。
  7. `catch` DB 失败 → `await deleteEntryHtml(r2ObjectKey)`（**应用层补偿回滚**）→ `{ ok:false, error:{ code:'DB_ERROR' } }`。
  8. `revalidatePath('/')` + `revalidatePath('/entry/' + entryId)`。
  9. `return { ok:true, data:{ id: entryId } }`。

**AC3 — deleteEntryHtml helper（`lib/r2/delete.ts`，新建）**
- `export async function deleteEntryHtml(key: string): Promise<void>`，用 `DeleteObjectCommand`，`[r2]` 日志。供 archiveEntry 回滚 + Epic 4 删除复用。

**AC4 — Dropzone 全屏拖拽（`components/Dropzone.tsx`，扩充现占位空壳）**
- `'use client'`；整屏 `window` drag listener（dragenter / dragover / dragleave / drop）。
- 拖拽悬停 → overlay：`surface-container-high` 背景 + `primary` 实线边 + 中央 `COPY.archive.dropOverlay`（新增，如「放下以归档。」）。
- drop / 选文件 → `handleFile`：三层校验（扩展名 `.html`/`.htm`、大小 ≤ 10MB、单文件），失败 `setErrorBanner`（voice 文案）。
- error banner `role="alert"`，显示 ~4 秒后自动消失。
- 仍提供隐藏 `<input type="file" accept=".html,.htm">`（供 EmptyState CTA 触发）。

**AC5 — ArchiveModal Upload Preview Form（`components/ArchiveModal.tsx`，填充现占位空壳）**
- `'use client'`；居中 modal（参考 `prototype/pwa-explore/components/ArchiveModal.tsx` 的结构/视觉）：缩略占位 + Label「标题」+ 下划线 Input（预填 `extractTitle(content, filename)`）+ mono 只读元数据（file/size/archived）+「取消」/「确认归档」。
- `file.text()`（UTF-8）读内容；标题 200 字符上限 + 实时 `{n}/200` 计数。
- 提交经 `onConfirm(title, htmlContent)`（promise）；**所有文案走 voice.ts**（按钮 pending 文字用 `COPY.archive.uploading` = 「上传中……」，**非**原型的「归档中…」）。

**AC6 — EmptyState 接入（`components/EmptyState.tsx`）**
- 「归档第一份」CTA 被点击 → 触发隐藏 file input（打开系统文件选择器）。
- 选中文件流程同 drop（同一 `handleFile`）。

**AC7 — 归档中状态**
- 点「确认归档」→ modal 按钮 disabled + 文字「上传中……」。
- **不显示** spinner 圈 / 百分比（EXPERIENCE.md voice：克制工具）。

**AC8 — 归档成功**
- archiveEntry 返回 `{ ok:true, data:{ id } }` → modal 关闭 → `router.push('/entry/' + id)`。
- ⚠️ `/entry/[id]` 页 **Story 2.3 才建**：本 story 跳转会落到尚未存在的页（404）—— 这是 epic 排序的预期。Entry 已持久化(刷新主屏数据已在 DB+R2)。

**AC9 — 归档失败（事务性保证）**
- archiveEntry 返回 `{ ok:false, error }` → modal 底部 inline error（`error.message`）+ 主按钮变「重试」。
- **不残留半个 Entry**：R2 已传但 DB 失败时已 `deleteEntryHtml` 回滚 → 无孤儿对象、无孤儿 DB 行。

**AC10 — 后置验证**
- Drizzle Studio `entries` 表新行含正确 `title` / `archived_at` / `original_filename` / `size_bytes` / `r2_object_key` / `user_id`。
- R2 dashboard 在 `entries/{userId}/{entryId}.html` 看到对象。

**AC11 — Server Action body 上限**
- `next.config.ts` 设 `experimental.serverActions.bodySizeLimit`（≥ 容纳 10MB 文件经序列化，见 Dev Notes）。

## Tasks / Subtasks

> 纯 `[code·dev]` story。顺序：先后端（schema → delete helper → action + config）再前端（组件 → 衔接），最后验证。

- [x] **T1 Zod schemas**（AC1）
  - [x] `web/lib/entry/schemas.ts`：`ArchiveInputSchema` + `UpdateTitleInputSchema`（zod v4；filename `/\.html?$/i`；sizeBytes int max 10MB；titleOverride trim 1–200；`UpdateTitleInputSchema` 用 `z.uuid()`）。**无 server-only → client 可 import**。
  - [x] 导出 `type ArchiveInput`。
- [x] **T2 deleteEntryHtml**（AC3）
  - [x] `web/lib/r2/delete.ts`：server-only + `DeleteObjectCommand` + `r2Client` + `[r2]` 日志。
- [x] **T3 archiveEntry Server Action**（AC2）
  - [x] `web/app/_actions/archive.ts`：`'use server'`，九步齐。
  - [x] userId：`session.user.email` → 查 `users` 取 id（不动 auth）。
  - [x] **未用 `db.transaction()`**；upload→insert→catch:`deleteEntryHtml` 应用层补偿（回滚失败再 catch 记孤儿）。
  - [x] 错误 message 经 `mapValidationError` + voice.ts。
- [x] **T4 next.config bodySizeLimit**（AC11）
  - [x] `experimental.serverActions.bodySizeLimit: '16mb'` + 坑注释。
- [x] **T5 voice.ts 扩充**（AC4/5/9）
  - [x] 增补 `dropOverlay/modalTitle/titleLabel/confirmCta/retry/errInvalidType/errTooLarge/errMultiple/errTitle/errRead/errGeneric`（合 voice 铁律）。
- [x] **T6 Dropzone 全屏拖拽**（AC4）
  - [x] `Dropzone.tsx`：window 拖拽监听（enter/over/leave/drop + 计数防抖）+ primary 实线 overlay + dropOverlay 文案。校验/错误横幅上移到 ArchiveFlow 统一持有（drop 与 CTA 同一校验）。
- [x] **T7 ArchiveModal Upload Preview Form**（AC5/7）
  - [x] `ArchiveModal.tsx`（参考 prototype；copy 全走 voice.ts；`@/lib/entry/extract-title`；pending 用 `COPY.archive.uploading`；DESIGN token 类）。
- [x] **T8 客户端编排 + EmptyState 衔接**（AC6/8/9）
  - [x] `components/ArchiveFlow.tsx`（'use client'）：selectedFile/error 态 + 三层校验 + 隐藏 input + Dropzone + ArchiveModal + Context（openFilePicker）；onConfirm 调 archiveEntry → 成功 `router.push`、失败 throw。
  - [x] `components/ArchiveCtaButton.tsx`（'use client'，Context 消费）；EmptyState CTA 换为它（server 渲染 client 子组件）。
  - [x] `app/page.tsx` 用 `<ArchiveFlow>` 包 `<main id="main">`（全屏拖拽 + CTA context 生效）。
- [ ] **T9 验证**（AC10）
  - [x] `npm run typecheck` + `npm run lint` 绿。
  - [x] RSC 边界经分析正确（client 未泄漏 server-only；'use server' 仅作 RPC 导入）。
  - [ ] ⛔ `next build` 本机被**已知字体 gstatic flake** 阻断（报错全在 `app/layout.tsx` 字体，非归档代码）→ 由 **Vercel 构建**权威验证（push main 时）。
  - [ ] ⛔ 认证态归档全链路实测（登录 + 拖入 .html + 确认 → Drizzle Studio + R2 dashboard）—— **需 alex 登录**（magic link 无法自动化）或浏览器工具协助驱动。

## Dev Notes

### 本 story 边界
- **做**：拖拽→预览→归档→持久化的完整写链路 + R2 删除 helper。
- **不做**：`/entry/[id]` Full Render 页 + HTML 代理 route + 沙箱 iframe → **Story 2.3**；时间线网格渲染 → Epic 3；编辑/下载/删除 UI → Epic 4。`UpdateTitleInputSchema` 本 story 只定义不接线。

### 🚨 neon-http 无事务（deferred 点名，必读）
- `db.transaction()` 在 `drizzle-orm/neon-http` 运行时**直接抛错**（[deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)，已核源码）。
- 归档回滚**必须**用**应用层补偿**：`uploadEntryHtml` → `try db.insert` → `catch` 里 `deleteEntryHtml(key)` 手动回滚。**绝不**用 `.transaction()` 或 `.batch()` 包这俩（R2 不在 DB 事务内）。AC2 第 6–7 步即此模式。

### userId 来源（关键，archiveEntry 必需）
- `entries.userId`（FK）+ r2 key `entries/{userId}/...` 都需要 alex 的 user id。
- `lib/auth/config.ts` **没有 session 回调** → `session.user.id` 不保证存在。**最稳方式（不动 auth）**：
  ```ts
  const session = await requireAlex();           // session.user.email 鉴权后必有
  const [u] = await db.select({ id: users.id }).from(users)
                      .where(eq(users.email, session.user.email!));
  if (!u) return { ok:false, error:{ code:'INTERNAL_ERROR', message: '…' } };
  const userId = u.id;
  ```
- 替代（更长期但动 auth）：给 config.ts 加 `session({ session, user }) { session.user.id = user.id; return session; }`。本 story **推荐前者**（单用户、零 auth 改动、1.3 已审过的鉴权不动）。

### Server/Client 边界 + EmptyState 衔接（防 RSC 踩坑）
- `EmptyState.tsx` 是 **Server Component**，CTA 现无 handler。全屏拖拽监听需 app 级常驻 client 组件。
- **推荐结构**：
  - 新建 `components/ArchiveFlow.tsx`（`'use client'`）= 编排器：持 `selectedFile`/`error` 态 + window 拖拽监听（或内嵌 `<Dropzone>`）+ 隐藏 file input + 条件渲染 `<ArchiveModal>` + 提供「打开文件选择器」能力。
  - EmptyState CTA 连到编排器:用 React Context（ArchiveFlow 提供 `openFilePicker`，CTA 做成小 client 组件 `ArchiveCtaButton` 消费）—— Server 组件可渲染 Client 子组件。**别**用 `document.getElementById` 硬连。
  - `app/page.tsx`（Server）渲染 `<ArchiveFlow>`（含 provider）包住 `<main><EmptyState/></main>`，使拖拽全屏生效 + CTA 能触发。
- dev 有命名/组织自由,但务必:① 'use client' 只在交互叶子;② 全屏 drag 常驻;③ CTA 与拖拽走同一 `handleFile`。

### ArchiveModal：promise+useState，不用 useFormState/useActionState
- 模态用 **promise + 本地 state**（参考 prototype）：`onConfirm` 返回 promise;`handleConfirm` `setSubmitting(true)` → `await onConfirm()` → catch 设 error。pending 态驱动按钮 disabled + 「上传中……」。**无需** form action / useFormState。
- 编排器的 `onConfirm`：`const r = await archiveEntry(input); if (r.ok) router.push('/entry/'+r.data.id); else throw new Error(r.error.message);` —— 把 ActionResult 错误转 throw 给模态 catch 显示。
- ⚠️ 若 dev 坚持用表单:React 19 是 **`useActionState`（from 'react'）**,架构文档写的 `useFormState`（react-dom）**已改名作废**;按钮 pending 用 `useFormStatus`（react-dom）。本 story 用不到,知道即可。

### Server Action body 上限（AC11）
- Next 16 默认 Server Action body 限 **1MB** → 10MB HTML 会被拒。设：
  ```ts
  // next.config.ts
  const nextConfig: NextConfig = {
    experimental: { serverActions: { bodySizeLimit: '16mb' } },
  };
  ```
- 取 `'16mb'`（非 10mb）：htmlContent 作为 Server Action 参数序列化,CJK/多字节会膨胀,10MB 文件序列化后可能超 10MB;留足余量。
- ⚠️ 已知坑([vercel/next.js #77505](https://github.com/vercel/next.js/discussions/77505)):个别版本 bodySizeLimit 在**生产**被忽略。上线后若大文件归档在 Vercel 报 body 超限,查此 issue。

### 数据写入细节
- `file.text()` 得 UTF-8 字符串作 htmlContent。`sizeBytes = file.size`（文件字节数）。
- `db.insert(entries).values({ id: entryId, userId, title: titleOverride, originalFilename: filename, sizeBytes, r2ObjectKey })`;`archivedAt`/`createdAt` 用 schema 的 `defaultNow()`,**不手动传**。
- entries 表见 [schema.ts](web/lib/db/schema.ts):`r2ObjectKey` 有 `.unique()` —— randomUUID 保证不撞。
- 双层校验铁律:client（Dropzone handleFile 早反馈）+ server（archiveEntry Zod 重校验,绝不信客户端）。共享 `ArchiveInputSchema`。

### 来自 Story 2.1 的就绪件（previous story intelligence）
- ✅ `lib/r2/upload.ts` `uploadEntryHtml(key, body)` 已就位且**实测**可用(checksum 配置规避 R2 坑)。
- ✅ `lib/r2/client.ts` `r2Client`、`lib/r2/fetch.ts`（2.3 用）。`delete.ts` 本 story 新建,模式照 upload.ts(server-only + r2Client + Command + `[r2]` 日志)。
- ✅ `lib/env.ts` R2_* 已必需且 Vercel 已填(2.1)。`@aws-sdk/client-s3` 已装。
- ✅ `extractTitle`（[extract-title.ts](web/lib/entry/extract-title.ts)）已实现,client 可调。
- ✅ `ActionResult`/`ActionErrorCode`（[types.ts](web/lib/entry/types.ts)）已定义。`requireAlex()`（[require-alex.ts](web/lib/auth/require-alex.ts)）抛 `UNAUTHORIZED`。
- ✅ voice.ts 已有 `archive.uploading/failed/success`、`ui.cancel/confirm/archive`;本 story 增补拖拽/校验文案。
- ⚠️ 已知非阻塞:AWS SDK 2027-01 后需 Node≥22(deferred-work)。

### git intelligence
- 最近 `678c349`(Story 2.1)已在 main。本 story 直接在 **main 提交并推送**(memory [git-setup](../../../../.claude/projects/-Users-alex-Developer---------my-bmad-app/memory/git-setup.md):alex 明确不建分支)。推 main 前确认 Vercel env 齐全(2.1 R2 已填,本 story 无新增必需 env)。
- commit message 末尾带 `Co-Authored-By: Claude Opus 4.8 (1M context)` trailer。

### 测试 / 验证（本 story 特性：需浏览器）
- `npm run lint` + `npm run typecheck`：dev 必跑绿。
- archiveEntry **无法**用独立脚本测(`requireAlex` 需请求上下文/cookies)。完整链路验证走 `next dev` + 浏览器:登录 → 拖入一份 .html(或点 CTA 选文件)→ 见 modal 预填标题 → 改标题 → 确认 → 按钮「上传中……」→ 成功(会跳 `/entry/[id]` 404,预期)→ 回主屏。
- 查证:Drizzle Studio(`npx drizzle-kit studio`)看 entries 新行 + R2 dashboard 看对象。
- 失败路径:可临时令 DB 失败(如断网/改连接串)验证「R2 已传但 DB 失败 → 对象被 deleteEntryHtml 回滚、无残留」。
- dev-story 阶段可用 preview/浏览器工具实际驱动该流程(本机 dev server)。

### Project Structure Notes
- 新增:`lib/entry/schemas.ts`、`lib/r2/delete.ts`、`app/_actions/archive.ts`、`components/ArchiveFlow.tsx`（+ 可选 `ArchiveCtaButton.tsx`）。
- 修改:`components/Dropzone.tsx`、`components/ArchiveModal.tsx`、`components/EmptyState.tsx`、`app/page.tsx`、`next.config.ts`、`lib/voice.ts`。
- 与架构目录一致(`app/_actions/` 下划线非路由;`lib/r2/delete.ts` 补齐 Data Boundaries 的「删除两边联动」)。

### References
- Epic 2 Story 2.2 原文:[epic-2-归档第一份-entryfirst-archive.md](_bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/epic-2-归档第一份-entryfirst-archive.md#story-22-归档链路dropzone--archivemodal--archiveentry-server-action)
- Server Action / 错误契约 / 双层校验 / 日志格式:[implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md)
- 归档数据流 + 组件边界:[project-structure-boundaries.md](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md)
- ArchiveModal UX 参考实现:`prototype/pwa-explore/components/ArchiveModal.tsx`
- neon-http 无事务 / 空串等延后项:[deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)
- Next 16 bodySizeLimit:`node_modules/next/dist/docs/01-app/.../serverActions.md` · React 19 useActionState（替代 useFormState）

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (1M context) · 2026-06-03

### Debug Log References

- `npm run typecheck`：0 错误。`npm run lint`：0 错误。
- `npm run build`（本机，2 次）：失败于 `app/layout.tsx` 的 `next/font/google` CJK 字体从 fonts.gstatic.com 下载（`Module not found: @vercel/turbopack-next/internal/font/google/font`，不同字体分块）—— deferred-work 已记的本机字体 flake，**非归档代码**；Vercel 网络可靠会构建通过。不再耗时重试。

### Completion Notes List

**已完成（代码 + 静态验证）：**
- T1–T8：schemas / delete helper / archiveEntry / next.config / voice / Dropzone / ArchiveModal / ArchiveFlow + ArchiveCtaButton + EmptyState 接线 + page 挂载。
- 关键决策落地：① neon-http 无事务 → upload→insert→catch:`deleteEntryHtml` 应用层补偿；② userId 经 `session.email` 查 users（不动 auth）；③ server/client = `ArchiveFlow`(client) Context 提供 `openFilePicker`，`EmptyState`(server) 渲染 `ArchiveCtaButton`(client) 消费；④ modal 用 promise+useState（非 useFormState）；⑤ 文案全走 voice.ts。
- typecheck + lint 绿；RSC 边界经分析正确（client 未引 server-only；archiveEntry `'use server'` 仅作 RPC 导入）。

**待验证（不阻塞代码 review）：**
- ⛔ `next build`：本机字体 flake 阻断（非代码）→ **Vercel 权威构建**（push main 时）。
- ⛔ 认证态归档全链路（登录 + 拖拽 + 确认 → Drizzle Studio + R2 查证）：需 alex 登录实测或浏览器工具协助。**AC8 跳转 `/entry/[id]` 会 404**（Story 2.3 才建该页，预期）。

### File List

**新增：**
- `web/lib/entry/schemas.ts`
- `web/lib/r2/delete.ts`
- `web/app/_actions/archive.ts`
- `web/components/ArchiveFlow.tsx`
- `web/components/ArchiveCtaButton.tsx`

**修改：**
- `web/components/Dropzone.tsx`（占位空壳 → 全屏拖拽 + overlay）
- `web/components/ArchiveModal.tsx`（占位空壳 → Upload Preview Form）
- `web/components/EmptyState.tsx`（CTA → `ArchiveCtaButton`）
- `web/app/page.tsx`（挂载 `ArchiveFlow`）
- `web/next.config.ts`（`serverActions.bodySizeLimit: '16mb'`）
- `web/lib/voice.ts`（归档微文案）

## Senior Developer Review (Codex)

**Reviewer**: Codex CLI v0.130.0（gpt-5.5, xhigh）· 2026-06-03 · 对抗式（未提交改动全量）
**Outcome**: 6 findings（4 P2 + 2 P3），**全部已修复并复验**（typecheck + lint 绿）。无 High/P1。

### Action Items
- [x] **[P2] server 端按真实内容字节校验** — `app/_actions/archive.ts`：原仅校验客户端 `sizeBytes`（可伪造小值塞超大 `htmlContent`）。改为 `Buffer.byteLength(htmlContent,'utf8')` 实测（>10MB 拒）+ 据此写库 `sizeBytes`（元数据准确）。
- [x] **[P2] 防换文件时旧 `file.text()` 迟到串档** — `ArchiveModal.tsx` useEffect 加 `ignore` 旗标 + `ArchiveFlow` 给 modal 按文件身份加 `key`（换文件重挂载，state 重置）。
- [x] **[P2] 初始 extractTitle 夹到 200** — `ArchiveModal.tsx`：`extractTitle(...).slice(0,200)`，避免超长标题初始即超限但按钮可点 → 提交报通用错。
- [x] **[P2] 回滚失败更稳健** — `archive.ts`：R2 回滚删除重试 2 次 + 双失败显式告警孤儿；彻底的 bucket↔DB 对账 sweeper 记入 `deferred-work.md`（Epic 4 / 4.5）。
- [x] **[P3] 0 字节文件不再卡死** — `ArchiveModal.tsx`：提交守卫改用 `reading` 态（非 `!htmlContent`），允许空内容归档。
- [x] **[P3] 失败后按钮显示「重试」** — `ArchiveModal.tsx`：error 态下按钮文字用 `COPY.archive.retry`（AC9）。

### Re-verification（2026-06-03）
- `npm run typecheck` + `npm run lint`：均通过。
- `next build` 仍受本机 fonts.gstatic CJK 字体 flake 阻断（非归档代码）→ Vercel 权威构建。
- 认证态归档全链路（登录 + 拖拽 + 确认 → 持久化）待 alex 登录实测或浏览器工具协助。
