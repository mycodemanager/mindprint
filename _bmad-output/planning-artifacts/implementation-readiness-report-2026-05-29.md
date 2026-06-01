---
date: 2026-05-29
project: my-bmad-app
assessmentType: implementation-readiness
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
documentsIncluded:
  prd: _bmad-output/planning-artifacts/prds/prd-my-bmad-app-2026-05-28/prd.md
  architecture: _bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/
  epics: _bmad-output/planning-artifacts/epics/epics-my-bmad-app-2026-05-28/epics/
  ux:
    - _bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md
    - _bmad-output/planning-artifacts/ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md
  brief: _bmad-output/planning-artifacts/briefs/brief-my-bmad-app-2026-05-28/brief.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-29
**Project:** my-bmad-app

## Step 1: Document Discovery

### PRD Files Found

**Whole Documents:**
- `prds/prd-my-bmad-app-2026-05-28/prd.md` (35 KB, 2026-05-28)

**Supporting / Working Documents (in same PRD folder):**
- `addendum.md` (4 KB) — PRD addendum
- `polish-prd-prose.md` (24 KB) — Prose polishing pass
- `polish-prd-structure.md` (13 KB) — Structure polishing pass
- `polish-addendum-prose.md` (10 KB)
- `polish-addendum-structure.md` (6 KB)
- `reconcile-brief.md` (16 KB) — Brief reconciliation log
- `review-rubric.md` (26 KB) — Review criteria
- `.decision-log.md` (15 KB) — Decision log

### Architecture Files Found

**Sharded Documents:**
- Folder: `architectures/architecture-my-bmad-app-2026-05-28/architecture/`
  - `index.md` (9 KB)
  - `core-architectural-decisions.md` (16 KB)
  - `implementation-patterns-consistency-rules.md` (22 KB)
  - `project-context-analysis.md` (7 KB)
  - `project-structure-boundaries.md` (32 KB)
  - `starter-template-evaluation.md` (5 KB)
  - `architecture-validation-results.md` (10 KB)

### Epics & Stories Files Found

**Sharded Documents:**
- Folder: `epics/epics-my-bmad-app-2026-05-28/epics/`
  - `index.md` (5 KB)
  - `overview.md` (0.5 KB)
  - `epic-list.md` (0.6 KB)
  - `requirements-inventory.md` (19 KB)
  - `epic-1-私人空间foundation-private-access.md` (16 KB)
  - `epic-2-归档第一份-entryfirst-archive.md` (12 KB)
  - `epic-3-时间线浏览与思维演进回看browse-timeline.md` (13 KB)
  - `epic-4-entry-管理-上线就绪entry-management-production-readiness.md` (17 KB)
  - `appendix-m3-retro-watch-list.md` (2 KB)

### UX Design Files Found

**Whole Documents (TWO):**
- `ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md` (17 KB)
- `ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md` (20 KB)
- Supporting: `reconcile-sources.md` (35 KB), `review-rubric.md` (22 KB), `.decision-log.md`

### Brief (Supporting Context)

- `briefs/brief-my-bmad-app-2026-05-28/brief.md` (5 KB)

### Issues Found

**Duplicates (PRD/Architecture/Epics):** None. No conflicting whole+sharded pairs detected.

**UX dual documents:** `DESIGN.md` and `EXPERIENCE.md` coexist — likely intentional split (visual/component design vs. experience flows). User confirmation needed before assessment proceeds.

**Missing standard documents:** None of the four core types (PRD, Architecture, Epics, UX) are missing.

---

## Step 2: PRD Analysis

### Source
- `prds/prd-my-bmad-app-2026-05-28/prd.md` (35 KB, status: final, version 1.0)
- `prds/prd-my-bmad-app-2026-05-28/addendum.md` (4 KB) — technical inclinations & concern scan

### Glossary Terms (Locked Vocabulary — FR/UX/Arch/Epics MUST use these exactly)
- **MindPrint** — product working name (pending final confirmation per OQ-1)
- **alex** — sole user
- **Entry** — a single archived .html (1 .html ↔ 1 Entry); content + metadata
- **元数据 (Entry Metadata)** — archive time, display title, original filename, file size
- **归档 (Archive)** — the act of bringing an external .html into MindPrint
- **时间线 (Timeline)** — main screen; all Entries by archive time, default reverse-chrono
- **完整渲染 (Full Render)** — sandboxed visual reproduction equivalent to double-clicking the .html in a browser

### User Journeys (UJs)
- **UJ-1** Find back an old Entry (drives FR-4, FR-5)
- **UJ-2** Archive a new Entry (drives FR-1, FR-2, FR-3)
- **UJ-3** Browse thinking evolution (drives FR-4, FR-5 sequential nav)

### Functional Requirements Extracted

**FR-1: 上传 .html 文件** (Realizes UJ-2)
- 拖拽 OR 点击选择,单文件 .html/.htm
- 其他扩展名拒绝并提示
- 单文件 ≤ 10MB (ASSUMPTION A2),超限拒绝
- V1 仅单文件,多选触发提示
- 上传失败可重试;失败不残留半个 Entry(事务性)
- **Out of scope**: 批量上传、内容去重

**FR-2: 自动捕获元数据 + 可编辑显示标题** (Realizes UJ-2)
- 自动捕获不可编辑: 归档时间戳(UTC)、原始文件名、字节大小
- 自动捕获可编辑: 显示标题(从 `<title>` 抽取,空则 fallback 原始文件名去扩展名)(ASSUMPTION A1)
- 归档前预览界面 + 标题预填编辑框
- 显示标题 ≤ 200 字符(ASSUMPTION A3)
- "确认"完成归档 / "取消"丢弃
- 归档时间戳写入后不可修改

**FR-3: 归档成功后进入完整渲染** (Realizes UJ-2 → UJ-1 衔接)
- 归档成功 ≤ 1 次跳转到 Full Render
- 新 Entry 立即出现在时间线顶部
- 即便渲染失败,归档仍视为成功(Entry 已入库)
- 提供"返回时间线"导航

**FR-4: 时间线卡片网格主屏** (Realizes UJ-1, UJ-3)
- 响应式卡片网格(宽屏多列,窄屏少列)
- 卡片三类信息: 显示标题 + HTML 内容缩略预览 + 归档时间(相对+hover绝对)
- 缩略预览三条可验收: (a) 呈现颜色/字体/布局 (b) 不同 HTML 可视化区分 (c) 失败 fallback "标题+时间"占位卡,**不得静默降级到文本摘要**
- 缩略预览共享 NFR-1 沙箱化约束
- 默认倒序;可切换正序;V1 不持久化偏好
- 单击卡片 → Full Render
- 月份分隔条(无折叠);语义角色是思维演进锚点
- 空状态有引导
- V1 全量加载元数据(ASSUMPTION A4);缩略预览可视口懒加载
- **Out of scope**: 标签/搜索/过滤、列表视图切换、hover 预览/右键菜单、分页、行内删除/编辑

**FR-5: 完整渲染单一 Entry** (Realizes UJ-1, UJ-2 衔接, UJ-3)
- 渲染区域全屏式
- 视觉上等同于双击 .html 打开浏览器(除沙箱必要副作用)
- 顶部 chrome: 显示标题 + 归档时间(绝对) + 返回时间线
- "上一条/下一条 Entry"导航,方向跟随时间线排序
- 加载失败显示错误信息,保留返回出口;Entry 仍在档案库
- 响应式(移动浏览器同样)
- 渲染容器必须无法访问 MindPrint 凭据/同源存储/应用 API(NFR-1)
- **Out of scope**: 沉浸全屏模式、HTML 内容编辑、(下载已归 §4.4)

**FR-6: 私有访问控制(认证)** (NFR-2 源头)
- 任何未认证请求一律拒绝并引导至登录
- 默认会话 30 天(ASSUMPTION A6)
- 认证机制由架构决定(magic link / 单密码 / passkey / 等)
- 支持多设备同时登录(brief V1 硬约束)
- **Out of scope**: 多用户、双因素、设备管理面板
- **依赖关系**: FR-6 是 FR-1~FR-7 的前置依赖

**FR-7: Entry 事后管理动作** (Realizes UJ-1/2/3 长期可持续)
- 三个子动作: 编辑显示标题 / 下载原 .html / 永久删除
- 所有入口集中在 Full Render 视图(具体位置 UX 决定)
- **编辑标题**: 立即生效,时间线 + chrome 同步;归档时间不变;≤ 200 字符
- **下载**: 文件名以当前显示标题(中文兼容,非法字符替换下划线),字节级等同原文件
- **永久删除**: 必须二次确认;不可撤销(V1 无垃圾桶);删除后跳回时间线;同时清理 HTML+元数据+缩略预览
- **Out of scope**: 批量管理、软删除/回收站、全量导出(关联 OQ-7)、HTML 内容编辑

**Total FRs: 7**

### Non-Functional Requirements Extracted

**NFR-1: HTML 渲染沙箱化** (引用于 FR-4 缩略 + FR-5 Full Render)
- 凭据隔离: 渲染上下文无法访问 Cookie/Session/localStorage/sessionStorage/IndexedDB/应用 API
- 行为隔离: Entry HTML 内 `<script>` 不能修改宿主 DOM/top.location/parent,不能通过 postMessage 获取应用状态(除非白名单)
- 机制开放: iframe sandbox / 独立子域名 / 严格 CSP / 组合,由架构决定(addendum §2.1)

**NFR-2: 私有访问(仅 alex)** (FR-6 源头)
- 应用层: 未认证 URL 重定向到登录
- API 层: 未认证 API 返回 401(不返回部分数据/不返回提示,避免泄露 Entry 是否存在)
- 资源层: 原始 .html 存储位置不可通过猜测/枚举 URL 直接访问,必须经过认证
- 机制由架构决定(magic link / 单密码 / passkey / IP 白名单 + 共享密码)(addendum §2.3)

**NFR-3: 基本可靠性(hobby 最小集合)**
- 错误隔离: 单条 Entry 损坏不阻塞时间线整体;Full Render 失败仍能"返回时间线"
- **数据持久 (HARD)**: 归档完成的 Entry 除非 alex 主动 FR-7 删除否则不得丢失 — **本节唯一硬约束**
- 浏览器覆盖: Chrome / Safari / Firefox 最新桌面版 + iOS Safari / Android Chrome 最新移动版
- 响应感(软目标): 时间线首屏 < 2 秒(50 条以内);Full Render 进入 < 1 秒(ASSUMPTION A7) — 未达成不阻塞上线

**Total NFRs: 3**

### Constraints & Assumptions

**Assumptions A1-A7:** 标题抽取规则、10MB 上限、200 字符标题、全量加载、缩略预览机制不锁(倾向方案 a)、30 天会话、响应感软目标

**Technical inclinations (addendum §1):**
- Next.js (候选,不锁定)
- 通用云服务(Vercel/Netlify/Cloudflare)+ 托管 DB

**Brief V1 硬约束:**
- alex 在任意设备的浏览器都能访问(移动响应式必备)
- 无自有服务器
- 数据所有权(部分通过 FR-7 下载承接,全量导出 V1 不做 — OQ-7 标记为"OQ 中最高")

### Out of Scope (Forbidden in V1)

参见 PRD §6:
- 永久边界: 多用户、协作、公开分享、AI 自动生成、内置编辑器、与替代品功能性对照
- V1 暂不做: PWA/原生 App、自动 ~/Downloads 同步、标签/搜索/过滤、版本对比/历史快照、批量管理、全量导出(OQ-7)、内容去重(OQ-3)、HTML 内容编辑、沉浸全屏(OQ-6)、2FA、列表视图、时间线行内操作

### Success Metrics

- **Primary**: SM-1 (3 个月内打开 ≥ 8 次,验 FR-4/FR-5)、SM-2 (0 起丢失,验 FR-1/FR-2/FR-7)、SM-3 (80% 新产出归档,验 FR-1)
- **Secondary**: SM-4 (BMAD 全流程)、SM-5 (前+后+DB+部署全栈)、SM-6 (3 月不被迫重构)
- **Counter-metrics**: SM-C1 (不优化归档数量)、SM-C2 (不优化打开频次,禁止推送/通知)、SM-C3 (低使用率反思是否需要而非加功能)
- **Milestones**: M1 V1 上线 / M2 50+ 条 / M3 三月稳定

### Open Questions (8)
OQ-1 产品名 / OQ-2 撤销归档 / OQ-3 去重 / OQ-4 资源完整性 / OQ-5 排序持久化 / OQ-6 沉浸全屏 / OQ-7 全量导出(优先级最高) / OQ-8 缩略预览机制

### PRD Completeness Assessment

✅ **强项:**
- 术语表锁定 — Glossary 强制下游使用,避免同义词漂移
- FR 全局编号 + 每条含"测试性后果(Consequences)"(可验收)
- NFR 在被多个 FR 引用前集中定义,避免重复表达
- FR-6 显式标注"为 FR-1~FR-7 的前置依赖" — 史诗顺序的关键约束
- 假设 A1-A7、OQ-1~OQ-8 集中索引,M3 retro 触发条件明确
- Counter-metrics 防止过度优化错误方向 — hobby 项目少见的成熟设计
- Brief 与 PRD 立场张力(数据所有权 vs V1 仅单条下载)被显式标记为 OQ-7,未隐藏

⚠️ **下游需关注的点:**
1. **FR-4 缩略预览**有显式"不得静默降级"的硬约束 — 架构若评估方案 a 不足必须触发 PM 回顾
2. **NFR-2 三层隔离**对资源层(原始 .html 直链)有明确禁止 — 架构必须覆盖
3. **FR-6 是 FR-1~FR-7 前置依赖** — 史诗排序必须把认证放在最早(epic-1 候选)
4. **NFR-3 唯一硬约束是"数据持久"** — 实施时需要明确测试

---

## Step 3: Epic Coverage Validation

### Source
- Epic index: `epics/epics-my-bmad-app-2026-05-28/epics/index.md`
- Epic list: `epic-list.md` (4 epics / 18 stories)
- Requirements inventory: `requirements-inventory.md` (含 FR Coverage Map)
- Per-epic files: epic-1 ~ epic-4

### Epic Structure Overview

| # | Epic | 用户成果 | Claimed FRs | Stories |
|---|------|---------|-------------|---------|
| 1 | **私人空间**(Foundation & Private Access) | 登录 + 视觉调性正确的空主屏 | FR-6 | 5 |
| 2 | **归档第一份 Entry**(First Archive) | 拖入 .html → 沙箱化呈现 | FR-1, FR-2, FR-3, FR-5(基础) | 3 |
| 3 | **时间线浏览 + 思维演进回看**(Browse Timeline) | 卡片网格 + 排序 + 上一下一 | FR-4, FR-5(增强) | 5 |
| 4 | **Entry 管理 + 上线就绪**(Entry Management & Production Readiness) | 改名/下载/删除 + 备份 + 度量 | FR-7 | 5 |
| | | **Total** | | **18** |

### FR Coverage Matrix (PRD ↔ Epics)

| FR | PRD 描述 (摘) | Epic 覆盖 | 状态 |
|----|--------------|-----------|------|
| **FR-1** | 拖拽/选择上传 .html (10MB/事务性) | Epic 2 (Story 2.2) | ✓ Covered |
| **FR-2** | 自动捕获元数据 + 可编辑标题 (200 字符/`<title>` 抽取) | Epic 2 (Story 2.2 ArchiveModal) | ✓ Covered |
| **FR-3** | 归档成功 ≤1 跳进 Full Render | Epic 2 (Story 2.3) | ✓ Covered |
| **FR-4** | 时间线卡片网格 + 缩略 + 月份分隔 + 排序 | Epic 3 (Stories 3.1, 3.2, 3.3) | ✓ Covered |
| **FR-5** 基础 | Full Render 沙箱化、返回时间线 | Epic 2 (Story 2.3) | ✓ Covered |
| **FR-5** 增强 | 上一/下一 + 键盘 + 移动响应 | Epic 3 (Stories 3.4, 3.5) | ✓ Covered |
| **FR-6** | 私有访问 / 认证 / 30 天会话 / 多设备 | Epic 1 (Story 1.3) | ✓ Covered |
| **FR-7** | 编辑标题 / 下载 / 永久删除 | Epic 4 (Stories 4.1, 4.2, 4.3) | ✓ Covered |

### NFR Coverage Matrix

| NFR | PRD 描述 (摘) | Epic 覆盖 | 状态 |
|-----|--------------|-----------|------|
| **NFR-1** HTML 沙箱化 | 凭据/行为隔离, 同源 srcDoc + `sandbox=""` | Epic 2 (首次实装 - Story 2.3) + Epic 3 (缩略复用 - Story 3.2) | ✓ Covered |
| **NFR-2** 三层隔离 · 应用层 | 未认证页面重定向 | Epic 1 (Story 1.3 middleware) | ✓ Covered |
| **NFR-2** 三层隔离 · API 层 | 401 + 空 body, 非 404 | Epic 1 (Story 1.3 requireAlex helper) | ✓ Covered |
| **NFR-2** 三层隔离 · 资源层 | R2 bucket 禁用 public + presigned URL 5 分钟 | Epic 2 (bucket - Story 2.1) + Epic 4 (presigned URL - Story 4.2) | ✓ Covered |
| **NFR-3** 错误隔离 (软) | 单条损坏不阻塞时间线 | Epic 2 (error.tsx + iframe onError) + Epic 3 (缩略失败) | ✓ Covered |
| **NFR-3** 数据持久 (**HARD**) | 三重保险 Neon PITR + R2 11-9 + 周期备份 | Epic 4 (Story 4.5 备份兜底) | ✓ Covered |
| **NFR-3** 浏览器覆盖 (软) | Next.js 默认 browserslist | Epic 1 | ✓ Covered |
| **NFR-3** 响应感 (软目标 A7) | 时间线 < 2s, Full Render < 1s | Epic 3 (懒渲染) + Epic 4 (Vercel Analytics 监测) | ✓ Covered |

### Success Metric (SM-1 度量) 覆盖

| SM | Epic 覆盖 | 状态 |
|----|-----------|------|
| **SM-1** alex 打开 ≥ 8 次/3 月 (服务端记录 + 30 分钟去重) | Epic 4 (Story 4.4 Vercel Analytics) | ✓ Covered |
| SM-2 / SM-3 / SM-4 / SM-5 / SM-6 | alex 自我评估,**架构无实现需求** | ✓ No code work needed |
| **SM-C2 (不通知)** 反向指标 | requirements-inventory 显式标注:"不引入推送/邮件提醒/红点" | ✓ Constraint encoded |

### Additional / UX / Architecture Requirements 覆盖

PRD 之外,epics 文档还显式覆盖了:

- **Additional Requirements (架构衍生)**: Starter Template、原型平移、数据层 (Neon + Drizzle + 5 表 schema)、认证 (Auth.js + Resend + 邮箱白名单)、对象存储 (R2 + presigned URL)、API 风格 (RSC 直查 + Server Actions + Route Handlers)、Zod schema 集中化、Vercel 部署、typed env、CI/CD、备份、日志 → **分布于 Epic 1/2/4**
- **UX Design Requirements UX-DR1 ~ UX-DR32 (32 条)**: 设计 token、12 个组件、12 种状态契约、键盘 / 焦点 / 移动退化、WCAG 2.2 AA、Reduced motion、4 断点响应式、Voice & Tone → **主要分布于 Epic 1 (视觉系统 + Auth)、Epic 2 (Card/Dropzone/UploadPreview/FullRender)、Epic 3 (Card 完整版 + Sort + 响应式)、Epic 4 (Inline Editor + MoreMenu + ConfirmDialog)**

### Coverage Statistics

- **PRD FRs**: 7
- **FRs covered in epics**: 7
- **Coverage percentage**: **100%**
- **PRD NFRs**: 3 (NFR-3 拆出 4 个子条款)
- **NFRs covered in epics**: 3 (全部子条款)
- **Coverage percentage**: **100%**

### Missing Requirements

✅ **未发现 PRD FR/NFR 缺口** — epics 100% 覆盖 PRD §4 全部 7 个 FR 和 §5 全部 3 个 NFR (含 NFR-3 的所有子条款)

### Reverse Check — Epic 中是否有"PRD 没要求"的额外项

发现两类额外项,均合理:

1. **架构衍生项 (Additional Requirements)** — 实现 V1 必需但 PRD 不直接表达,例如:Starter Template 选择、Neon + Drizzle schema 设计、Auth.js + Resend 集成、R2 bucket / IAM / presigned URL、CI/CD、备份脚本。这些是 PRD → Architecture → 工程化所必需的衍生需求,标注清晰,不属于范围蔓延。

2. **UX 衍生项 (UX-DR1~32)** — DESIGN.md + EXPERIENCE.md 中所有可实施视觉与交互契约。归类为 Story 工作项,标注源头清晰。**不属于范围蔓延**。

⚠️ 注意:Story 4.5 "ESLint 自定义规则" 看起来超出常规 V1 范围。下一步会在 Step 5 史诗质量审查中核查必要性。

### PRD ↔ Epics 术语一致性

✅ overview.md 显式声明:"glossary 严格 — 本文档使用 PRD §3 Glossary 术语 (Entry / 归档 / 时间线 / 完整渲染 / 元数据)。下游 stories 不得使用同义词。" — 术语锁定下游,符合 PRD §3 的术语强制约束。

### 关键发现

- 🟢 **FR/NFR 100% 覆盖,无缺口**
- 🟢 **依赖序列正确**: Epic 1 (FR-6 认证) 在最早,符合 PRD "FR-6 是 FR-1~FR-7 前置依赖" 的硬约束
- 🟢 **NFR-3 硬约束 (数据持久)** 显式锁定到 Epic 4 (备份兜底),不是软指标处理
- 🟢 **FR-4 缩略预览的"不得静默降级"约束** 在 UX-DR22 中重复显式表达
- 🟢 **NFR-1 实现机制已锁定**: PRD 留给架构决定 → 架构定为"同源 srcDoc + `sandbox=""`" → epics 显式记录
- 🟡 **OQ-1 产品名"MindPrint"** 仍标 "工作名 (待最终确认)" — epic 文档已大量使用,实际已成事实命名,建议视为 OQ-1 关闭
- 🟡 **OQ-7 全量导出 (PRD 标"OQ 中最高")** epics 中未做 — 与 PRD §6.2 一致,但 M3 retro 时需关注

---

## Step 4: UX Alignment Assessment

### UX Document Status

✅ **Found** — UX 文档由两份对等(peer)文件组成,设计**有意拆分**且明确角色:

- **DESIGN.md** (17 KB) — 视觉层契约: tokens (colors / typography / rounded / spacing) + Brand & Style + Components 视觉规格 + Do's / Don'ts
- **EXPERIENCE.md** (20 KB) — 行为契约: IA + Voice & Tone + Component Patterns (行为约束) + State Patterns + Interaction Primitives + Accessibility Floor + Key Flows (3 个 UJ 完整剧本) + Inspiration & Anti-patterns + Responsive & Platform

两份文档 frontmatter 互相 `peer:` 引用 + 跨引用 token (`{DESIGN.md}.Components.Card`),关系清晰。

辅助产物:`reconcile-sources.md` (35 KB,源材料对齐过程)、`review-rubric.md` (22 KB,审查标准)、`mockups/timeline-mock.html` + `mockups/full-render-mock.html`(spine 与 mock 冲突时 spine 胜出)。

### UX ↔ PRD Alignment

| 维度 | PRD 来源 | UX 兑现 | 状态 |
|------|---------|---------|------|
| **术语** | PRD §3 Glossary (Entry/归档/时间线/Full Render/元数据) | EXPERIENCE.md + DESIGN.md 严格使用 | ✓ |
| **UJ-1 找回旧 Entry** | PRD §2.2 | EXPERIENCE.md Key Flow 1 完整剧本 + IA 落点 (时间线 + Full Render) | ✓ |
| **UJ-2 归档新 Entry** | PRD §2.2 | EXPERIENCE.md Key Flow 2 完整剧本 + IA 归档 modal + Full Render | ✓ |
| **UJ-3 思维演进回看** | PRD §2.2 | EXPERIENCE.md Key Flow 3 完整剧本 + 上一/下一键盘导航 | ✓ |
| **FR-1 上传** | PRD §4.1 | Dropzone (空+有 Entry) + 整屏 drag listener + 10MB 报错 inline | ✓ |
| **FR-2 元数据 + 标题** | PRD §4.1 | Upload Preview Form + 预填编辑框 + 时间戳 mono 只读 | ✓ |
| **FR-3 归档跳渲染** | PRD §4.1 | modal 关闭 → 自动跳 Full Render (Key Flow 2 Climax) | ✓ |
| **FR-4 时间线卡片** | PRD §4.2 | Card + Month Divider + Sort Toggle + IA 主屏 + Empty State | ✓ |
| **FR-4 D9c "不得静默降级"** | PRD §4.2 硬约束 | UX-DR22 + EXPERIENCE.md State Patterns 重复表达 | ✓ |
| **FR-5 完整渲染** | PRD §4.3 | Top Chrome + 上一/下一 + 沙箱 iframe + 加载失败"渲染未能完成" | ✓ |
| **FR-6 私有访问** | PRD §4.4 | Auth Screen (极简 wordmark + 单一入口) + State Patterns 未认证/会话过期 | ✓ |
| **FR-7 管理动作** | PRD §4.4 | More Menu (⋯) + Inline Title Editor + Confirm Dialog | ✓ |
| **FR-7 删除二次确认** | PRD §4.4 | Confirm Dialog "确认删除? / 删除后无法恢复" (措辞硬约束) | ✓ |
| **NFR-1 沙箱化** | PRD §5 | EXPERIENCE.md Foundation 显示 "沙箱化是产品 DNA" + Component Patterns 注释 | ✓ |
| **NFR-2 三层隔离** | PRD §5 | State Patterns 未认证 (应用层重定向 + API 401) + Download Link 资源层签名 URL | ✓ |
| **NFR-3 数据持久** | PRD §5 hard | UX 不直接表达 (架构层职责) — 通过 Voice "已归档/已删除" 文案对消恐慌 | ✓ (合理分工) |
| **Counter-metric SM-C2 不通知** | PRD §8.3 | Inspiration & Anti-patterns 显式 "Rejected — 推送/邮件/红点/通知" | ✓ |

**结论**: UX **100% 兑现 PRD UJ + FR + NFR**,且对硬约束(如缩略不得静默降级、删除措辞)做了重复显式表达,防止下游遗忘。

### UX ↔ Architecture Alignment

| 议题 | UX 期望 | 架构决策 | 状态 |
|------|---------|---------|------|
| **沙箱化机制** | EXPERIENCE.md "Foundation" 留给架构定 + DESIGN.md Card 注释"机制 spine 不锁" | 锁定为 **同源 srcDoc + `sandbox=""`** (opaque origin) | ✓ 架构补 UX 缺口 |
| **缩略预览机制** | UX-DR22 要求懒渲染 + 不得静默降级 | 方案 a 缩放 iframe + IntersectionObserver 视口外占位 + onError fallback 标题+时间 | ✓ |
| **认证机制** | UX 仅要求"机制由架构决定 + 极简 wordmark + 邮箱单一入口" | Auth.js v5 + Resend Magic Link + 邮箱白名单 | ✓ |
| **暗色模式** | DESIGN.md 完整 dark tokens + EXPERIENCE.md "跟随系统 prefers-color-scheme" | 架构 Frontend 节未显式提及,但 Tailwind config + DESIGN.md tokens 绑定 → 可实现 | 🟡 见下方警告 |
| **响应式断点** | DESIGN.md / EXPERIENCE.md 锁定 4 断点 (768/1024/1440) | 架构未独立断点决策 — 通过 Tailwind 默认行为承担 | ✓ |
| **Tailwind tokens 绑定** | DESIGN.md frontmatter 大量 token 等待桥接 | 架构 Deferred Decisions 标 "Tailwind tokens 与 DESIGN.md 绑定 → 实现阶段 Story 0" | ✓ |
| **键盘可达性** | EXPERIENCE.md Interaction Primitives 8 个全局快捷键 | 架构 Frontend 显式列 `FullRenderKeyboard.tsx` Client Component | ✓ |
| **iframe srcDoc 内容流** | UX 要求"内容代理不进 DOM" | 架构定 Route Handler `/api/entry/[id]/html` 流式 fetch R2 → Response → 喂 srcDoc | ✓ |
| **WCAG 2.2 AA** | EXPERIENCE.md Accessibility Floor 完整契约 | 架构未独立列 a11y 章节,但平移自原型 + 视觉对比度由 DESIGN.md tokens 承担 | 🟡 见下方警告 |
| **Reduced motion** | UX-DR30 + EXPERIENCE.md Key Flow 3 注释 | 架构未独立提及 — 由 CSS media query 实现层承担 | ✓ (CSS 范畴) |
| **跨设备同步 [ASSUMPTION]** | UX State Patterns "V1 不处理实时同步,手动刷新" | 架构无 polling/WebSocket — 一致 | ✓ |

### UX 引入的 V1 新承诺

⚠️ **EXPLICIT NEW SCOPE**: 暗色模式

DESIGN.md 显式声明:
> 暗色版本以"夜读灯下的旧书皮"为基调——背景深墨绿黑 `#1A1B19`,文字象牙白 `#F0EDE5`,主色倒置为暖米色 `#E0C1A1`。**这是 brief / PRD 未明示但 alex 在 UX Discovery 阶段显式扩展进 V1 的承诺(2026-05-28),架构 / dev 阶段必须实现。**

**追踪状态:**
- ✓ UX 文档已完整定义所有 dark tokens
- ✓ Epics requirements-inventory 已纳入 UX-DR3
- ✓ Epic 1 Story 1.4 显式包含"视觉系统 + 暗色模式"
- 🟡 架构 `core-architectural-decisions.md` 未独立提及暗色模式机制 (`prefers-color-scheme: dark`) — 通过 Tailwind 4 + DESIGN.md tokens 承担,实施时需验证 Tailwind 4 暗色 strategy 设置正确

### UX 文档结构一致性

- DESIGN.md ↔ EXPERIENCE.md 互为 peer,通过 `{DESIGN.md}.Components.Card` 等跨引用绑定
- 两份文件 frontmatter `status: final` + 同日期(2026-05-28),版本一致
- 两份文件 sources 引用 PRD + brief + addendum,且来源相同

### Alignment Issues

✅ **未发现实质冲突或缺口**。

### Warnings (下游需补充验证)

1. 🟡 **暗色模式实施细节**: 架构未独立提及,建议在 Epic 1 Story 1.4 验收时显式确认 Tailwind 4 dark mode strategy (建议 `class` 或 `media`) 与 DESIGN.md `dark-*` token 的桥接方式
2. 🟡 **WCAG 2.2 AA 验证机制**: EXPERIENCE.md 声明全 surface 覆盖但架构未列出 a11y 自动化测试,建议 dev 阶段加 axe-core 或 Playwright a11y 断言
3. 🟡 **Mocks 状态**: `mockups/timeline-mock.html` + `mockups/full-render-mock.html` 是 UX 视觉验证产物,实施时 spine 优先 (UX 已显式声明此规则)

---

## Step 5: Epic Quality Review

> 应用 create-epics-and-stories 最佳实践严格审查。每条违规按严重度分级:🔴 Critical / 🟠 Major / 🟡 Minor。

### Epic-Level Review

#### Epic 1: 私人空间 (Foundation & Private Access)

| 维度 | 评估 |
|------|------|
| **Epic Title** | "私人空间" — 用户视角 (alex 的空间),非技术里程碑 ✓ |
| **Epic Goal** | "alex 能在任意设备的浏览器访问到一个已认证、视觉调性正确的 MindPrint,看到空状态主屏" — 清晰用户成果 ✓ |
| **User Value** | 登录 + 看到调性正确的空主屏 — alex 单独验收时**可感知** ✓ |
| **Standalone Test** | 明确写出: vercel.app → 邮箱 → 收 Magic Link → 看 Empty State ✓ |
| **FR/NFR Coverage** | FR-6 + NFR-2 应用层/API 层 ✓ |
| **Forward Dependencies** | 无 — 所有依赖均向前(自身基础) ✓ |
| **Story 数量** | 5 — 合理 |

**Story 1.1 (项目初始化 + 原型平移)**:
- ✓ User story 格式 + 清晰承诺
- ✓ "平移即净化" 显式 grep 检查 `IndexedDB/Serwist/MOCK_ENTRIES` 零匹配 — 是非常成熟的反复发明防护
- 🟡 **Minor**: 此 Story 严格说是 "Story 0" 模式 (技术基础设施),对 alex 无直接价值。但作为 greenfield 启动是合理且必要的。架构 `starter-template-evaluation.md` 已要求 starter template setup → 这正是其落地。**该写法在 PRD §6.1 和最佳实践之间正确平衡**。

**Story 1.2 (Drizzle + 5 表 schema)**:
- 🟡 **Minor**: 一次性创建 5 表(4 Auth.js + entries),其中 entries 表只在 Epic 2 用到。最佳实践推荐 "tables created when needed",但:
  - Auth.js drizzle adapter 期望特定 schema 形状 → 必须先定
  - Drizzle 单次 migration 与分两次成本一样
  - schema-as-code 一次 commit 易于阅读
  - **判定**: 合理偏差,显式注释 "no `deleted_at` / no future-OQ columns" 显示克制
- ✓ AC 覆盖 schema 字段、index、`drizzle-kit push` 烟雾测试、Drizzle Studio 验证

**Story 1.3 (认证基线)**:
- ✓ AC 包含**攻击场景验证**: "非白名单邮箱 → signIn callback 返回 false → 不发邮件、不写 verification_token → UI 仍跳 verify-request(避免泄露白名单成员身份)"。这是 PRD/UX 都没显式表达的实施层安全细节,质量极高。
- ✓ Voice & Tone 严格 (邮件模板"陈述/无 emoji")
- ✓ 三层隔离均有 AC: middleware(应用层) + requireAlex(API 层) + 401 空 body

**Story 1.4 (视觉系统)**:
- ✓ 暗色模式承诺 V1 明确实施 — 解决 Step 4 UX 警告
- ✓ AC 含 dark mode token 倒置 + reduced motion + a11y focus ring + 思源宋体 fallback
- ✓ 显式声明 "不为 Story 7 预留 — 所有视觉设计在本 Story 完成"
- 🟢 优秀: voice 字典 `lib/voice.ts` 集中化 ≥ 12 个 microcopy 字符串

**Story 1.5 (首次云部署)**:
- ✓ 含**实地多设备测试**验证 FR-6: "alex 在 iPhone Safari 访问同一 URL → 可同时登录 + 视觉响应式 + 暗色跟随手机系统"
- ✓ AUTH_SECRET 永久性警告 (变了 session 全失效) — 实施层细节
- ✓ R2 凭据占位策略 (Epic 2 填真值后 redeploy) — 清晰说明阶段性配置

**Epic 1 总评**: 🟢 优秀

---

#### Epic 2: 归档第一份 Entry (First Archive)

| 维度 | 评估 |
|------|------|
| **Epic Title** | "归档第一份 Entry" — 用户视角 ✓ |
| **Epic Goal** | "拖入 .html → 沙箱化呈现" — 清晰用户成果 ✓ |
| **User Value** | alex 完成第一次归档并看到 Full Render — 实质用户价值 ✓ |
| **Standalone Test** | 明确 + **诚实声明阶段性**: "本 epic 完成时主屏看起来仍是空(Epic 3 才接入 timeline 渲染),但归档动作已完整工作 — 刷新页面 Entry 不丢失" ✓ |
| **FR/NFR Coverage** | FR-1, FR-2, FR-3, FR-5(基础), NFR-1 首次实装, NFR-2 资源层 ✓ |
| **Forward Dependencies** | 无 ✓ |
| **Story 数量** | 3 — 紧凑合理 |

**Story 2.1 (R2 存储基础)**:
- 🟡 **Minor**: 与 Story 1.1 类似的 "技术基础设施" 模式 — 单独无 user value。但:
  - 是 Story 2.2/2.3 的强前置依赖 (R2 bucket + IAM token + helper 模块)
  - Standalone Test 明确测试 R2 私有性 ("直接访问公开 URL → 403")
  - 烟雾测试 (upload + fetch + 字节对比) 是有效验证手段
- ✓ 配置细节完整 (S3 兼容 endpoint, region "auto", `mindprint-entries` bucket name)

**Story 2.2 (归档链路)**:
- ✓ 事务性回滚极清晰: "R2 上传 → Drizzle insert → catch DB 失败 → deleteEntryHtml rollback → 错误返回" — 实施层显式保证 FR-1 "失败不残留半个 Entry"
- ✓ `useFormState` + ActionResult 类型契约 — 与架构 "Server Action 必须返回不抛 throw" 一致
- ✓ Next.js 16 配置细节: `experimental.serverActions.bodySizeLimit` 调到 10MB+
- ✓ 后置验证: Drizzle Studio + R2 dashboard

**Story 2.3 (Full Render 基础)**:
- ✓ 沙箱化攻击向量测试: "HTML 含 `<script>document.cookie</script>` 或 `<script>parent.location='https://attacker.com'</script>` → iframe 内 script 不执行"
- ✓ 401 验证: "未登录浏览器直接访问 `/api/entry/<some-uuid>/html` → 返回 401 + 空 body (不返回 404)" — NFR-2 资源层显式 AC
- ✓ Next.js 16 异步 params 细节
- ✓ iframe src 走 Route Handler 而非 R2 直连 — UX 期望的 "签名 URL 不进 DOM"

**Epic 2 总评**: 🟢 优秀

---

#### Epic 3: 时间线浏览 + 思维演进回看 (Browse Timeline)

| 维度 | 评估 |
|------|------|
| **Epic Title** | "时间线浏览 + 思维演进回看" — 用户视角 ✓ |
| **Epic Goal** | "卡片网格 + 排序 + 上一/下一" — 清晰用户成果 ✓ |
| **User Value** | 浏览所有 Entry + 感受思维演进 (UJ-1 + UJ-3) ✓ |
| **Standalone Test** | 完整: 5 条 Entry → 看到网格 → 切排序 → 单击进 Full Render → 按 → 进下一条 ✓ |
| **FR/NFR Coverage** | FR-4, FR-5(增强), NFR-1 缩略, NFR-3 错误隔离 + 响应感 ✓ |
| **Forward Dependencies** | **检查项见下** |
| **Story 数量** | 5 — 合理 |

**Forward Dependency 详查**:
- Story 3.3 Implementation Notes 提到 "归档按钮 onClick 触发隐藏 file input,Story 2.2 接入" — 这是**后向依赖** (引用已完成的 Epic 2),不是 forward dependency ✓
- Story 3.5 提到 "⋯ More menu 变底部 sheet(不是 dropdown,Story 4.1 实施时按此约定)" — 🟡 **Minor**: 这是给后续 Story 4.1 设契约,Story 3.5 本身完整(只需 Story 3.5 完成的 chrome 紧凑化即可独立测试)。**判定为约定,非 forward dependency**。但可写得更清楚一些 (例如:"Story 4.1 实施 More menu 时需遵守此移动端约定")。

**Story 3.1 (主屏 + Skeleton)**:
- ✓ EmptyState ↔ Timeline 切换逻辑清晰
- ✓ Next.js 16 异步 searchParams 注释
- ✓ 显式 "不引入 SWR/TanStack Query" — 防止下游过度引入

**Story 3.2 (卡片网格 + Thumbnail)**:
- ✓ ThumbnailIframe 是核心组件,AC 含 IntersectionObserver root margin "200px"、transform scale(0.4)、onError fallback
- ✓ **再次重复硬约束**: "iframe onError → setLoadFailed → 退化 '标题 + 时间' 占位 (**禁退化到文本摘要**)" — 第三层防护(PRD + UX + epic)
- ✓ a11y: `aria-hidden="true" tabIndex={-1}` 让 SR 不读 iframe 内 HTML

**Story 3.3 (SortToggle)**:
- ✓ URL state via `router.replace` (不污染历史栈)
- ✓ 不持久化 — 显式测试: "切到正序 → 关浏览器 → 重开访问 `/` → 默认 desc"
- ✓ aria-live polite 宣告

**Story 3.4 (Full Render 完整导航)**:
- ✓ `document.activeElement` 检查避免 inline editor 输入时误触发 — 实施层细节
- ✓ Esc 优先级显式 (dialog > inline editor > Full Render) — 与 Story 4.3 协同
- ✓ disabled 状态 + opacity + cursor-not-allowed

**Story 3.5 (响应式 + 移动端退化)**:
- ✓ Dropzone 移动端关闭逻辑 `matchMedia('(pointer: coarse)')`
- ✓ 多断点完整 (320/768/1024/1440/1920)
- 🟡 见 forward dependency 评论

**Epic 3 总评**: 🟢 优秀 (1 个非阻塞小改进)

---

#### Epic 4: Entry 管理 + 上线就绪 (Entry Management & Production Readiness)

| 维度 | 评估 |
|------|------|
| **Epic Title** | "Entry 管理 + 上线就绪" — 用户视角 + 工程目标混合 |
| **Epic Goal** | 完整运营 MindPrint 作为长期个人档案库 ✓ |
| **User Value** | FR-7 + 备份兜底 (数据持久 hard) + 度量 ✓ |
| **Standalone Test** | 完整 + 含 cron 备份验证 ✓ |
| **FR/NFR Coverage** | FR-7 + NFR-3 数据持久 hard + NFR-2 资源层 (presigned URL) ✓ |
| **Forward Dependencies** | 无 ✓ |
| **Story 数量** | 5 — 合理 |

**Story 4.1 (Inline editor + MoreMenu 框架)**:
- ✓ 与 Story 4.2/4.3 优雅协同: MoreMenu 先建带 disabled 占位项,后续填入
- ✓ Notion 风格 inline edit 精确实施细节 (`onFocus={(e) => e.currentTarget.select()}` 等)
- ✓ 边界 AC 含空/超长标题

**Story 4.2 (下载原 .html)**:
- ✓ **方案 B (服务端代理流式)** 与 **方案 A (302 redirect)** 显式权衡,选择带理由 (signed URL 不入历史 + override response headers)
- ✓ 中文文件名 RFC 5987 `filename*=UTF-8''` 编码
- ✓ 字节级等同性 AC (字节级别等同于归档时上传的原文件)

**Story 4.3 (永久删除)**:
- ✓ Focus 进入聚焦 "取消" — **防意外 Enter 误确认** — 实施层 safety affordance,质量极高
- ✓ R2 删除失败不回滚 DB 删除 — 显式 hobby 接受偶发孤儿对象 (与备份脚本协同 cleanup)
- ✓ Voice 严格 "删除后无法恢复。" 不要 "你确定吗?此操作不可逆哦!"

**Story 4.4 (部署强化 = 自定义域名 + CI + Analytics)**:
- 🟡 **Minor**: 3 件相对独立的事情 bundle 在一个 story。本可拆 3 个 stories,但 hobby 单用户规模 + 都属于"上线前固化"主题,可接受
- ✓ SM-1 计量实现细节 (cookie lastViewAt + 30 分钟去重 + 不入 DB)
- ✓ 隐私守护: 不引入 GA/Plausible(SM-C2 反向指标)
- ✓ NEXTAUTH_URL 自定义域更新流程

**Story 4.5 (备份 + Runbook + ESLint 自定义规则)**:
- 🟡 **Minor**: 与 4.4 同样 bundle 多议题。备份 + Runbook 关联紧密,但 ESLint 自定义规则可能独立成 story。
- 🟠 **Major**: **ESLint 自定义规则对 hobby 单用户项目可能过度工程化**
  - 规则: 禁 Server Action throw / 禁 iframe 无 sandbox / 禁 `sandbox="allow-*"` / 禁绕开 lib/r2/*
  - 这些规则在多人团队中价值显著,但单用户项目中 alex 是唯一 reviewer
  - **辩护**: PRD §4 D9c 缩略不得静默降级是硬约束 + 重复违规风险 + 借助 AI 写代码时 AI 可能引入 anti-pattern → ESLint 规则是 **CI 防线**
  - **判定**: **可保留但非阻塞** — 若 alex 觉得维护 ESLint 规则成本不值,可推迟到 M3 retro 评估
- ✓ 备份脚本完整 (pg_dump + R2 inventory + gzip + 双地点)
- ✓ Runbook 完整 (恢复 / 轮换 secrets / 手动触发备份 / 查日志 / 回滚)

**Epic 4 总评**: 🟢 良好 (1 个 Major 可商榷 + 2 个 Minor)

---

### Within-Epic Dependency Analysis

每个 epic 内 story 顺序:

**Epic 1**: 1.1 (init) → 1.2 (DB schema) → 1.3 (auth, needs DB) → 1.4 (visual, parallel-safe) → 1.5 (deploy, needs all)
- ✓ 顺序正确,无 forward
- 🟡 1.4 视觉系统可与 1.2/1.3 并行,但 1.5 部署前需完成 — 当前线性顺序对单 dev 合理

**Epic 2**: 2.1 (R2 setup) → 2.2 (archive link, needs R2) → 2.3 (Full Render, needs Entry exists)
- ✓ 严格线性,无 forward

**Epic 3**: 3.1 (主屏壳) → 3.2 (卡片 + Thumbnail) → 3.3 (SortToggle) → 3.4 (Full Render 导航) → 3.5 (响应式)
- ✓ 3.1 → 3.2 是强依赖
- 🟡 3.3/3.4/3.5 之间相对独立可并行,但当前线性顺序也合理

**Epic 4**: 4.1 (Inline editor + MoreMenu 框架) → 4.2 (Download) → 4.3 (Delete) → 4.4 (deploy 强化) → 4.5 (backup + Runbook)
- ✓ 4.1 → 4.2/4.3 框架先行
- 🟡 4.4 / 4.5 之间相对独立,顺序可调

### Cross-Epic Dependencies

| Epic | 依赖 | 状态 |
|------|------|------|
| Epic 1 | (无) | ✓ 基础 |
| Epic 2 | Epic 1 (auth, DB, env 框架) | ✓ 后向 |
| Epic 3 | Epic 1 (Timeline 主屏壳) + Epic 2 (Entries 存在, Full Render 基础) | ✓ 后向 |
| Epic 4 | Epic 1/2/3 (所有 surface 完成) | ✓ 后向 |

**FR-6 前置依赖验证**: PRD §4.4 显式声明 "FR-6 是 FR-1~FR-7 全部能力的前置依赖" — Epic 1 (FR-6) 在最早 ✓

### Database Creation Timing

🟡 **Minor**: Epic 1 Story 1.2 一次性创建 5 表 (4 Auth.js + entries)。
- 严格按最佳实践应该 Epic 1 创建 Auth.js 4 表,entries 表延后到 Epic 2
- **辩护**: Drizzle migration 是 schema-as-code,分两次 migration 与一次相同成本 + Auth.js adapter 期望完整 schema 形状 + alex 单人 dev 不需要严格分阶段
- **判定**: 可接受,与项目规模匹配

### Starter Template 检查

✓ 架构 `starter-template-evaluation.md` 显式选择"裸基线" (`create-next-app@latest` + 平移原型)
✓ Epic 1 Story 1.1 严格遵循: `npx create-next-app@latest web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` + 原型平移 + IndexedDB/Serwist 净化

### Acceptance Criteria Quality

| 维度 | 评估 |
|------|------|
| **Given/When/Then 格式** | ✓ 全部 18 story 使用 |
| **可测试性** | ✓ 每条 AC 可独立验证 |
| **完整覆盖** | ✓ 含 happy path + error scenarios + edge cases |
| **具体性** | ✓ 文件路径、变量名、错误码、文案串均明确 |

**示例突出**:
- Story 1.3 含"攻击场景"验证 AC (非白名单邮箱不发邮件)
- Story 2.3 含 NFR-1 沙箱化反向验证 (恶意 `<script>document.cookie</script>` 不执行)
- Story 4.2 含字节级等同性验证

### Best Practices Compliance Checklist

| 项 | Epic 1 | Epic 2 | Epic 3 | Epic 4 |
|----|--------|--------|--------|--------|
| Epic delivers user value | ✓ | ✓ | ✓ | ✓ |
| Epic can function independently | ✓* | ✓** | ✓ | ✓ |
| Stories appropriately sized | ✓ | ✓ | ✓ | ✓ |
| No forward dependencies | ✓ | ✓ | ✓*** | ✓ |
| Database tables created when needed | 🟡 | ✓ | ✓ | ✓ |
| Clear acceptance criteria | ✓ | ✓ | ✓ | ✓ |
| Traceability to FRs maintained | ✓ | ✓ | ✓ | ✓ |

\* Epic 1 含 Story 0 模式 (init + 视觉) — 对 alex 价值是"看到调性正确的空主屏",可独立验收
\** Epic 2 完成时主屏仍 Empty,但归档动作完整 — 已显式诚实声明
\*** Story 3.5 提到 Story 4.1 的移动端约定,但是设契约非依赖

### Findings Summary

#### 🔴 Critical Violations: 0

无 critical 问题。

#### 🟠 Major Issues: 1

1. **Story 4.5 中 ESLint 自定义规则可能过度工程化** (hobby 单用户项目)
   - **建议**: 保留但若 alex 在实施中觉得 ROI 不值,可推迟到 M3 retro 评估; 或拆出独立 story 4.6 在 M3 后再评估
   - **不阻塞实施**

#### 🟡 Minor Concerns: 5

1. **Story 1.1/2.1 "Story 0" 模式** (技术基础设施,无直接 user value) — Defensible,greenfield 必须 + 标注清晰
2. **Story 1.2 一次性 5 表 migration** (entries 表用在 Epic 2) — Defensible,与 Auth.js adapter 期望对齐 + Drizzle 一次成本相同
3. **Story 3.5 引用 Story 4.1 的移动端约定** — 设契约非依赖,可改写为"Story 4.1 实施 More menu 时需遵守此移动端约定"以更清晰
4. **Story 4.4 / 4.5 议题 bundle** (自定义域名+CI+Analytics 与 备份+Runbook+ESLint) — hobby 规模可接受,Multiple 多人协作时建议拆分
5. **OQ-1 产品名"MindPrint"事实已锁定** (epic / story / Auth 邮件模板均使用) 但仍标"待最终确认" — 建议正式关闭 OQ-1 或预留 rename 缓冲

### 突出优点

🟢 **质量信号 (超出典型 BMAD 输出)**:
- **每条硬约束多层重复**: "不得静默降级到文本摘要" 在 PRD §4.2 FR-4 + UX-DR22 + Epic 3 Story 3.2 AC 三处显式
- **反向测试 AC**: Story 1.3 攻击场景 + Story 2.3 沙箱攻击向量 + Story 2.3 401 NFR-2 验证
- **诚实声明阶段性**: Epic 2 "本 epic 完成时主屏看起来仍是空"
- **实施细节级别 a11y**: focus 取消按钮聚焦 (防 Enter 误确认) + aria-hidden iframe + aria-live polite
- **YAGNI 立场显式编码**: Story 1.2 "no `deleted_at` / no future-OQ columns"
- **架构决策回填**: PRD 留给架构定的(沙箱机制 / 缩略机制) — 架构定后,epic AC 反向 lock 实施细节
- **跨服务备份脚本** 三重保险 (Neon PITR + R2 11-9 + cron 备份) — 兑现 NFR-3 hard requirement

---

## Step 6: Summary and Recommendations

### Overall Readiness Status

🟢 **READY** — 规划文档已达到 Phase 4 实施起手所需的完整度与对齐度。

### Findings Distribution

| 严重度 | 数量 | 阻塞实施? |
|--------|------|-----------|
| 🔴 Critical | **0** | — |
| 🟠 Major | 1 | 否 (是范围选择,非规划缺陷) |
| 🟡 Minor | 8 (跨四个阶段累计) | 否 |

### Coverage Statistics

| 维度 | 总数 | 覆盖 | % |
|------|------|------|------|
| PRD Functional Requirements | 7 (FR-1~FR-7) | 7 | 100% |
| PRD Non-Functional Requirements | 3 (含 4 个子条款) | 3 | 100% |
| User Journeys (UJ-1/2/3) | 3 | 3 | 100% |
| UX Design Requirements (UX-DR1~32) | 32 | 32 | 100% |
| Glossary 术语一致性 | 7 | 7 | 100% |
| Story 数量 | 18 | — | — |
| 含完整 Given/When/Then AC 的 story | 18 | 18 | 100% |
| 含 FR/NFR/UX-DR 追溯的 story | 18 | 18 | 100% |

### Critical Issues Requiring Immediate Action

✅ **无 Critical 问题**。所有 PRD 需求 100% 由 epic / story 覆盖,UX 与架构充分对齐,无 forward 依赖,术语一致。

### Recommendations (Non-Blocking)

按重要度排序:

1. **正式关闭或显式标注 OQ-1 产品名"MindPrint"** (Minor)
   - 当前状态: PRD/UX/epic/Auth 邮件模板均使用 "MindPrint",事实已锁定但 OQ-1 仍标"待最终确认"
   - 建议: 在实施起手前一句话决定 — 要么正式关闭 OQ-1 (产品名 = MindPrint),要么在 Epic 1 Story 1.3/1.4 加 30 分钟缓冲考虑 rename
   - **不阻塞** — 可在 Epic 1 启动时做

2. **重新审视 Story 4.5 中 ESLint 自定义规则的 ROI** (Major,但非阻塞)
   - 当前: 4 条自定义规则 (禁 Server Action throw / 禁 iframe 无 sandbox / 禁 `sandbox="allow-*"` / 禁绕开 lib/r2/*)
   - 价值: AI 辅助编码时防 anti-pattern 漂移的 CI 防线
   - 成本: 单用户项目维护 ESLint 自定义规则
   - 建议: 实施 Epic 4 Story 4.5 时,若实际写规则花费 > 2 小时则推迟到 M3 retro 评估;否则保留
   - **不阻塞** — alex 实施时自决

3. **Story 3.5 / Story 4.1 移动端约定耦合,可改写更清晰** (Minor)
   - 当前: Story 3.5 提到 "Story 4.1 实施时按此约定"
   - 建议: 改为在 Story 4.1 顶部加 "依赖 Story 3.5 已定的移动端约定: ⋯ More menu 在 < 768px 变底部 sheet"
   - **不阻塞** — 实施时可改

4. **暗色模式实施时显式验证 Tailwind 4 dark strategy** (Minor)
   - 架构未独立提及 `prefers-color-scheme` 实现机制
   - 建议: Story 1.4 验收时显式确认 Tailwind 4 dark mode strategy (`class` 或 `media`) 与 DESIGN.md `dark-*` tokens 的桥接方式
   - **不阻塞** — 实施时可决

5. **WCAG 2.2 AA 自动化验证机制** (Minor)
   - 当前: EXPERIENCE.md 声明 a11y 全 surface 覆盖,但架构未列 a11y 自动化测试
   - 建议: dev 阶段或 M3 retro 时加 axe-core / Playwright a11y 断言,或人工 axe DevTools 跑一遍
   - **不阻塞** — 可在 M3 retro 评估

6. **Story 4.4 / 4.5 多议题 bundle** (Minor)
   - 当前: Story 4.4 = 自定义域名 + CI + Analytics; Story 4.5 = 备份 + Runbook + ESLint
   - 建议: hobby 单用户规模可接受;若实施时间偏长,可临时拆出独立 sub-story
   - **不阻塞**

### 突出的规划优点 (传达给下游 dev)

1. **多层硬约束防护**: 关键约束 (如缩略不得静默降级、删除文案、沙箱机制) 在 PRD + UX + Epic 三层重复显式表达
2. **反向测试 AC**: 显式攻击场景验证 (非白名单邮箱不发邮件 / 沙箱化阻 `<script>` 注入 / 401 不泄露 Entry 存在性)
3. **诚实声明阶段性**: Epic 2 显式说明"完成时主屏看起来仍是空" — 防止下游误判完整度
4. **YAGNI 立场显式编码**: schema 不预留 OQ 字段、不引入 SWR、不为 Story 7 预留视觉脚手架
5. **Counter-metrics 强制约束**: SM-C2 "不引入推送/邮件/红点" 在 epic requirements-inventory 显式标注
6. **三重数据持久保险**: Neon PITR + R2 11-9 + 跨服务 cron 备份 — 兑现 NFR-3 hard requirement
7. **架构决策回填**: PRD 留给架构的悬而未决项 (沙箱机制 / 缩略机制 / 认证机制) — 架构定后,epic AC 反向 lock 实施细节

### Phase 4 实施建议起手顺序

按 epic / story 现有顺序即可,无需调整:

1. **Epic 1 Story 1.1** (项目初始化 + 原型平移) — 立即可起
2. 顺序往后,每 story 完成后 grep 验收
3. 关键检查点:
   - Story 1.3 完成: 实地多设备 Magic Link 走一遍
   - Story 2.3 完成: 沙箱攻击向量测试 (script + document.cookie)
   - Story 3.2 完成: ≥ 5 条 Entry 跨 2 月份的缩略预览实际感受
   - Story 4.5 完成: 周日 cron 备份首次验证

### Final Note

This assessment identified **0 Critical** / **1 Major (non-blocking)** / **8 Minor** issues across the four documents (PRD, UX, Architecture, Epics).

**所有 Minor / Major 问题均不阻塞 Phase 4 实施起手** — 它们是可在实施过程中观察 / 在 M3 retro 评估的优化机会,不是规划缺陷。

📊 **规划质量评级**: 🟢 **优秀 (Excellent)** — 此份规划相对于典型 BMAD hobby 项目输出超出标准。术语锁定、可追溯性、防御性设计、Counter-metrics 编码、多层约束重复 — 均显示出超过 hobby 单用户规模的成熟度。

**Recommendation**: **建议直接进入 Phase 4 实施** — Epic 1 Story 1.1 起手即可。OQ-1 (产品名) 在 Epic 1 启动时做 30 秒决定;ESLint 自定义规则到 Epic 4 Story 4.5 实施时再评估。

---

**Assessment generated by**: bmad-check-implementation-readiness skill
**Date**: 2026-05-29
**Assessor**: alex (via Claude Code)
**Source documents**: PRD v1.0 (final 2026-05-28) + Architecture v1.0 + Epics (2026-05-28) + UX DESIGN.md + EXPERIENCE.md (final 2026-05-28)
