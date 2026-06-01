# Project Context Analysis

## Requirements Overview

**Functional Requirements（7 个 FR，组织为 4 类）：**

- **归档（§4.1 · FR-1/2/3）**：上传单 .html（≤ 10MB，扩展名 / 大小 / 单文件三层验证）、自动捕获元数据 + 服务端从 `<title>` 抽取建议标题（A1）、归档后立即跳完整渲染。事务性约束——任一环节失败不得残留半个 Entry。
- **时间线浏览（§4.2 · FR-4）**：响应式卡片网格（4/3/2/1 列断点）、HTML 内容缩略预览（OQ-8 方案 a 倾向）、双向排序切换（V1 不持久化）、月份分隔条、空状态、V1 全量加载所有元数据（A4，不分页）。
- **完整渲染（§4.3 · FR-5）**：iframe 沙箱化原貌呈现、顶部 chrome（标题 + 时间 + 返回 + 上一/下一）、移动端响应式、加载失败不影响归档状态。
- **私有访问与管理（§4.4 · FR-6/7）**：仅 alex 可访问（认证机制不锁）；30 天会话；多设备同时登录；编辑显示标题（Notion 风格 inline edit）、下载原 .html（**签名 URL + 短时效**）、永久删除（二次确认 + 硬删除）。

**Non-Functional Requirements（3 个 NFR）—— 真正驱动架构的核心：**

- **NFR-1 HTML 渲染沙箱化**：渲染上下文必须无法访问 MindPrint 的认证凭据 / 同源存储 / 应用私有 API；Entry 内 `<script>` 不能修改宿主 DOM / `top.location` / 通过 postMessage 获取应用状态。**机制开放**（iframe sandbox / 独立子域 origin / CSP / 组合），架构阶段决定。
- **NFR-2 私有访问三层隔离**：
  - **应用层**：未认证 URL 重定向至登录
  - **API 层**：所有端点 401（**非 404**，避免泄露 Entry 是否存在）
  - **资源层**：原始 .html 存储位置**不可猜测 / 枚举**——禁止纯 public URL
- **NFR-3 基本可靠性**（hobby 软目标，但**数据持久为 hard requirement**）：单条损坏不阻塞整体；归档后除非主动删除不得丢失；现代主流浏览器覆盖；响应感软目标（时间线首屏 < 2s @ 50 条目，Full Render < 1s）。

## Scale & Complexity

- **主要技术域**：全栈 web 应用（前端渲染 + 后端 API + 元数据 DB + 文件对象存储 + 认证）
- **复杂度级别**：**Medium-Low**——FR 数量少、单用户、无并发 / 协作 / 实时同步；但 NFR-1 沙箱化 + NFR-2 三层隔离 + 数据所有权张力把"hobby 简单"拉高一档
- **预估架构组件**：6 个（Web UI / Auth / Entry API / 元数据 DB / 文件对象存储 / 缩略预览生成路径）
- **数据规模预期**：5 年 N 百条 Entry（每条 ≤ 10MB），单用户 → 总规模约 GB 量级（hobby 项目无需分片 / 分库）

## Technical Constraints & Dependencies

**brief V1 硬约束：**
- 无自有服务器：基于 Vercel / Netlify / Cloudflare 等通用云 + 托管 DB / 对象存储
- 仅 alex 一人使用：无注册流程、无社交登录、无多租户

**架构阶段技术倾向（不锁定）：**
- **前端 / 全栈框架**：alex 倾向 Next.js（addendum §1.1）；若评估出更轻方案应优先采用
- **PWA 不在 V1 范围**（PRD §6.2）——原型 `pwa-explore/` 的 Service Worker 仅为试验

**Open Questions 与架构相关条目：**
- **OQ-4 HTML 资源完整性**：V1 不主动内联外链资源；架构阶段需决定是否给上传链路留"未来加内联化"的扩展点
- **OQ-8 缩略预览机制**：PRD 倾向方案 a（缩放 iframe + 视口懒渲染）；架构阶段需验证在 50/100 条规模下的性能可接受；**禁止静默降级**到方案 c（文本摘要）——若评估方案 a 性能不足，必须触发 PM 回顾

**原型代码已验证的事项**（来自 `prototype/pwa-explore/`）：
- iframe `sandbox=""`（最严格，所有能力默认禁用）+ srcDoc/src 模式可工作
- `transform: scale()` 缩放 iframe 实现缩略预览技术可行（OQ-8 方案 a）
- Next.js 16 + React 19 + Tailwind 4 栈基本可行
- 客户端按月分组 + 双向排序 + 相对/绝对时间格式化的纯前端逻辑工作良好
- **未验证但 V1 真实产品必须解决**：服务端持久化、认证、多设备访问、缩略预览在 50+ 真实条目下的性能

**原型代码的角色归类**（来自 step-02 elicitation · ADR 辩论 · 2 vs 1 / 3 vs 0 共识）：

- **✅ 应平移到 V1**：
  - 类型系统 `MockEntry` / `UserEntry` / `AnyEntry`（已与 PRD §3 Glossary 对齐）
  - 纯函数 `groupByMonth` / `sortEntries` / `getAdjacentEntries` / `relativeTime` / `absoluteTime` / `extractTitle`
  - **iframe 沙箱化基线**：`sandbox=""`（空属性 = 默认最严格）+ srcDoc（内联 HTML）/ src（远程 HTML）模式——锁定为 V1 NFR-1 实现基线
  - UI 组件契约（EntryCard / FullRender / ArchiveModal / Timeline 的行为模型，与 EXPERIENCE.md 对齐）

- **❌ 不进入 V1（throw-away spike 验证已完成）**：
  - IndexedDB 持久化层（`lib/entries-db.ts`、`useEntries` hook 的存储逻辑）——与 NFR-2 三层隔离 + 多设备访问要求不兼容
  - Service Worker / Serwist PWA 集成——PRD §6.2 V1 明确不做 PWA
  - `MOCK_ENTRIES` 种子数组——V1 从服务端获取

- **❓ 待 step-04 数据层决策**：
  - 元数据 schema 是否预留未来 OQ 字段（`content_hash` / `source_version` / `tags`）—— **YAGNI vs 5 年视角** 张力，留给数据层决策时按 OQ 优先级判断

## Cross-Cutting Concerns Identified

按对架构影响排序：

1. **HTML 渲染沙箱化机制**（NFR-1）——影响：UI iframe 策略、文件分发路径、可能需要独立子域 / CSP 头部
2. **认证机制**（NFR-2 + FR-6）——影响：所有 API 端点的中间件、session 存储位置、登录 surface 设计
3. **存储拓扑：元数据 DB vs 二进制资产对象存储**——影响：DB 选型（Supabase / Neon / Turso 等）、对象存储选型（自有 S3/R2 vs Supabase Storage，"数据所有权 vs 厂商绑定"张力的具体落地）、签名 URL 生成路径
4. **缩略预览生成机制**（OQ-8）——影响：客户端 iframe 懒渲染策略 + 性能；架构阶段需对 50/100 条规模做实测判断
5. **HTML `<title>` 抽取位置**（FR-2 A1）——客户端抽取（更轻但需 sandbox 解析）vs 服务端抽取（更可靠但额外往返）
6. **数据持久与备份**（NFR-3 hard requirement）——影响：是否需要跨区域备份 / 定期快照（hobby 项目的最小集合）
7. **原型→V1 资产迁移边界**（来自 ADR 辩论）——影响：哪些原型代码作为 V1 起点 vs throw-away；schema 演化策略（YAGNI 立场 vs 预留未来 OQ 字段）。
