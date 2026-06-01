# Epic 4: Entry 管理 + 上线就绪（Entry Management & Production Readiness）

**Epic Goal**：实现 Entry 事后管理动作（编辑标题 / 下载 / 删除），并把 MindPrint 推到 production-ready 状态——自定义域名、跨服务备份兜底、自然访问度量、CI 防线。完成后 alex 能完整运营 MindPrint 作为长期个人档案库。

**Implementation Scope**：
- InlineTitleEditor 组件（`'use client'`，Notion 风格——单击进入 edit 态，blur/Enter 保存，Esc 撤销）
- updateEntryTitle Server Action（含 Zod 200 字符校验 + revalidatePath）
- MoreMenu 组件（`'use client'`，⋯ dropdown：编辑标题 / 下载原 .html / 删除（destructive））
- Download Route Handler（`/api/entry/[id]/download`）—— 生成 R2 presigned URL（300s TTL）+ 302 redirect + Content-Disposition filename 处理（中文兼容 + 非法字符替换）
- `lib/r2/download.ts` 的 generateSignedDownloadUrl 函数
- ConfirmDeleteDialog 组件（`'use client'`，"确认删除？" + "删除后无法恢复。" + 取消 / 删除按钮）
- deleteEntry Server Action（DB DELETE + R2 DeleteObject + revalidatePath + 返回时间线）
- 自定义域名配置（绑定 Vercel project + Cloudflare DNS CNAME）
- GitHub Actions CI workflow（`.github/workflows/ci.yml`）—— PR / push 触发 lint + typecheck
- `mindprint-backups` 独立 R2 bucket + 独立 IAM 凭据
- 周期备份脚本（`scripts/backup.ts`）+ GitHub Actions cron workflow（`backup.yml`，周日 02:00 UTC）
- Vercel Web Analytics 接入（`@vercel/analytics/next` + `<Analytics />` 挂载到 layout）
- SM-1 计量实现（基于 session 的 30 分钟去重访问记录——不入 DB，避免污染业务数据）
- 部署文档（README + Runbook）
- `.env.example` 提交到 git
- ESLint 自定义规则（禁 Server Action 内 throw / 禁 iframe 无 sandbox 属性等 anti-pattern）

**FRs covered**: **FR-7**
**NFRs covered**: **NFR-3 数据持久 hard requirement** + NFR-2 资源层（presigned URL + 备份 bucket 隔离）
**Additional Reqs**: CI/CD + 备份 + Analytics + 自定义域名 + 文档
**UX-DRs covered**: UX-DR14（Inline Title Editor）+ UX-DR16（More Menu）+ UX-DR17（Confirm Dialog）

**Standalone Test**：alex 在 Full Render 视图 → 单击标题进入 inline edit → 改名 + Enter → 时间线卡片标题同步更新 → 单击 ⋯ → 选"下载" → 浏览器下载 .html 文件（字节级别与原上传一致）→ 选"删除" → 二次确认 → 删除后跳回时间线（该 Entry 已消失）→ 周一早上检查 GitHub Releases 看到周日 02:00 UTC 自动生成的备份包。

## Story 4.1: 编辑标题（Inline editor + updateEntryTitle + MoreMenu 框架）

As alex,
I want to single-click the title in Full Render to edit it inline (Notion-style: blur or Enter saves, Esc reverts), and a placeholder ⋯ More menu I'll fill with download/delete next,
So that I can fix bad auto-extracted titles without leaving Full Render view.

**Acceptance Criteria:**

**Given** InlineTitleEditor
**When** 我创建 `web/components/InlineTitleEditor.tsx` (`'use client'`)
**Then** 接收 `{ entryId, initialTitle }`
**And** 两种状态：
- 静态：`<h1 onClick={() => setEditing(true)} className="cursor-text">{title}</h1>` headline-sm 衬线
- 编辑：`<input value={...} onBlur={save} onKeyDown={Enter→save, Esc→cancel} autoFocus maxLength={200} className="font-serif text-headline-sm bg-transparent border-b border-primary outline-none" />` 文本初始全选
**And** save 调 `updateEntryTitle({ id, title })` Server Action
**And** save 期间 input disabled + "保存中…" indicator
**And** 失败 → inline error message，编辑态保留
**And** 成功 → 退出编辑

**Given** updateEntryTitle Server Action
**When** 我创建 `web/app/_actions/update-title.ts`
**Then** `'use server'`
**And** exports `async function updateEntryTitle(input): Promise<ActionResult<void>>`：
1. `await requireAlex()`
2. Zod 校验 UpdateTitleInputSchema → 失败 `{ ok: false, error: { code: 'INVALID_TITLE_LENGTH' } }`
3. Try `db.update(entries).set({ title }).where(eq(id))`
4. Catch → `[update-title] db error` log + `{ ok: false, error: { code: 'DB_ERROR' } }`
5. `revalidatePath('/')` + `revalidatePath('/entry/' + id)`
6. Return `{ ok: true, data: undefined }`

**Given** MoreMenu 框架
**When** 我创建 `web/components/MoreMenu.tsx` (`'use client'`)
**Then** `<button aria-label="更多操作" aria-haspopup="menu" aria-expanded={open}>⋯</button>`
**And** 点击 toggle open
**And** open 时 dropdown：
- `<button role="menuitem" disabled>编辑标题</button>` 占位（提示"单击标题直接编辑"）
- `<button role="menuitem" disabled>下载 {originalFilename}</button>` 占位（Story 4.2 接入）
- `<button role="menuitem" disabled className="text-secondary">删除</button>` 占位（Story 4.3 接入）
**And** Esc / 点击外部关闭
**And** focus trap 在 menu 内

**Given** FullRenderTopChrome 接入
**When** 我更新 `web/components/FullRenderTopChrome.tsx`
**Then** 标题区改 `<InlineTitleEditor entryId={entry.id} initialTitle={entry.title} />`
**And** 右侧加 `<MoreMenu entry={entry} />`

**Given** 编辑场景
**When** alex 在 Full Render 单击标题 → 输入新标题 → Enter
**Then** Server Action 成功 → 标题 chrome 立即更新
**And** 返回时间线 → 卡片标题同步（revalidatePath 生效）
**And** 归档时间戳**不变**

**Given** 边界
**When** alex 输入空 或 > 200 字符 → Enter
**Then** inline error "标题长度需在 1–200 字符之间。"
**And** input 保持 focus

**Implementation Notes**:
- focus trap：Tab 不出 menu，Shift+Tab 不出 menu
- 编辑态 input 全选：`onFocus={(e) => e.currentTarget.select()}`

## Story 4.2: 下载原 .html

As alex,
I want a "Download" item in More menu that streams the original .html with current display title as filename (Chinese-compatible) and original byte content preserved,
So that I can take any single Entry back to local at any moment.

**Acceptance Criteria:**

**Given** generateSignedDownloadUrl
**When** 我创建 `web/lib/r2/download.ts`
**Then** exports `async function generateSignedDownloadUrl(key: string, ttlSeconds: number): Promise<string>` 用 `@aws-sdk/s3-request-presigner` 的 `getSignedUrl` + `GetObjectCommand` + `expiresIn`

**Given** Download Route Handler
**When** 我创建 `web/app/api/entry/[id]/download/route.ts`
**Then** GET handler:
1. Try `await requireAlex()` catch → 401 空 body
2. `const { id } = await params`
3. `const entry = await getEntryById(id)`; null → 404
4. `const signedUrl = await generateSignedDownloadUrl(entry.r2ObjectKey, 300)` (5 min TTL)
5. 计算 filename：entry.title sanitized (中文保留，`\\/:*?"<>|` 替换 `_`，连续 `_` 合并) + `.html`
6. **方案 B**：服务端代理流式 + 添加 Content-Disposition：fetch signedUrl → 转 Response with `headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}` }`

**Given** MoreMenu 接入下载
**When** 我更新 `web/components/MoreMenu.tsx`
**Then** "下载" item 变 `<a href={`/api/entry/${id}/download`} role="menuitem" onClick={() => setOpen(false)}>下载 {originalFilename}</a>`
**And** 单击直接触发浏览器下载

**Given** 下载场景
**When** alex 在 Full Render → ⋯ → "下载"
**Then** 浏览器下载文件名 "{当前显示标题}.html" 含中文字符正确
**And** 下载内容**字节级别等同于**归档时上传的原文件
**And** **不污染浏览器历史**

**Given** 文件名边界
**When** 标题 "MindPrint v3 / 终版 < beta >"
**Then** 文件名 sanitize 后 "MindPrint v3 _ 终版 _ beta _.html"（多个连续 `_` 合并）

**Given** 401 / 404
**When** 未认证 → 401 空 body；entry 不存在 → 404
**Then** 浏览器 download 失败，不暴露内部细节

**Implementation Notes**:
- Content-Disposition `filename*=UTF-8''<encoded>` 是 RFC 5987 跨浏览器支持中文
- 选方案 B 原因：R2 presigned URL 不能 override response headers + 302 跳转后 signed URL 入浏览器历史；方案 B 同时解决两点
- presigned URL 5 分钟 TTL 是 NFR-2 资源层保护

## Story 4.3: 永久删除（ConfirmDeleteDialog + deleteEntry）

As alex,
I want a "Delete" item in More menu opening a hard confirmation dialog before permanently removing the Entry from both DB and R2,
So that I can clean up misarchived entries without risk of accidental deletion.

**Acceptance Criteria:**

**Given** ConfirmDeleteDialog
**When** 我创建 `web/components/ConfirmDeleteDialog.tsx` (`'use client'`)
**Then** 居中 modal（surface-container-high + rounded.lg + shadow.menu）
**And** 内容：title display-lg "确认删除？" + body body-lg "将永久删除「{title}」。删除后无法恢复。" + 右对齐按钮 Secondary "取消" + Destructive "删除"
**And** 关闭：× / Esc / 点击遮罩
**And** focus 进入时聚焦 "取消"（防意外 Enter 误确认）

**Given** deleteEntry Server Action
**When** 我创建 `web/app/_actions/delete-entry.ts`
**Then** `'use server'`
**And** exports `async function deleteEntry(id: string): Promise<ActionResult<void>>`：
1. `await requireAlex()`
2. Zod 校验 id is UUID
3. `const entry = await getEntryById(id)`; null → `{ ok: false, error: { code: 'ENTRY_NOT_FOUND' } }`
4. Try `db.delete(entries).where(eq(id))`
5. Try `await deleteEntryHtml(entry.r2ObjectKey)`（即便失败也继续，DB 已删，孤儿对象 backup script 处理）
6. `revalidatePath('/')` + `revalidatePath('/entry/' + id)`
7. Return `{ ok: true }`

**Given** lib/r2/delete.ts
**When** 我创建 `web/lib/r2/delete.ts`
**Then** exports `async function deleteEntryHtml(key: string): Promise<void>` 用 `DeleteObjectCommand`

**Given** MoreMenu 接入删除
**When** 我更新 `web/components/MoreMenu.tsx`
**Then** "删除" item 可点击 `<button onClick={() => setShowConfirm(true)}>...删除</button>`
**And** showConfirm state 控制 ConfirmDeleteDialog 显示

**Given** 删除流程
**When** alex 在 Full Render → ⋯ → "删除" → dialog 弹出 → 点 "删除"
**Then** dialog 按钮 disabled + "删除中…"
**And** Server Action 成功 → `router.push('/')` 回时间线
**And** 该 Entry 不再出现
**And** Drizzle Studio 看 row 已删
**And** R2 dashboard 看对象已删

**Given** 取消
**When** "取消" / Esc / 点遮罩
**Then** dialog 关闭，无变更

**Given** Esc 优先级
**When** alex 在 Full Render（无 dialog） + Esc → 返回时间线
**When** ConfirmDialog 打开 + Esc → 仅关 dialog（不冒泡到 FullRenderKeyboard）
**Then** Esc 优先关最顶层 modal

**Implementation Notes**:
- dialog 用 native `<dialog>` 或自实现（注意 focus trap + scroll lock）
- R2 删除失败不回滚 DB 删除——hobby 接受偶发孤儿对象
- voice 严格："删除后无法恢复。" 不要 "你确定吗？此操作不可逆哦！"

## Story 4.4: 部署强化（自定义域名 + GitHub Actions CI + Vercel Analytics）

As alex,
I want my own custom domain pointing to MindPrint, a CI workflow ensuring code quality on every PR/push, and Vercel Web Analytics tracking my own access patterns for SM-1,
So that MindPrint feels like a permanent product I own, with quality safeguards and engagement measurement.

**Acceptance Criteria:**

**Given** 域名准备
**When** alex 在 CF DNS 加 CNAME 把 `mindprint.<alex-domain>` 指 Vercel
**Then** Vercel project 设置加该自定义域名
**And** Vercel 自动签 HTTPS 证书 ≤ 1 分钟

**Given** 自定义域名生效
**When** alex 访问 `https://mindprint.<alex-domain>`
**Then** 进入 signin 流程
**And** 旧 vercel.app 仍可访问

**Given** NEXTAUTH_URL 更新
**When** Vercel env vars NEXTAUTH_URL 更新到自定义域
**Then** redeploy 后 Magic Link 邮件链接指向自定义域
**And** session cookie 在自定义域下 + 多设备登录正常

**Given** GitHub Actions CI
**When** 我创建 `web/.github/workflows/ci.yml`
**Then** workflow：name CI / on push pull_request / ubuntu-latest / steps: checkout / setup-node@v4 node 20 / `cd web && npm ci` / `cd web && npm run lint` / `cd web && npm run typecheck`
**And** `web/package.json` scripts 含 `"lint": "next lint"` + `"typecheck": "tsc --noEmit"`

**Given** CI 跑通
**When** alex push PR 或 main
**Then** GitHub Actions tab 显示 CI 状态
**And** lint / typecheck 失败 PR check 红色

**Given** Vercel Analytics
**When** 我安装 `@vercel/analytics`
**Then** 入 dependencies

**Given** mount
**When** 我更新 `web/app/layout.tsx`
**Then** import + 挂载 `<Analytics />` from `@vercel/analytics/next` body 末尾
**And** Vercel dashboard Analytics tab 启用

**Given** SM-1 计量
**When** Server Component（timeline + Full Render）渲染
**Then** 服务端日志含 `[analytics] timeline-view <date>` / `[analytics] full-render <entry-id> <date>`
**And** 30 分钟内同一 session 重复访问只记一次（基于 cookie lastViewAt 时间戳判定，不入 DB）

**Given** privacy
**When** Vercel Analytics 配置
**Then** **不引入** GA / Plausible / 其他第三方追踪（SM-C2 反向指标）
**And** 数据仅供 M3 retro 评估，不驱动 UI 推送

**Implementation Notes**:
- 简单 SM-1 计量：cookie 存 `lastViewAt` 时间戳；访问时对比 < 30 分钟则不记
- 不需 DB 表存计量——`console.log` 写 Vercel logs，按需查
- CI workflow 注意 `working-directory: web`

## Story 4.5: 备份兜底 + 上线文档 + ESLint 自定义规则

As alex,
I want a weekly cross-service backup running unattended via GitHub Actions cron, a documented Runbook, and ESLint rules preventing common architectural anti-patterns,
So that NFR-3 hard requirement (data persistence) has cross-vendor disaster recovery, and AI agents on this codebase can't introduce silent security regressions.

**Acceptance Criteria:**

**Given** 备份 bucket
**When** alex 在 CF 创建 `mindprint-backups` bucket
**Then** public access disabled
**And** 独立 R2 API token：write to `mindprint-backups` + read from `mindprint-entries`
**And** GitHub Secrets 加 `R2_BACKUP_BUCKET_NAME`、`R2_BACKUP_ACCESS_KEY_ID`、`R2_BACKUP_SECRET_ACCESS_KEY`、`DATABASE_URL_READONLY`

**Given** 备份脚本
**When** 我创建 `web/scripts/backup.ts`
**Then** Node TS 脚本：
1. Connect Neon via DATABASE_URL_READONLY
2. Run `pg_dump` → `db.sql`
3. List R2 `mindprint-entries` 所有 objects via `ListObjectsV2Command` → `r2-inventory.json` (含 key + size + lastModified)
4. gzip 两个文件
5. Upload `db.sql.gz` + `r2-inventory.json.gz` 到 `mindprint-backups/backups/{YYYY-MM-DD}/`
6. 可选：`gh release create v{YYYY-MM-DD} ...` 创建 GitHub Release
**And** 失败 exit 非零，GitHub Actions 标红

**Given** cron workflow
**When** 我创建 `web/.github/workflows/backup.yml`
**Then** schedule `'0 2 * * 0'` (Sunday 02:00 UTC) + workflow_dispatch
**And** runs-on ubuntu-latest，steps: checkout / setup-node 20 / install pg client / install gh / `cd web && npm ci` / `npx tsx scripts/backup.ts`
**And** env 注入备份 secrets

**Given** 测试
**When** alex 手动 trigger backup workflow
**Then** workflow 跑通 ≤ 5 分钟
**And** R2 `mindprint-backups/backups/YYYY-MM-DD/` 下出现双文件
**And** GitHub Releases tab 出现 v{date} release 含附件

**Given** 长期验证
**When** 设置 cron 后等周日 02:00 UTC
**Then** workflow 自动触发完成
**And** alex Mac 周期同步（manual launchctl agent，文档说明）可拉最新

**Given** README + Runbook
**When** 我创建/更新 `web/README.md`
**Then** 含章节：项目简介 / 本地 dev 设置 / 环境变量 / 部署流程 / **Runbook**（如何从备份恢复 / 如何轮换 secrets / 如何手动 trigger 备份 / 如何查日志 / 如何回滚部署）

**Given** ESLint 自定义规则
**When** 我创建/更新 `web/eslint.config.mjs`
**Then** 含规则（用 `no-restricted-syntax` 或 AST selector）：
1. 禁 Server Action 内 throw（`app/_actions/**/*.ts` 中 ThrowStatement）
2. 禁 iframe 无 `sandbox` 属性
3. 禁 `sandbox="allow-*"`（仅空 sandbox 接受）
4. 禁绕开 `lib/r2/*` 直接调 fetch 到 R2 endpoint

**Given** ESLint 跑通
**When** alex 跑 `npm run lint`
**Then** 无 violation（已写 Server Actions / iframe 都通过）
**And** 若有人尝试 `<iframe>` 无 sandbox → lint 报错 + CI 红

**Given** 上线就绪
**When** alex 完成 Epic 4 后回顾
**Then** PRD §8 SM-1/2/3 衡量基础就位
**And** 8 个 OQ 的 M3 触发条件可观察

**Implementation Notes**:
- `pg_dump`：GitHub Actions 用 `apt-get install postgresql-client` 安装，或纯 Node 实现（hobby 简化）
- Runbook 用真实命令，便于 future-alex 几个月后还原状操作
- ESLint custom rule：`no-restricted-syntax` 内置 + AST selector 即可

---
