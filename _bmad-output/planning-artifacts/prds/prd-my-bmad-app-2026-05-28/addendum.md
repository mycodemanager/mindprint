# Addendum · MindPrint PRD

> 承接 PRD 主文档之外、对下游（架构 / UX / 实现）有价值的信息：技术倾向、机制选项、被讨论但未入 PRD 的细节。

## 1. 技术倾向（用户在 PRD 阶段提及，留给架构阶段评估）

### 1.1 前端 / 全栈框架候选

- **Next.js**（alex 于 2026-05-28 提出）：与 brief 部署约束（通用云服务 + 托管 DB）契合；与 alex 前端背景匹配。
- **不锁定**：若架构阶段评估出更轻方案（例如纯静态 + edge function）应优先采用——PRD 不绑死框架。

## 2. Concern scan（下游必须正视的设计议题，部分已转化为 §Cross-Cutting NFRs，本节给出更详细的提示）

### 2.1 HTML 渲染的沙箱化（必入 NFR）

- **问题本质**：MindPrint 渲染的是用户输入的任意 HTML。即使唯一用户是 alex 自己，AI 生成的 HTML 仍属"untrusted input"——可能含 `<script>`，未沙箱化时能读取应用 cookie / localStorage / 越权调用应用 API。
- **PRD 转化**：作为 Cross-Cutting NFR——"任何 Entry 的渲染必须无法访问 MindPrint 应用的认证凭据、用户存储或同源数据"。
- **架构阶段候选方案**：iframe + `sandbox` 属性、独立子域名（`render.mindprint.xxx`）做 origin 隔离、CSP 策略隔离。**由架构决策**。

### 2.2 "数据所有权"与"无自有服务器"的张力

- **brief 立场**：alex 强调数据所有权，且明确"无自有服务器，用通用云服务 + 托管 DB"。
- **张力**：Supabase Storage / R2 / Vercel Blob 上的数据是不是真的算"alex 自己掌控"？取决于供应商绑定深度、迁出难度、文件存储格式是否标准。
- **架构阶段需权衡**：例如把对象存储放到 alex 自己的 S3 / R2 桶（用户级账号，可随时全量迁出），vs 直接用 Supabase Storage（集成简单但迁出门槛更高）。

### 2.3 单用户认证机制选择

- **PRD 立场**：能力要求是"只有 alex 能访问"，brief 明确"无注册流程、无社交"。
- **架构阶段候选**：magic link（任意设备首次访问邮箱接链）、单一长密码（每设备首次输入并记住）、passkey、IP 白名单 + 共享密码。**机制由架构定**，PRD 不指定。

### 2.4 卡片网格的 HTML 缩略预览机制

- **PRD 立场**（§4.2 FR-4 + A5）：能力要求是"卡片视觉上能看出原 HTML 大致长什么样"，**机制不锁**。
- **架构候选方案**：
  - **方案 a：缩放 iframe**——前端用 `<iframe sandbox>` 加载 Entry 的 HTML，CSS `transform: scale()` 缩放到卡片尺寸。**优点**：实现最轻、缩略图与渲染共用一份资产、HTML 改了卡片自动新。**缺点**：每张卡片都是真实 DOM 渲染，N 百卡片同屏性能成问题；可用 IntersectionObserver 做视口懒渲染缓解。
  - **方案 b：服务端截图**——上传时 server side 用 Puppeteer / Playwright 截一张缩略图存进对象存储，卡片直接展示静态图。**优点**：浏览端零渲染负担。**缺点**：架构复杂度大幅上升（serverless 跑 headless Chrome 不一定可行，需要单独的截图 worker），首个全栈项目复杂度过重。
  - **方案 c：首屏 HTML 文本提取**——只展示标题 + HTML 内的文本摘要 / 首段，不渲染缩略图。**优点**：实现极轻。**缺点**：违背"视觉上能看出长什么样"的体验目标——更像是"美化列表"而非真正的视觉档案。
- **架构阶段建议先评估方案 a**：缩放 iframe + 视口懒渲染 + 单卡片首屏渲染上限（例如卡片内的 `<script>` 禁用，仅渲染静态布局），在 hobby 复杂度内最贴近 PRD 体验目标。

### 2.5 上传时的 HTML 完整性

上传时的 HTML 资源完整性议题（外链 CDN / 图床离线后样式塌）—— V1 不处理，触发条件与决策见 PRD §9 OQ-4。
