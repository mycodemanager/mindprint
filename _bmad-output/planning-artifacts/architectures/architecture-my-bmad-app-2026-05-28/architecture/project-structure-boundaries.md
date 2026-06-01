# Project Structure & Boundaries

## Complete Project Directory Structure

```
my-bmad-app/                                # 仓库根
├── _bmad/                                  # BMAD 工具链（不打包进 app）
├── _bmad-output/                           # 规划与实现产物（不打包进 app）
│   └── planning-artifacts/
│       ├── briefs/ · prds/ · ux-designs/ · architectures/
│       └── implementation-artifacts/       # epics / stories / sprint plans 未来产出
├── docs/                                   # 顶层项目文档（README、Runbook 等）
├── prototype/                              # 试验性代码归档（保留作为参考）
│   └── pwa-explore/                        # 原型 · throw-away spike，不再演化
├── web/                                    # ⭐ V1 应用代码库（本次架构的实现目标）
│   ├── README.md                           # 项目说明 + 开发环境搭建
│   ├── package.json                        # npm 依赖与脚本
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts                  # Tailwind 4，绑定 DESIGN.md tokens
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs                   # 含禁 anti-pattern 规则
│   ├── drizzle.config.ts                   # Drizzle Kit 配置
│   ├── middleware.ts                       # 应用层 NFR-2（重定向未认证）
│   ├── .env.local                          # 本地（gitignored）
│   ├── .env.example                        # 示例（git tracked）
│   ├── .gitignore
│   ├── .github/
│   │   └── workflows/
│   │       ├── ci.yml                      # lint + typecheck 跨 PR/push
│   │       └── backup.yml                  # 周日 cron · 备份脚本
│   ├── app/
│   │   ├── layout.tsx                      # 根布局 · 含 prefers-color-scheme
│   │   ├── page.tsx                        # 时间线主屏 · Server Component
│   │   ├── error.tsx                       # 顶层错误边界
│   │   ├── loading.tsx                     # 顶层 skeleton（4-6 张卡片）
│   │   ├── globals.css                     # Tailwind 入口 + DESIGN.md token CSS vars
│   │   ├── favicon.ico
│   │   ├── entry/
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Full Render 视图 · Server Component
│   │   │       ├── loading.tsx             # 切换 Entry 时的过渡
│   │   │       └── error.tsx               # 渲染失败兜底 · 含"返回时间线"
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx                # 登录页 · 输入邮箱
│   │   │   ├── verify-request/
│   │   │   │   └── page.tsx                # "邮件已发，请去查收"
│   │   │   └── error/
│   │   │       └── page.tsx                # Auth.js 错误页 · 非 allowlist 邮箱拒绝
│   │   ├── _actions/                       # Server Actions（_ 前缀 = 非路由）
│   │   │   ├── archive.ts                  # archiveEntry · FR-1/2/3
│   │   │   ├── update-title.ts             # updateEntryTitle · FR-7
│   │   │   └── delete-entry.ts             # deleteEntry · FR-7
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts            # Auth.js 回调
│   │       └── entry/
│   │           └── [id]/
│   │               ├── html/
│   │               │   └── route.ts        # HTML 内容代理 · FR-5（喂 iframe srcDoc）
│   │               └── download/
│   │                   └── route.ts        # 下载原 .html · FR-7
│   ├── components/                         # 一组件一文件
│   │   ├── Timeline.tsx                    # Server Component · FR-4 主壳
│   │   ├── EntryCard.tsx                   # Server Component · FR-4 卡片
│   │   ├── MonthDivider.tsx                # Server Component · FR-4 月份分隔
│   │   ├── EmptyState.tsx                  # Server Component · 空时间线
│   │   ├── FullRender.tsx                  # Server Component · FR-5 主壳
│   │   ├── FullRenderTopChrome.tsx         # Server Component · 顶部条
│   │   ├── ArchiveModal.tsx                # 'use client' · FR-1/2 modal
│   │   ├── Dropzone.tsx                    # 'use client' · 全屏拖拽
│   │   ├── SortToggle.tsx                  # 'use client' · 点击切 URL
│   │   ├── InlineTitleEditor.tsx           # 'use client' · FR-7 标题编辑
│   │   ├── MoreMenu.tsx                    # 'use client' · ⋯ 下拉
│   │   ├── ConfirmDeleteDialog.tsx         # 'use client' · FR-7 删除确认
│   │   ├── FullRenderKeyboard.tsx          # 'use client' · ←/→/Esc 监听
│   │   └── ThumbnailIframe.tsx             # 'use client' · IntersectionObserver 懒渲染
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts                   # 所有 Drizzle 表（users/sessions/verification_tokens/accounts/entries）
│   │   │   ├── client.ts                   # drizzle({ url: env.DATABASE_URL })
│   │   │   └── queries.ts                  # getEntries / getEntryById / countEntries
│   │   ├── auth/
│   │   │   ├── config.ts                   # NextAuthConfig 含 ResendProvider + 邮箱白名单 callback
│   │   │   ├── require-alex.ts             # requireAlex() · 抛 throw 触发 401
│   │   │   └── magic-link-email.tsx        # React Email 模板
│   │   ├── r2/
│   │   │   ├── client.ts                   # @aws-sdk/client-s3 配置 R2 endpoint
│   │   │   ├── upload.ts                   # uploadEntryHtml(key, body)
│   │   │   ├── download.ts                 # generateSignedDownloadUrl(key, ttl=300)
│   │   │   └── fetch.ts                    # fetchEntryHtml(key) -> Response stream
│   │   ├── entry/
│   │   │   ├── types.ts                    # Entry / ActionResult / ActionErrorCode / SortDirection
│   │   │   ├── schemas.ts                  # Zod schemas（client & server 共享）
│   │   │   ├── extract-title.ts            # 从 prototype 平移
│   │   │   ├── group-by-month.ts           # 从 prototype 平移
│   │   │   ├── sort-entries.ts             # 从 prototype 平移
│   │   │   ├── relative-time.ts            # 从 prototype 平移
│   │   │   ├── absolute-time.ts            # 从 prototype 平移
│   │   │   └── get-adjacent.ts             # 从 prototype 平移
│   │   └── env.ts                          # Zod typed env validation
│   ├── drizzle/
│   │   ├── migrations/                     # 上线后用 generate + migrate 产物
│   │   └── meta/                           # Drizzle Kit 元数据
│   ├── scripts/
│   │   └── backup.ts                       # pg_dump + R2 列举 + push 双备份
│   └── public/
│       └── favicon.ico
└── .gitignore                              # 仓库根 gitignore
```

**关键约定：**

- **`web/` 目录 = 整个 Next.js 应用**——所有 npm 依赖、构建产物、部署都在此根
- **`_bmad/` / `_bmad-output/` / `docs/` / `prototype/` 不被 Vercel 部署管线扫描**——通过 Vercel project 设置 root directory 为 `web/` 实现
- **`prototype/` 保留为只读归档**，不再演化；任何 V1 代码改动均在 `web/` 进行
- **测试文件就近**（未来加测试时）：`web/components/EntryCard.test.tsx` 紧邻 `EntryCard.tsx`

---

## Architectural Boundaries

### API Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT（浏览器）                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Client Components ('use client')                    │   │
│  │  · ArchiveModal · Dropzone · SortToggle             │   │
│  │  · InlineTitleEditor · MoreMenu · etc.              │   │
│  └────────┬────────────────────────────┬───────────────┘   │
│           │                            │                    │
│           │ Server Action call         │ fetch() to         │
│           │ (RSC framework)            │ Route Handler      │
└───────────┼────────────────────────────┼────────────────────┘
            ↓                            ↓
    ╔═══════╧════════╗            ╔══════╧══════════════╗
    ║ SERVER ACTION  ║            ║ ROUTE HANDLER       ║
    ║ (RPC-like)     ║            ║ (HTTP REST)         ║
    ║ archiveEntry   ║            ║ /api/auth/*         ║
    ║ updateEntryTitle│            ║ /api/entry/[id]/html ║
    ║ deleteEntry    ║            ║ /api/entry/[id]/download ║
    ╚═══════╤════════╝            ╚══════╤══════════════╝
            │                            │
            └──────┬─────────────────────┘
                   ↓
            ┌─────────────────┐
            │ requireAlex()   │ ⬅ NFR-2 强制
            │ Session check   │
            └────────┬────────┘
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    ┌───────┐  ┌──────────┐  ┌──────────┐
    │ Drizzle│  │ R2 client│  │ Auth.js  │
    │ (Neon) │  │  (S3 SDK)│  │ + Resend │
    └───────┘  └──────────┘  └──────────┘
```

**边界规则：**

1. **客户端永不直连 DB / R2**——所有数据访问必经 Server Action 或 Route Handler
2. **Server Component 可直接 await Drizzle 查询**——服务端运行，跨越 client-server 边界天然成立
3. **Server Action 是 mutation 的唯一入口**——客户端 form action / 直接 await 调用
4. **Route Handler 用于"non-RPC 语义"**：Auth 回调（重定向）、binary stream（下载 / HTML 代理）
5. **`requireAlex()` 是所有边界穿越的强制网关**——任何跳过它的服务端代码视为安全漏洞

### Component Boundaries

```
app/page.tsx (Timeline 主屏 · Server Component)
  ├─ Timeline.tsx (Server)
  │   ├─ <SortToggle />               ⬅ 'use client' (URL state)
  │   ├─ <Dropzone />                  ⬅ 'use client' (drag listener)
  │   ├─ <ArchiveModal />              ⬅ 'use client' (form state)
  │   ├─ MonthDivider.tsx (Server)
  │   └─ EntryCard.tsx (Server)
  │       └─ <ThumbnailIframe />       ⬅ 'use client' (IntersectionObserver)
  └─ EmptyState.tsx (Server)

app/entry/[id]/page.tsx (Full Render · Server Component)
  └─ FullRender.tsx (Server)
      ├─ FullRenderTopChrome.tsx (Server)
      │   ├─ <InlineTitleEditor />     ⬅ 'use client' (双击编辑态)
      │   └─ <MoreMenu />              ⬅ 'use client' (dropdown)
      ├─ <FullRenderKeyboard />        ⬅ 'use client' (←/→/Esc)
      └─ <iframe srcDoc=... sandbox=""> ⬅ DOM 元素，非 React 组件
                ↑
        HTML 由 /api/entry/[id]/html 经服务端代理获取
```

**边界规则：**

1. **Server Component 默认**——除非组件需要交互性 / 浏览器 API / state，否则保持 Server
2. **'use client' 边界尽量内缩**——把交互逻辑往叶子节点推（如 `<SortToggle />` 仅 toggle 本身是 client，外层 Server Component 不污染）
3. **Server 组件不能 import Client 组件的 hook**——但可以 import Client 组件作为子元素
4. **跨边界传递**：Server → Client 只能传递可序列化的 props（不传 function / Date 用 ISO string）
5. **PRD §3 Glossary 术语一致**——所有组件 / 函数 / 注释 / UI 文案沿用 PRD 术语（Entry / 归档 / 时间线 / 完整渲染）

### Data Boundaries

```
┌──────────────────────────────────────────────────────┐
│ DB 边界 · Neon Postgres                               │
│ ┌──────────────────────────────────────────┐         │
│ │ Auth.js 标准表（@auth/drizzle-adapter）   │         │
│ │ · users                                   │         │
│ │ · accounts                                │         │
│ │ · sessions                                │         │
│ │ · verification_tokens                     │         │
│ └──────────────────────────────────────────┘         │
│ ┌──────────────────────────────────────────┐         │
│ │ MindPrint 业务表                          │         │
│ │ · entries (id, user_id, title,           │         │
│ │   archived_at, original_filename,        │         │
│ │   size_bytes, r2_object_key, created_at) │         │
│ └──────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
                       ↑
                       │ Drizzle ORM only
                       │ (no raw SQL in app code outside lib/db/)
                       │
┌──────────────────────────────────────────────────────┐
│ Object Storage 边界 · Cloudflare R2                  │
│ Bucket: mindprint-entries                            │
│ ┌──────────────────────────────────────────┐         │
│ │ Object key 约定：                         │         │
│ │   entries/{user_id}/{entry_id}.html      │         │
│ │ Content-Type: text/html; charset=utf-8   │         │
│ └──────────────────────────────────────────┘         │
│                                                       │
│ Bucket: mindprint-backups（独立）                     │
│ ┌──────────────────────────────────────────┐         │
│ │ backups/{YYYY-MM-DD}/db.sql.gz           │         │
│ │ backups/{YYYY-MM-DD}/r2-inventory.json.gz│         │
│ └──────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
                       ↑
                       │ @aws-sdk/client-s3 only
                       │ (no fetch() to R2 outside lib/r2/)
```

**边界规则：**

1. **DB 访问必经 `lib/db/queries.ts`**——业务代码不直接写 Drizzle 查询；查询逻辑封装为可复用函数，便于未来加测试
2. **R2 访问必经 `lib/r2/*`**——业务代码不直接调 `@aws-sdk/client-s3`
3. **R2 key 格式锁定**：`entries/{user_id}/{entry_id}.html`——user_id 前缀便于未来加多用户（虽 V1 单用户）；单 user_id 下扁平不分子目录
4. **删除 Entry 时两边联动**：DB DELETE + R2 DeleteObject 同事务保证；R2 删除失败但 DB 已删 → 后台清理脚本周期处理孤儿对象
5. **备份 bucket 与生产 bucket 隔离**——独立 IAM 凭据，备份脚本仅有 backup bucket 写权限 + 生产 bucket 读权限

---

## Requirements to Structure Mapping

### FR-1 上传 .html 文件

| 组件 | 位置 |
|---|---|
| 全屏 dropzone 监听 | `web/components/Dropzone.tsx` |
| 文件类型 / 大小 client 端早期校验 | 同上 |
| 文件读取为字符串 | 同上 |
| 触发归档 modal | 同上 → `<ArchiveModal />` |
| 服务端 Zod 校验（10MB / .html / .htm） | `web/app/_actions/archive.ts` 内 schema |
| R2 上传 | `web/lib/r2/upload.ts` |
| DB 写入 | `web/app/_actions/archive.ts` 调 `lib/db/client` |
| 事务回滚（R2 上传成功但 DB 失败 → 删 R2 对象） | `web/app/_actions/archive.ts` 内 try/catch |
| 多文件 / 非 .html 错误提示 | `<Dropzone />` 内 `setErrorBanner` |

### FR-2 自动捕获元数据 + 标题编辑

| 组件 | 位置 |
|---|---|
| `<title>` 抽取（fallback 文件名去扩展名） | `web/lib/entry/extract-title.ts`（平移自 prototype） |
| 归档 modal 预览 + 标题编辑框 | `web/components/ArchiveModal.tsx` |
| 200 字符截断与提示 | `web/lib/entry/schemas.ts` Zod schema + 客户端实时显示 |
| 归档时间戳服务端写入 | `web/app/_actions/archive.ts`（`new Date()` 或 `defaultNow()`） |

### FR-3 归档成功后进入完整渲染

| 组件 | 位置 |
|---|---|
| 归档成功后路由跳转 | `web/app/_actions/archive.ts` 返回 `{ ok: true, data: { id } }`；客户端拿到后 `router.push('/entry/' + id)` |
| 新 Entry 立即出现在时间线顶部 | `revalidatePath('/')` 在 Server Action 末尾 |
| 渲染失败 fallback 不影响归档状态 | `web/app/entry/[id]/error.tsx` 含"返回时间线" |

### FR-4 时间线卡片网格主屏

| 组件 | 位置 |
|---|---|
| 列表查询（全量） | `web/app/page.tsx` → `lib/db/queries.ts` 的 `getEntries(sort)` |
| 月份分组 | `web/lib/entry/group-by-month.ts` |
| 排序切换（URL state） | `web/components/SortToggle.tsx`（`router.replace('?sort=...')`） |
| 月份分隔条 | `web/components/MonthDivider.tsx` |
| 卡片（标题 + 时间 + 缩略） | `web/components/EntryCard.tsx` |
| 缩略预览 iframe（视口懒渲染） | `web/components/ThumbnailIframe.tsx` + IntersectionObserver |
| 空状态 | `web/components/EmptyState.tsx` |
| 响应式断点 | `web/tailwind.config.ts` + EntryCard 的 grid 类 |

### FR-5 完整渲染单一 Entry

| 组件 | 位置 |
|---|---|
| 动态路由 | `web/app/entry/[id]/page.tsx` |
| 顶部 chrome（返回 / 标题 / 时间 / 上一下一 / ⋯） | `web/components/FullRenderTopChrome.tsx` |
| HTML 内容代理 | `web/app/api/entry/[id]/html/route.ts` → `lib/r2/fetch.ts` |
| iframe 渲染（`sandbox=""` + srcDoc） | `web/components/FullRender.tsx` |
| 键盘 ← / → / Esc | `web/components/FullRenderKeyboard.tsx` |
| 上一/下一计算 | `web/lib/entry/get-adjacent.ts`（平移自 prototype） |
| 渲染失败 fallback | `web/app/entry/[id]/error.tsx` |

### FR-6 私有访问控制

| 组件 | 位置 |
|---|---|
| Auth.js 配置 | `web/lib/auth/config.ts` |
| Magic Link Email Provider | 同上，含 Resend Provider |
| 邮箱白名单 `signIn` callback | 同上，比对 `env.ALLOWED_EMAIL` |
| 登录页 UI | `web/app/auth/signin/page.tsx` |
| "邮件已发"提示页 | `web/app/auth/verify-request/page.tsx` |
| Auth 错误页 | `web/app/auth/error/page.tsx` |
| middleware 应用层重定向 | `web/middleware.ts` |
| `requireAlex()` API 层守卫 | `web/lib/auth/require-alex.ts` |
| Magic Link 邮件模板 | `web/lib/auth/magic-link-email.tsx`（React Email） |
| 30 天 session | Auth.js config `session.maxAge` |

### FR-7 Entry 事后管理

| 子能力 | 组件 | 位置 |
|---|---|---|
| **编辑标题** | inline editor + Server Action | `web/components/InlineTitleEditor.tsx` + `web/app/_actions/update-title.ts` |
| **下载原 .html** | More menu 链接 + Route Handler | `web/components/MoreMenu.tsx` + `web/app/api/entry/[id]/download/route.ts` |
| 下载签名 URL 生成 | — | `web/lib/r2/download.ts` `generateSignedDownloadUrl(key, ttl=300)` |
| 下载文件名生成（中文兼容 / 非法字符替换） | — | `web/app/api/entry/[id]/download/route.ts` 内逻辑 |
| **永久删除** | 二次确认 modal + Server Action | `web/components/ConfirmDeleteDialog.tsx` + `web/app/_actions/delete-entry.ts` |
| 删除同时清 R2 | — | `web/app/_actions/delete-entry.ts` 内调 `lib/r2/*` |

### NFR-1 HTML 渲染沙箱化（跨 FR-4 + FR-5）

| 实现点 | 位置 |
|---|---|
| 缩略预览 iframe | `web/components/ThumbnailIframe.tsx`（`sandbox=""` + srcDoc + scale） |
| Full Render iframe | `web/components/FullRender.tsx`（`sandbox=""` + srcDoc） |
| HTML 内容服务端代理（避免签名 URL 进 DOM） | `web/app/api/entry/[id]/html/route.ts` |

### NFR-2 私有访问三层隔离

| 层 | 实现位置 |
|---|---|
| **应用层** | `web/middleware.ts` |
| **API 层** | `web/lib/auth/require-alex.ts`（所有 Server Action / Route Handler 第一行调用） |
| **资源层** | R2 bucket 禁 public access；`web/lib/r2/download.ts` 生成 300s presigned URL |

### NFR-3 基本可靠性

| 子要求 | 实现位置 |
|---|---|
| 错误隔离 | `web/app/entry/[id]/error.tsx`（局部错误边界）；iframe onError fallback |
| 数据持久（hard requirement） | Neon PITR + R2 11-9 持久性 + `web/scripts/backup.ts` 周期跨服务备份 |
| 浏览器覆盖 | `web/package.json` browserslist 或默认 |
| 响应感软目标 | `loading.tsx` skeleton + IntersectionObserver 懒渲染 + Vercel Web Analytics 监测 |

---

## Cross-Cutting Concerns Mapping

| Concern | 实现位置 |
|---|---|
| **环境变量集中校验** | `web/lib/env.ts` Zod schema（启动时 fail-fast） |
| **错误格式标准化** | `web/lib/entry/types.ts` `ActionResult` 类型 |
| **日志格式** | `[domain] message` 约定（散布在所有服务端代码） |
| **glossary 一致性** | PRD §3 术语在所有代码 / 注释 / UI 文案中沿用 |
| **PRD 术语 → 代码标识符映射** | Entry → `Entry` / `entries` 表 · 归档 → `archive` / `archiveEntry` · 时间线 → `Timeline` / `timeline` · 完整渲染 → `FullRender` |
| **平台无关性** | `web/lib/r2/*` 用 S3 兼容 API；理论上未来切 AWS S3 / Backblaze B2 改 endpoint 即可 |

---

## Integration Points

### 外部集成

| 服务 | 用途 | 接入位置 |
|---|---|---|
| **Neon** | Postgres DB | `web/lib/db/client.ts` 通过 `DATABASE_URL` |
| **Cloudflare R2** | 对象存储（生产 bucket） | `web/lib/r2/client.ts` 通过 `R2_*` 环境变量 |
| **Cloudflare R2**（备份 bucket） | 跨服务备份 | `web/scripts/backup.ts` |
| **Resend** | Magic Link 邮件 | `web/lib/auth/config.ts` 通过 `AUTH_RESEND_KEY` |
| **Vercel** | 部署 + 日志 + Analytics | 通过 git push 触发 |
| **GitHub** | 仓库 + CI + cron 备份 | `.github/workflows/*.yml` |

### 内部数据流

**归档流（FR-1/2/3）：**
```
浏览器 ⟵drag .html⟶ <Dropzone />
                       ↓ FileReader → htmlContent string
                     <ArchiveModal /> (标题预览 + 编辑)
                       ↓ form action
                     archiveEntry() Server Action
                       ├─ requireAlex()
                       ├─ Zod 校验（filename / size / title）
                       ├─ uploadEntryHtml(key, body) → R2
                       ├─ db.insert(entries).values(...) → Neon
                       ├─ revalidatePath('/') + revalidatePath('/entry/[id]')
                       └─ return { ok: true, data: { id } }
                       ↓
                     router.push('/entry/' + id) → Full Render
```

**时间线渲染流（FR-4）：**
```
浏览器 ⟶ GET / ⟶ app/page.tsx (Server Component)
                       ↓
                     getEntries(sort) ⟶ Drizzle ⟶ Neon
                       ↓
                     groupByMonth + sortEntries (pure functions)
                       ↓
                     <Timeline /> 渲染 (HTML stream)
                       ├─ <MonthDivider />（每月）
                       └─ <EntryCard />（每条）
                             ├─ srcDoc 内联 HTML（同 Full Render 来源）
                             ├─ IntersectionObserver 视口内才挂载
                             └─ <iframe sandbox="" >
                       ↓
                     浏览器接收 HTML stream，progressively render
```

**Full Render 流（FR-5）：**
```
单击卡片 ⟶ /entry/[id]
                       ↓
                     app/entry/[id]/page.tsx (Server Component)
                       ├─ getEntryById(id) ⟶ Drizzle ⟶ Neon
                       └─ 渲染顶部 chrome + <iframe srcDoc={url}>
                       ↓
                     iframe srcDoc 实际为 URL `/api/entry/[id]/html`
                       ↓
                     Route Handler ⟶ requireAlex() ⟶ fetchEntryHtml(key) ⟶ R2
                       ↓
                     stream HTML 回客户端
                       ↓
                     iframe 渲染（sandbox="" 隔离 + opaque origin）
```

**下载流（FR-7）：**
```
⋯ menu → 下载链接 → GET /api/entry/[id]/download
                       ↓
                     Route Handler ⟶ requireAlex() ⟶ generateSignedDownloadUrl(key, 300)
                       ↓
                     Redirect 302 到短时效 R2 URL
                       ↓
                     浏览器直接从 R2 下载（Content-Disposition: attachment; filename="...")
```

**备份流（NFR-3 hard requirement）：**
```
GitHub Actions cron (每周日 02:00 UTC)
                       ↓
                     web/scripts/backup.ts
                       ├─ pg_dump $DATABASE_URL_READONLY → db.sql
                       ├─ gzip db.sql → db.sql.gz
                       ├─ S3 ListObjectsV2 mindprint-entries → r2-inventory.json
                       ├─ gzip → r2-inventory.json.gz
                       ├─ S3 PutObject mindprint-backups/{date}/db.sql.gz
                       ├─ S3 PutObject mindprint-backups/{date}/r2-inventory.json.gz
                       └─ gh release upload v{date} 双文件
                       ↓
                     alex Mac launchctl agent（每月）拉最新 backup 包到本地
```

---

## File Organization Patterns

### Configuration Files

| 文件 | 用途 |
|---|---|
| `web/next.config.ts` | Next.js 配置（无特殊配置；默认 Turbopack） |
| `web/tailwind.config.ts` | Tailwind 4 + DESIGN.md tokens 桥接 |
| `web/postcss.config.mjs` | Tailwind PostCSS plugin |
| `web/tsconfig.json` | TS strict + paths + Next 内置 plugin |
| `web/eslint.config.mjs` | next/core-web-vitals + 禁 anti-pattern 规则 |
| `web/drizzle.config.ts` | Drizzle Kit（schema 路径 + DATABASE_URL） |
| `web/.env.local` | 本地 dev（gitignored） |
| `web/.env.example` | 提交到 git 的样例 |
| `web/middleware.ts` | NFR-2 应用层 |

### Source Organization

- **`app/`** = 路由 / 入口（page / layout / loading / error / route handlers）
- **`app/_actions/`** = Server Actions（mutations）
- **`components/`** = 可复用 UI（一组件一文件）
- **`lib/<domain>/`** = 按领域分组的纯逻辑（db / auth / r2 / entry）
- **`drizzle/`** = 迁移产物
- **`scripts/`** = 一次性 / 周期性脚本

### Test Organization（未来加测试时）

- **就近原则**：`web/components/EntryCard.test.tsx` 紧邻 `EntryCard.tsx`
- **集成测试**：`web/tests/integration/`（如 `archive-flow.test.ts`）
- **E2E**：`web/tests/e2e/`（Playwright，未来加）

### Asset Organization

- **静态资产**：`web/public/`（favicon、未来可能的品牌图）
- **DESIGN.md mocks**：`_bmad-output/planning-artifacts/ux-designs/.../mockups/`（不入 web/，参考用）
- **动态资产（用户 HTML）**：R2 桶 `mindprint-entries/`

---

## Development Workflow Integration

### Dev Server

```bash
cd web
npm install
cp .env.example .env.local      # 填本地连接串（Neon dev branch）
npm run dev                      # next dev with Turbopack
```

**端口约定：**
- `localhost:3000` —— Next.js dev server
- Neon dev branch（每个 PR / 本地一个 branch，scale-to-zero 友好）
- Resend test mode（不真发邮件 → 控制台日志显示 magic link）

**dev-only 调试约定：**
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=1` 在 `.env.local` 时允许跳过 magic link（仅 dev）—— 在 `lib/auth/config.ts` 显式检查 `process.env.NODE_ENV === 'development'`，防 prod 误开
- Drizzle Kit `studio` 启动 DB 可视化（`npx drizzle-kit studio`）

### Build Process

```bash
cd web
npm run lint                     # next lint
npm run typecheck                # tsc --noEmit
npm run build                    # next build with Turbopack
npm run start                    # 本地预览 production build
```

### Deployment Structure

| 触发 | 动作 |
|---|---|
| `git push origin <branch>` | Vercel Preview 部署 + GH Actions CI（lint + typecheck）|
| `git push origin main` | Vercel Production 部署 + GH Actions CI |
| 周日 02:00 UTC cron | GH Actions backup workflow |

**Vercel 项目配置：**
- **Root Directory**: `web/`（不扫描 `_bmad/` / `_bmad-output/` / `prototype/`）
- **Build Command**: `npm run build`
- **Output Directory**: `.next`（Next.js 默认）
- **Install Command**: `npm install`
- **Node.js Version**: 20.x LTS

**环境变量（在 Vercel project settings 配置，三套：development / preview / production）：**
- `DATABASE_URL` — Neon connection string（带 `?sslmode=require`）
- `DATABASE_URL_READONLY` — Neon read-only（备份脚本用，仅 GH Actions secrets）
- `AUTH_SECRET` — `openssl rand -base64 32` 生成
- `AUTH_RESEND_KEY` — Resend API key
- `ALLOWED_EMAIL` — alex 的固定邮箱
- `R2_ACCOUNT_ID` — Cloudflare account id
- `R2_ACCESS_KEY_ID` — R2 IAM access key
- `R2_SECRET_ACCESS_KEY` — R2 IAM secret
- `R2_BUCKET_NAME` — `mindprint-entries`
- `R2_BACKUP_BUCKET_NAME` — `mindprint-backups`（仅 GH Actions secrets）
- `NEXTAUTH_URL` — production 域名（Vercel auto-fills 在 preview）
