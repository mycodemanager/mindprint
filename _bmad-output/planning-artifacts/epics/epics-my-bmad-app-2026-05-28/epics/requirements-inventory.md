# Requirements Inventory

## Functional Requirements

> 摘自 PRD §4。每条 FR 在 PRD 中有完整"测试性后果"清单——本节仅作清单索引，acceptance criteria 阶段会展开。

- **FR-1**：alex 可通过**拖拽**或**点击选择**把单个 `.html` / `.htm` 文件上传到 MindPrint（10MB 上限，事务性，失败不残留半个 Entry）。Realizes UJ-2。
- **FR-2**：系统在上传时自动捕获 Entry 元数据（归档时间戳、原始文件名、文件字节大小），alex 可在归档落定前预览并编辑显示标题（从 `<title>` 抽取，200 字符上限，fallback 文件名）。Realizes UJ-2。
- **FR-3**：归档成功后系统自动把 alex 带到新 Entry 的完整渲染视图（≤ 1 次跳转），新 Entry 立即出现在时间线顶部；渲染失败不影响归档状态。Realizes UJ-2 → UJ-1 衔接。
- **FR-4**：时间线以**卡片网格**形式展示所有 Entry，含 HTML 内容缩略预览（视觉主体）、显示标题、归档时间（相对格式 + hover 绝对时间）、月份分隔条；alex 可在倒序 / 正序之间切换排序（V1 不持久化），单击任一卡片进入完整渲染；V1 全量加载所有元数据不分页（A4）。Realizes UJ-1, UJ-3。
- **FR-5**：alex 从时间线单击卡片或归档成功后自动跳转，进入该 Entry 的完整渲染视图；HTML 在沙箱化容器中以原貌呈现；含顶部 chrome（显示标题 + 归档时间 + 返回时间线 + 上一条 / 下一条 Entry 导航）；移动端响应式；加载失败显示明确错误信息且 Entry 仍在档案库中。Realizes UJ-1, UJ-2 衔接, UJ-3。
- **FR-6**：仅 alex 可访问 MindPrint 的任何功能与数据；未认证请求一律被拒；认证成功后保持 30 天会话（A6）；同一时刻支持多设备同时登录。Realizes UJ-1/2/3 长期可持续使用基础。
- **FR-7**：alex 可对单一 Entry 做事后管理——**编辑显示标题**（inline 编辑，立即生效，时间戳不变，200 字符限制）/ **下载原 .html**（字节级别等同上传原文件，文件名以当前显示标题为基础 + 中文兼容）/ **永久删除**（二次确认必须，删除不可撤销，跳转回时间线，同时移除元数据 + 原始 HTML + 缩略预览资源）。Realizes UJ-1/2/3 长期可持续使用。

## NonFunctional Requirements

> 摘自 PRD §5 · Cross-Cutting NFRs（hobby 项目最小集合）。

- **NFR-1 HTML 渲染沙箱化**：任何 Entry 的 HTML 内容渲染（卡片缩略预览 §4.2、Full Render §4.3）必须满足——
  - **凭据隔离**：渲染上下文无法访问 MindPrint 的认证凭据（Cookie / Session Token / `localStorage` / `sessionStorage`）/ 同源存储 / IndexedDB / 应用私有 API
  - **行为隔离**：Entry HTML 内的 `<script>` 不能修改宿主 DOM / `top.location` / `parent` 引用 / 通过 `postMessage` 等通道获取 MindPrint 状态
  - **架构锁定机制**：同源 srcDoc + `sandbox=""`（iframe 获得 opaque origin + 空属性 = 所有能力默认关闭）
- **NFR-2 私有访问（仅 alex）· 三层隔离**：
  - **应用层**：所有页面 URL 在未认证状态下重定向至登录入口
  - **API 层**：所有 API 端点在未认证状态下返回 401 + 空 body（非 404，避免泄露 Entry 是否存在）
  - **资源层**：原始 .html 文件存储位置**不应**可通过猜测 / 枚举 URL 直接访问——R2 桶禁用 public access，下载经服务端短时效 presigned URL（5 分钟）
- **NFR-3 基本可靠性（hobby 最小集合）**：
  - **错误隔离**（软）：单条 Entry 损坏 / 渲染失败 / 缩略预览生成失败不应阻塞时间线整体；其他 Entry 仍可正常浏览
  - **数据持久**（**hard requirement**）：归档完成的 Entry 除非 alex 主动通过 FR-7 删除，否则不得丢失 —— 三重保险：Neon PITR + R2 11-9 持久性 + 周期跨服务备份
  - **浏览器覆盖**（软）：支持当前主流桌面浏览器（Chrome / Safari / Firefox 各最新稳定版）+ 主流移动浏览器（iOS Safari / Android Chrome 各最新稳定版）
  - **响应感**（A7 软目标）：时间线主屏首屏 < 2s（50 条目以内）；Full Render 单击卡到 HTML 可见 < 1s——未达成不阻塞上线，但 M3 retro 关注点

## Additional Requirements

> 摘自 Architecture（建立 V1 所需的技术 / 基础设施需求，未直接在 PRD §4-5 出现但实现时不可缺）。

**项目初始化 + 原型平移**
- **Starter Template**：在 `web/` 目录跑 `npx create-next-app@latest web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`（Next.js 16 + React 19 + Tailwind 4 + Turbopack）
- **原型代码平移**（"平移即净化"）：从 `prototype/pwa-explore/` 平移类型系统（MockEntry/UserEntry/AnyEntry → Entry）+ 纯函数（groupByMonth / sortEntries / getAdjacent / relativeTime / absoluteTime / extractTitle）+ UI 组件契约（EntryCard / FullRender / Timeline / MonthDivider / ArchiveModal / SortToggle）；**剔除** IndexedDB 持久化 + Serwist PWA + MOCK_ENTRIES 数组

**数据层**
- **Neon Postgres 项目搭建**：scale-to-zero 配置 + dev / preview / production 三 branch + connection string（含 `?sslmode=require`）
- **Drizzle ORM 配置**：`drizzle.config.ts` + `drizzle-orm/neon-http` + `@neondatabase/serverless` 驱动 + drizzle-kit 迁移工具
- **Schema 设计**（YAGNI 立场，不预留未来 OQ 字段）：
  - `users` + `sessions` + `verification_tokens` + `accounts`（Auth.js 4 标准表）
  - `entries`（id / user_id / title / archived_at / original_filename / size_bytes / r2_object_key / created_at）
- **首次 migration push**（开发期）→ 上线前切换到 generate + migrate

**认证 & 安全**
- **Auth.js v5 集成**：`@auth/drizzle-adapter` + Email Provider with Resend
- **邮箱白名单**：`signIn` callback 中校验 `env.ALLOWED_EMAIL`，非 alex 邮箱直接拒绝（不发邮件）
- **Magic Link 邮件模板**：React Email + Resend Provider
- **30 天 session**：`session.maxAge = 60 * 60 * 24 * 30`
- **Magic Link 链接 24h 时效**：Auth.js 默认
- **middleware.ts**：应用层重定向未认证 URL 至 `/auth/signin`
- **requireAlex() helper**：所有 Server Action / Route Handler 第一行调用，未认证抛 throw 触发 401 空 body
- **登录页 / verify-request 页 / auth error 页 UI**

**对象存储**
- **Cloudflare R2 配置**：alex 自己 CF 账号下创建 `mindprint-entries` 生产 bucket（禁用 public access）+ `mindprint-backups` 独立备份 bucket
- **R2 IAM 凭据**：生产 bucket 读写 key + 备份 bucket 独立写 key（与生产分离）
- **`@aws-sdk/client-s3` 集成**：通过 R2 S3 兼容 endpoint `https://<account-id>.r2.cloudflarestorage.com`
- **R2 object key 约定**：`entries/{user_id}/{entry_id}.html`
- **R2 helper 模块**：`lib/r2/{client, upload, download, fetch}.ts`
- **Presigned URL 生成**：300 秒 TTL，用于 FR-7 下载

**API 与通信**
- **混合 API 风格**：RSC 直查 DB 用于读 + Server Actions 用于变更 + Route Handlers 用于 Auth 回调 / 下载 / HTML 代理
- **ActionResult 类型契约**：`{ ok: true, data } | { ok: false, error: { code, message } }`——所有 Server Action 必须返回，不抛 throw
- **错误编码标准**：UNAUTHORIZED / INVALID_FILE_TYPE / FILE_TOO_LARGE / INVALID_TITLE_LENGTH / ENTRY_NOT_FOUND / UPLOAD_FAILED / DB_ERROR / EMAIL_NOT_ALLOWED / INTERNAL_ERROR
- **revalidate 策略**：所有 mutation Server Action 完成显式 `revalidatePath('/')` + `revalidatePath('/entry/[id]')`
- **HTML 内容代理 Route Handler**：`/api/entry/[id]/html` 从 R2 流式 fetch 后转 Response，喂 iframe srcDoc

**数据验证**
- **Zod schema 集中化**：`lib/entry/schemas.ts`——client 与 server 共享
- **drizzle-zod 集成**：从 Drizzle schema 自动生成验证 schema
- **双层验证强制**：client syntactic 早期反馈 + server 权威验证

**基础设施 & 部署**
- **Vercel 项目配置**：Root Directory = `web/`，Build = `npm run build`，Node 20.x LTS
- **环境变量管理**：11 个 env vars 分 dev / preview / production 三套
  - `DATABASE_URL` / `DATABASE_URL_READONLY`（备份用）/ `AUTH_SECRET` / `AUTH_RESEND_KEY` / `ALLOWED_EMAIL` / `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_BACKUP_BUCKET_NAME` / `NEXTAUTH_URL`
- **typed env**：`lib/env.ts` Zod 校验，启动时 fail-fast
- **自定义域名 + HTTPS**：Vercel 自动证书

**CI/CD**
- **GitHub Actions CI**：PR / push 触发 `npm ci` → `npm run lint`（next lint）→ `npm run typecheck`（`tsc --noEmit`）
- **Vercel auto-deploy**：任何 push → preview；`main` → production

**备份 & 可靠性（NFR-3 hard requirement）**
- **周期性跨服务备份**：GitHub Action cron 每周日 02:00 UTC 触发：pg_dump Neon → gzip → push 到 R2 backup bucket + GitHub Releases
- **alex Mac 周期同步**：launchctl agent 月度拉最新备份包到本地（手动配置，非应用代码）
- **错误边界**：`app/error.tsx` 顶层 + `app/entry/[id]/error.tsx` 局部
- **iframe onError fallback**：缩略预览生成失败退化为"标题 + 时间"占位

**日志**
- **日志格式标准**：服务端 `console.log` / `console.error` 全部用 `[domain] message` 前缀（grep 友好）

**度量与 Analytics（承接 PRD §8 Success Metrics）**
- **Vercel Web Analytics 接入**：项目设置启用 + `@vercel/analytics/next` 包 + `<Analytics />` 挂载到 `app/layout.tsx`
- **SM-1 计量实现**：服务端记录 alex 进入时间线 / Full Render 的访问；**30 分钟内重复访问算同一次**——通过 sessionStorage 或基于 session 的去重逻辑（不入 DB，避免污染业务数据）；M3 retro 时 alex 自查"3 个月内打开 ≥ 8 次"
- **SM-2 / SM-3** alex 自我评估，**架构无实现需求**——仅在 M3 retro 时通过 alex 自报 / 与 ~/Downloads 对照
- **关键约束**：**不引入推送 / 邮件提醒 / 红点 / 通知**（PRD §8.3 SM-C2 反向指标）——分析数据**仅用于 M3 retro 评估**，不驱动 UI 提示 alex 打开应用

## UX Design Requirements

> 摘自 DESIGN.md + EXPERIENCE.md。每条 UX-DR 是可生成一条 story 的具体实现工作项。

**设计 token 系统**
- **UX-DR1**：DESIGN.md tokens 桥接为 Tailwind 4 config（`tailwind.config.ts` 的 `theme.extend`），覆盖所有 colors（surface / on-surface / outline-variant / primary / secondary / error 等）+ light + dark 双套
- **UX-DR2**：中文优先字体加载策略——Source Han Serif SC + Newsreader + ET Book + Georgia + serif fallback 链（衬线）；Source Han Sans SC + Noto Sans CJK SC + Inter + system-ui + sans-serif（无衬线）；JetBrains Mono + SF Mono + ui-monospace（等宽）；CSS `@font-face` 或 next/font 优化
- **UX-DR3**：暗色模式 `prefers-color-scheme: dark` 自动跟随系统切换（V1 不做手动 toggle）；tokens 倒置（primary 深棕 → 暖米色，background 暖白 → 墨绿黑）
- **UX-DR4**：字号 / 行高规范实现——display-lg (48px / 36px mobile) / headline-md (28px) / headline-sm (20px) / body-lg (17px) / body-md (15px) / label-caps (12px uppercase) / caption (13px) / mono-metadata (12px 等宽)
- **UX-DR5**：圆角规范——sm 2px / DEFAULT 4px / md 6px / lg 8px / xl 12px / full 9999px
- **UX-DR6**：间距规范——8px base unit / gutter 24px / margin-mobile 20px / margin-desktop 56px / editorial-gap 64px（月份分隔）/ card-gap 20px / card-padding 16px
- **UX-DR7**：阴影规范——tonal layering + 极轻染棕阴影（基于 primary `rgba(115, 92, 65, ...)`）；卡片 rest 几乎不可见 + hover 柔和提升；**禁纯黑投影**

**组件视觉与行为契约（12 个组件）**
- **UX-DR8**：**Card 组件**（时间线核心）——HTML 缩略预览（约 65% 高度，pointer-events 禁用）+ 显示标题（headline-sm 2-3 行截断）+ 归档时间（caption 相对 + hover 绝对）+ 1px dust ghost outline + hover 微抬起染棕阴影 + 单击整张进 Full Render（无 overlay 按钮）
- **UX-DR9**：**Month Divider 组件**——display-lg 衬线大字（如"2026 年 5 月"）+ 1px dust 横线延伸到右边缘 + 上下 editorial-gap 64px + **不折叠不可交互** + 屏幕阅读器宣告"{年} 年 {月}，{N} 份 Entry"
- **UX-DR10**：**Button 三变体**——Primary（旧书皮深棕实心 + 暖白字 + label-caps + 8/20px padding + 4px 圆角）/ Secondary（透明 + 1px dust 边 + on-surface 色）/ Destructive（衰红实心 + 白字，**仅删除确认按钮**）
- **UX-DR11**：**Input 下划线形态**——1px dust 底部下划线 + 透明背景 + body-md；focus → 下划线变 primary；error → 下划线变 error 红；Label 上方 label-caps uppercase
- **UX-DR12**：**Dropzone 双形态 + 整屏 listener**——空时间线：dashed 2px dust 边占主区域 + 居中"拖拽 .html 至此 / 或点击选择"；有 Entry 时：右上"归档"按钮 + **任意位置整屏拖拽 listener**（视觉上隐藏）；拖拽悬停态：背景 surface-container-high + 边变 primary 实线 + 中央"放下以归档"提示
- **UX-DR13**：**Upload Preview Form**（归档 modal）——缩略预览 + 自动抽取标题预填编辑框 + 归档时间戳只读 mono 显示 + 确认 / 取消按钮
- **UX-DR14**：**Inline Title Editor**（Full Render 顶部 chrome 单击标题）—— Notion 风格：单击进编辑态，blur 或 Enter 保存（→ Server Action），Esc 撤销；失败时 inline 错误提示，编辑态保留
- **UX-DR15**：**Top Chrome**（Full Render 视图顶部条）——左 ← 返回时间线（图标 + 文字）/ 中标题 + 归档时间 / 右 ⟨ ⟩ 上一下一 + ⋯ More menu / 背景 surface + 1px dust 底边
- **UX-DR16**：**More Menu (⋯)**——单击展开 dropdown：编辑标题 / 下载原 .html / 删除（destructive 红）；Esc / 点击外部关闭；移动端转底部 sheet
- **UX-DR17**：**Confirm Dialog**（删除二次确认）——居中 modal + surface-container-high 背景 + 标题"确认删除？" + 正文"删除后无法恢复。" + "取消" + "删除"（destructive）按钮 + 删除完成自动返回时间线
- **UX-DR18**：**Sort Toggle**——二态切换器"最新在前 / 最早在前"；切换立即重新排序；**不持久化**——刷新回默认倒序
- **UX-DR19**：**Auth Screen**（登录页）——极简：MindPrint wordmark + 单一登录入口（邮箱输入框 + 主按钮）；无注册 / 无社交 / 无找回密码 link
- **UX-DR20**：**Empty State**——居中衬线 display-lg 大字（"还没有 Entry。"）+ body-lg 描述（"从这里开始。"）+ 单一主按钮；**不使用插图 / icon**

**状态契约（12 种）**
- **UX-DR21**：**Cold load 状态**——时间线 surface-container-low skeleton 卡片网格（4-6 张占位），保持 grid layout 不抖动
- **UX-DR22**：**缩略预览懒渲染态**——`IntersectionObserver` 视口外卡片占位为 surface-container；视口内挂载 iframe 加载 srcDoc；失败 fallback "标题 + 时间" 占位（**禁止静默降级到文本摘要**）
- **UX-DR23**：**归档进行中态**——modal 主按钮 disabled + 文字"上传中……"（**不用 spinner 圈 / 不用百分比**）
- **UX-DR24**：**Full Render 加载态**——iframe 容器 spinner + "正在加载……"；HTML 加载完成 spinner 消失
- **UX-DR25**：**Full Render 失败态**——"渲染未能完成。" + "下载原文件"链接 + "返回时间线"按钮；Entry 仍在库中
- **UX-DR26**：**未认证 / 会话过期态**——middleware 重定向至 `/auth/signin`；API 401；会话过期重定向后回到原 URL

**交互 primitives**
- **UX-DR27**：**键盘快捷键 + 焦点管理**——全局 Esc（关 modal / 退 edit / 返回时间线）；Full Render ← / →（上一下一）；Enter / Space 激活焦点；Tab / Shift+Tab 顺序焦点；focus ring 2px primary outline（4.5:1+ 对比）；Tab order 匹配阅读顺序
- **UX-DR28**：**移动端关键退化**——拖拽上传不可用（按钮触发系统文件选择器）；hover 移除（卡片单击直接进 Full Render）；顶部 chrome 紧凑化（标题 1 行截断 + 上一下一图标无 label + ⋯ 转底部 sheet）

**可访问性**
- **UX-DR29**：**WCAG 2.2 AA 全 surface 覆盖**——所有主要 token 对比度 ≥ 4.5:1；focus ring 强制；屏幕阅读器宣告（surface 类型 + month divider + Entry 卡片 aria-label）；错误信息双通道（颜色 + role="alert" + 文本）；任何 modal / edit / dropdown 用 Esc 可关
- **UX-DR30**：**Reduced motion 支持**——`prefers-reduced-motion: reduce` 时：卡片 hover 抬起动画移除 / Full Render 切换为瞬移 / modal 弹出无动画

**响应式**
- **UX-DR31**：**4 断点响应式**——`< 768px` 1 列 + margin 20px + 顶部归档按钮变 floating action；`768-1024px` 2 列 + margin 32px；`1024-1440px` 3 列；`≥ 1440px` 4 列 + margin 56px；网格列数最大不超过 4 列

**Voice & Tone**
- **UX-DR32**：**克制工具 microcopy 实现**——按 EXPERIENCE.md Voice and Tone 表：陈述、句号收束、不用感叹号、不用 emoji、数字优先；具体串："上传失败。请重试。" / "还没有 Entry。" / "已归档。" / "确认删除？" / "渲染未能完成。" 等

## FR Coverage Map

| Requirement | Epic | 备注 |
|---|---|---|
| **FR-1** 上传 .html | Epic 2 | 拖拽 / 选择 + 10MB / 扩展名校验 + 事务性 |
| **FR-2** 元数据 + 标题编辑 | Epic 2 | `<title>` 抽取 + 200 字符 + Upload Preview Form |
| **FR-3** 归档后跳完整渲染 | Epic 2 | ≤ 1 跳转；revalidatePath；error.tsx fallback |
| **FR-4** 时间线卡片网格 | Epic 3 | 全量加载 + 缩略懒渲染 + 月份分隔 + 排序切换 |
| **FR-5** 完整渲染 · 基础 | Epic 2 | 单 Entry + sandbox + 返回时间线 + Top Chrome 简化 |
| **FR-5** 完整渲染 · 导航增强 | Epic 3 | 上一/下一 + 键盘 ← / → / Esc + 移动响应 |
| **FR-6** 私有访问 | Epic 1 | Auth.js + Resend + 邮箱白名单 + 30 天 session |
| **FR-7** Entry 事后管理 | Epic 4 | 编辑标题 / 下载 / 永久删除 + R2 cleanup |
| **NFR-1** HTML 沙箱化 | Epic 2（首次实装）+ Epic 3（缩略复用） | 同源 srcDoc + `sandbox=""` 锁定 |
| **NFR-2** 三层隔离 | Epic 1（应用层 + API 层）+ Epic 2（资源层 bucket 私有）+ Epic 4（资源层 presigned URL） | middleware + requireAlex + R2 + signed URL |
| **NFR-3** 错误隔离（软） | Epic 2（error.tsx + iframe onError）+ Epic 3（缩略失败不阻塞 timeline） | |
| **NFR-3** 数据持久（**hard**） | Epic 4 | Neon PITR + R2 11-9 + 周期跨服务备份 |
| **NFR-3** 浏览器覆盖（软）| Epic 1（Next.js 默认 browserslist） | |
| **NFR-3** 响应感（A7 软） | Epic 3（懒渲染 + loading.tsx）+ Epic 4（Vercel Analytics 监测） | |
| **SM-1 度量** | Epic 4 | Vercel Analytics + 30 分钟去重计量 |
