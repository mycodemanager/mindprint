---
baseline_commit: 1fd98d63ef6d323b4fd436b9cbc5cad401b9e256
---

# Story 3.6: NFR-1 沙箱修订 · allow-scripts

Status: review

<!-- correct-course 新增 story（非来自 epics.md）。需求源 = 已批准的 sprint-change-proposal-2026-06-04.md（NFR-1 沙箱 sandbox="" → allow-scripts，跨 FR-4 缩略 + FR-5 Full Render）。
     根因（已实测）：alex 核心归档内容是 JS 驱动的 AI 交互原型；2.3/3.2 的 iframe `sandbox=""` 禁所有脚本 → #app 永不被填充 → Full Render + 缩略图对这类内容只剩空壳，违反 FR-5「原貌等同」。
     定性：这是实现过严、非安全放松。NFR-1 只要求「隔离宿主访问」（凭据+行为），从未要求「禁脚本」。`sandbox="allow-scripts"`（不加 allow-same-origin）→ opaque origin：脚本能跑（渲染原型）但碰不到宿主 cookie/DOM/storage/parent → 同时满足 NFR-1（隔离）与 FR-5（原貌）。
     🚨 头号红线：**只加 allow-scripts 这一个 token，严禁同时加 allow-same-origin**（allow-scripts + allow-same-origin = 脚本可改自身 sandbox 逃逸 → 拿到宿主同源 → NFR-1 失守，浏览器也会显式警告）。
     纯代码 + 文档 story（无 ops）。3 个代码文件改 iframe/CSP 属性值 + 3 个文档同步措辞。完成后需 alex 生产实测：① AC9 脚本隔离仍成立 ② JS 原型在 Full Render + 缩略图完整渲染。
     决策（proposal §4，已拍板）：D1 = 仅 allow-scripts（不加 connect-src 硬化）；D2 = 缩略图也放开（兑现 FR-4 真实预览）。 -->

## Story

As alex,
I want Full Render 与卡片缩略的沙箱 iframe 在保持「隔离宿主访问」的前提下**允许 Entry 内脚本执行**（`sandbox="allow-scripts"`，opaque origin），
so that 我归档的 JS 驱动 AI 原型能以**原貌**完整渲染（兑现 FR-5/FR-4），而不再只显示空壳。

## Acceptance Criteria（源自 sprint-change-proposal-2026-06-04 §5 + D1/D2）

**AC1 — `FullRender.tsx` iframe 放开脚本（FR-5）**
- [`web/components/FullRender.tsx`](web/components/FullRender.tsx) 第 30 行 `sandbox=""` → `sandbox="allow-scripts"`。
- **只加 `allow-scripts` 这一个 token**——不加 `allow-same-origin`、不加 `allow-forms`/`allow-popups`/`allow-modals`/`allow-top-navigation` 等任何其他 token（D1）。
- 第 17–18 行 JSDoc 注释同步更新：从「禁 script 执行 / **禁** allow-*」更正为「`allow-scripts`（仅此 token）：opaque origin（无 allow-same-origin → 隔离宿主 cookie/localStorage/DOM/parent）+ 允许脚本执行以渲染 JS 原型（FR-5）；**严禁**再加 allow-same-origin」。

**AC2 — `ThumbnailIframe.tsx` 缩略也放开（FR-4 · D2）**
- [`web/components/ThumbnailIframe.tsx`](web/components/ThumbnailIframe.tsx) 第 81 行 `sandbox=""` → `sandbox="allow-scripts"`（同样仅此一个 token）。
- 第 19–20 行注释同步更新（`sandbox=""` 空属性 → `sandbox="allow-scripts"` opaque + 允许脚本）。
- **保留不动**：探活 fetch gate（48–64 行，宿主侧 fetch、不受 iframe sandbox 影响）、`onError`（86 行）、IntersectionObserver 懒挂载（29–44 行）、`transform: scale(0.4)`、失败兜底（标题+绝对时间）。本 story 只改 `sandbox` 属性值 + 其上注释。
- 性能（多卡并发 JS）：由既有 IO 懒挂载（仅近视口卡挂 iframe）限制；V1 ≤ 50 卡可接受，列入 Epic 3 retro 的 M3 watch（见 Dev Notes），本 story 不额外优化。

**AC3 — route CSP 同步放开（直接导航防护 · D1）**
- [`web/app/api/entry/[id]/html/route.ts`](web/app/api/entry/[id]/html/route.ts) 第 43 行 `'Content-Security-Policy': 'sandbox'` → `'Content-Security-Policy': 'sandbox allow-scripts'`。
- 第 39–42 行注释同步：直接导航 / 新标签打开本 URL 时，响应文档仍被 CSP 沙箱化为 **opaque origin**（`sandbox allow-scripts` 不含 `allow-same-origin`）→ 脚本可执行但**碰不到 alex 会话 cookie/storage**。防住「存储型 XSS」的核心是 opaque origin（隔离会话），**非**禁脚本——这一点要在注释里讲清，避免后人误以为放开脚本削弱了 2.3 P1 的防护。
- 保留 401/404 等其余分支不变。

**AC4 — PRD §5 NFR-1 加澄清注（措辞不改隔离要求）**
- [`prd.md`](_bmad-output/planning-artifacts/prds/prd-my-bmad-app-2026-05-28/prd.md) §5 NFR-1（264–276 行）的**凭据隔离 / 行为隔离要求逐字不改**（`allow-scripts` opaque 仍完全满足）。
- 在「机制开放」（275 行）之后 / NFR-1 小节末追加一条**澄清注**，要点：沙箱目标是「隔离宿主访问」（凭据+行为），**从不要求禁脚本执行**；V1 机制锁定 `sandbox="allow-scripts"`（opaque，**无** allow-same-origin）+ 路由 CSP `sandbox allow-scripts`；FR-5「原貌等同」由此真正兑现（JS 驱动原型可渲染）；机制经 sprint-change-proposal-2026-06-04 锁定（取代「由架构阶段决定」的开放表述）。

**AC5 — architecture `core-architectural-decisions.md` 更正**
- [`core-architectural-decisions.md`](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md) 三处更正：
  - **第 10 行**（Critical Decisions 摘要）：`沙箱化机制 = 同源 srcDoc + sandbox=""` → `沙箱化机制 = src（route handler）+ sandbox="allow-scripts"（opaque，无 allow-same-origin）+ 路由 CSP sandbox allow-scripts`。
  - **第 72–80 行 NFR-1 表**：机制行（76）改 `src + allow-scripts(opaque) + CSP`；凭据隔离（77）改 `src 文档因无 allow-same-origin 仍获 opaque origin`；行为隔离（78）从「阻止 script 执行」改为「**脚本执行但隔离**：opaque origin 碰不到 cookie/DOM/parent；无 allow-top-navigation/popups/forms/modals → 不能导航宿主/弹窗/外发表单」；缩略预览行（80）同步。
  - **第 231 行**（Critical decisions 依赖，before 原文：`- **沙箱化机制（srcDoc + sandbox=""）→ FR-4 缩略预览 + FR-5 完整渲染**：两个 FR 共享同一沙箱模型；改沙箱要同时影响二者`）：将 `srcDoc + sandbox=""` 更正为 `src + allow-scripts(opaque) + CSP sandbox allow-scripts`；**保留**「改沙箱要同时影响 FR-4+FR-5」结论不变。
- **顺带纠 stale**：架构原文的 `srcDoc` 在 Story 2.3/3.2 实际落地时早已改为 `src`（route handler 流式），本就过期 → 一并更正为 `src`（与 2.3 dev-note ④、3.2 头号澄清一致）。

**AC6 — Story 2.3 `AC9` 语义更新 + retro 注（历史验收记录不篡改）**
- [`2-3-full-render-基础-归档跳转衔接.md`](_bmad-output/implementation-artifacts/2-3-full-render-基础-归档跳转衔接.md)：
  - **AC9（75–76 行）语义更新**：从「script **不执行**」→「script **执行，但 opaque origin 隔离**：iframe 内脚本写 `document.cookie`/读宿主 DOM/改 `parent.location` 均无效（碰不到 MindPrint 会话/宿主）」——安全性质等价，验证手段从「脚本不跑」变为「脚本跑但拿不到宿主」。
  - iframe 描述（38–39 行）+ Dev Notes 安全模型（132–137 行）：`sandbox=""` → `sandbox="allow-scripts"`，更新「无 allow-scripts → script 不执行」为「仅 allow-scripts、无 allow-same-origin → opaque origin → 脚本执行但隔离」。
  - **alex 历史验收记录（116 行 2026-06-03、247 行）**：⚠️ **不得删改**（历史事实）。在其旁加一行注：「该验收基于旧 `sandbox=""`；AC9 语义经 Story 3.6 修订为『脚本执行但隔离』，需 alex 重新生产实测（见 3.6 AC7）」。
  - 末尾加一条 retro 注（指向本 story + proposal §4 D1/D2 + 残余风险）。

**AC7 — 验证**
- **静态**：`npm --prefix /Users/alex/Developer/个人项目/实验/my-bmad-app/web run typecheck` 与 `run lint` 均绿（属性值/字符串改动，类型不变，预期零回归）。
- **alex 生产实测**（ops 由 alex 执行，Claude 不代跑）：
  - **(a) AC9 安全仍成立**：归档含 `<script>document.cookie='x'</script>` 与 `<script>parent.location='https://attacker.com'</script>` 的 HTML → 脚本**执行**，但 `document.cookie` 为空、无法改 parent/导航宿主；DevTools 确认无 MindPrint 会话 cookie 被写入；**新标签直接打开** `/api/entry/[id]/html` 同样 opaque（CSP `sandbox allow-scripts` 生效）。
  - **(b) FR-5 渲染**：JS 驱动原型（如「RupayFlow APP Prototype」）在 Full Render **完整渲染**（`#app` 被脚本填充，非空白手机壳）。
  - **(c) FR-4 缩略**：同一 JS 原型的卡片缩略图显示**真实预览**（非空壳；允许缩放后细节有限，但应见真实布局/内容而非空白）。

## Tasks / Subtasks

- [x] **Task 1 — FullRender iframe（AC1）**
  - [x] 改 [`web/components/FullRender.tsx`](web/components/FullRender.tsx) 第 30 行 `sandbox=""` → `sandbox="allow-scripts"`
  - [x] 更新第 17–18 行 JSDoc（opaque + 允许脚本 + 严禁 allow-same-origin）
- [x] **Task 2 — ThumbnailIframe iframe（AC2）**
  - [x] 改 [`web/components/ThumbnailIframe.tsx`](web/components/ThumbnailIframe.tsx) 第 81 行 `sandbox=""` → `sandbox="allow-scripts"`
  - [x] 更新第 19–20 行注释；确认探活 gate / onError / IO / scale / 兜底**未被动到**
- [x] **Task 3 — route CSP（AC3）**
  - [x] 改 [`web/app/api/entry/[id]/html/route.ts`](web/app/api/entry/[id]/html/route.ts) 第 43 行 CSP → `'sandbox allow-scripts'`
  - [x] 更新第 39–42 行注释（opaque 仍隔离会话；防护核心是 opaque 非禁脚本）
- [x] **Task 4 — PRD NFR-1 澄清注（AC4）** — 隔离要求不改，加澄清注 + 锁定机制
- [x] **Task 5 — architecture 更正（AC5）** — 第 10 / 72–80 / 231 行；顺带 srcDoc→src 纠 stale
- [x] **Task 6 — Story 2.3 AC9 语义 + retro 注（AC6）** — 历史验收记录只加注不删改
- [x] **Task 7 — 验证（AC7）** — typecheck + lint 绿；整理 alex 生产实测清单 (a)/(b)/(c) 交 alex

## Dev Notes

### 背景与定性（必读）
- 触发：alex 生产验收 3.1/3.2 时，「RupayFlow APP Prototype」进 Full Render 内容区空白、只剩手机壳。已实测核验该 Entry 是 JS 驱动 SPA（`<div id="app">` + 内联 `<script>` + `innerHTML` 注入模板）。`sandbox=""` 禁所有脚本 → `#app` 永不填充 → 空白。
- **这是实现过严，非安全放松**：NFR-1（PRD §5，268–274 行）只要求「凭据隔离 + 行为隔离」（碰不到宿主 cookie/storage/API、不能改宿主 DOM/top.location/parent），**从未要求禁脚本执行**。FR-5（PRD §4.3，190 行）明确要求渲染**视觉等同于浏览器打开 .html**。2.3 选的 `sandbox=""`（禁所有脚本）比 NFR-1 要求的更严，反而违反 FR-5。

### 安全模型（核心 —— dev 必须吃透，否则会踩逃逸坑）
- `sandbox="allow-scripts"`（**不含** `allow-same-origin`）→ iframe 文档获 **opaque origin**（HTML Living Standard）：
  - ✅ 脚本执行（渲染 JS 原型）。
  - ✅ `document.cookie` 为空、读不到 parent DOM / localStorage / sessionStorage（opaque + 跨源）→ 碰不到 MindPrint 会话（NFR-1 凭据隔离）。
  - ✅ 无 `allow-top-navigation` → 不能导航宿主；无 `allow-popups`/`allow-forms`/`allow-modals` → 不能弹窗/外发表单（NFR-1 行为隔离）。
- 🚨 **头号红线**：**严禁** `allow-scripts` 与 `allow-same-origin` **同时出现**。二者并存 → 脚本获得宿主同源能力，可移除自身 `sandbox` 属性逃逸 → NFR-1 彻底失守（浏览器控制台也会显式警告这一组合）。本 story 三处 iframe/CSP **只放 `allow-scripts` 一个 token**。
- route CSP `sandbox allow-scripts`：保留 2.3 P1（Codex）对**直接导航**的防护——直接打开该 URL 时文档仍 opaque（无 same-origin token）+ 脚本跑但碰不到会话。防存储型 XSS 的关键是 opaque origin，不是禁脚本。
- **残余风险**（非 NFR-1 范畴，proposal §3 新增考量）：脚本可发网络请求（beacon/外链跟踪）、耗 CPU、尝试浏览器漏洞逃逸。对 alex **自制**内容低危。未来若归档不可信第三方 HTML，可加 `connect-src` 等 CSP 硬化（D1 明确**本次不做**）。

### 逐文件改动锚点（before → after）
| 文件 | 行 | before | after |
|---|---|---|---|
| `web/components/FullRender.tsx` | 30 | `sandbox=""` | `sandbox="allow-scripts"` |
| `web/components/ThumbnailIframe.tsx` | 81 | `sandbox=""` | `sandbox="allow-scripts"` |
| `web/app/api/entry/[id]/html/route.ts` | 43 | `'Content-Security-Policy': 'sandbox'` | `'Content-Security-Policy': 'sandbox allow-scripts'` |
| `prd.md` | ~276 | （NFR-1 末） | + 澄清注（隔离≠禁脚本；机制锁定 allow-scripts opaque） |
| `core-architectural-decisions.md` | 10 / 76 / 78 / 80 / 231 | `srcDoc + sandbox=""` / 「阻止 script 执行」 | `src + allow-scripts(opaque) + CSP` / 「脚本执行但隔离」 |
| `2-3-...md` | 38–39 / 75–76 / 132–137 | `sandbox=""` / AC9「不执行」 | `allow-scripts` / AC9「执行但隔离」（历史验收记录只加注） |

### web 目录工程纪律
- [`web/AGENTS.md`](web/AGENTS.md)：这是**魔改版 Next.js（16.x）**，写 web 代码前读 `node_modules/next/dist/docs/` 对应指南，遵守 deprecation。
- **但本 story 不新增任何 Next API 用法**：仅改 ① 两个 iframe 的 `sandbox` 属性值（纯 JSX 属性）② 一个已存在 Route Handler 的 `Response` header 字符串值（Web 标准 `Response`/`Headers`，非 Next 特定）。route handler 本身（async params、`requireAlex`、R2 流）2.3 已建、不动。预期零类型/零回归。

### 状态与流程
- correct-course 已批准（proposal Status: ✅ approved 2026-06-04；D1/D2 已拍板）→ 本 story 走 dev → Codex review → alex 生产验收。
- 与 Story 3.3/3.4/3.5 独立，可任意排期；建议优先（影响 alex 核心体验）。
- Epic 3 retro 的 **M3 watch**：多卡并发 JS 缩略的性能（IO 懒挂载已限近视口）；allow-scripts 残余风险（网络/CPU）。

### Project Structure Notes
- 无新文件、无新依赖、无新 env。改 3 个既有代码文件 + 3 个既有文档。
- 与既有结构完全对齐：iframe 沙箱模型是 FR-4/FR-5 共享的单一机制（architecture 231 行「改沙箱要同时影响二者」）——本 story 三处同步改动正体现这一点。

### References
- [Source: sprint-change-proposal-2026-06-04.md §3 安全分析 / §4 D1·D2 / §5 Detailed Changes / §6 Handoff](_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-04.md)
- [Source: prd.md §4.3 FR-5 原貌等同（190 行）/ §5 NFR-1（264–276 行）](_bmad-output/planning-artifacts/prds/prd-my-bmad-app-2026-05-28/prd.md)
- [Source: core-architectural-decisions.md NFR-1 表（72–80 行）/ Critical Decisions（10、231 行）](_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md)
- [Source: Story 2.3 AC9（75–76 行）/ Dev Notes 安全模型（132–137 行）/ P1 CSP（270 行）](_bmad-output/implementation-artifacts/2-3-full-render-基础-归档跳转衔接.md)
- [Source: web/AGENTS.md — Next.js 16 工程纪律](web/AGENTS.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (1M context) · 2026-06-12

### Debug Log References

- `npm --prefix web run typecheck`（tsc --noEmit）：0 错误（属性/字符串/文档改动，类型不变）。
- `npm --prefix web run lint`（eslint）：0 错误 0 警告。
- 未写自动化测试：本 story 改动为 iframe `sandbox` 属性值 + Response CSP header 字符串值 + 文档措辞，无可单测的逻辑分支；沙箱行为（脚本执行 + opaque 隔离）只能浏览器实测 → 归 AC7 alex 生产验收（与 Story 2.3 AC9 同模式）。

### Completion Notes List

**已完成（代码 + 文档 + 静态验证）：**
- T1–T3 代码（3 文件）：`FullRender.tsx` / `ThumbnailIframe.tsx` 的 `sandbox="" → "allow-scripts"`、`route.ts` CSP `'sandbox' → 'sandbox allow-scripts'`，三处注释同步（opaque 仍隔离会话、放开脚本、严禁叠加 allow-same-origin）。
- T4–T6 文档（3 文件）：PRD §5 NFR-1 加澄清注（隔离≠禁脚本，机制锁定 allow-scripts opaque）；architecture 第 10/72–80/231 行更正 + 修订注（srcDoc→src 一并纠 stale）；Story 2.3（done 历史 story）加集中修订注 + AC9 指针 + 末尾 retro 记录，**历史正文与 alex 2026-06-03 验收记录保留不删改**。
- 🚨 安全红线落实：三处仅加 `allow-scripts` 一个 token，**未**叠加 `allow-same-origin` → opaque origin 保持，宿主 cookie/DOM/storage 隔离不变。
- typecheck + lint 绿（0/0）。

**待 alex 生产实测（review → done 的 gate，ops 交 alex）：**
- (a) AC9 安全：含 `<script>` 写 cookie / 改 `parent.location` 的 HTML → 脚本执行但 `document.cookie` 空、改不动 parent、新标签直接打开亦 opaque（CSP allow-scripts）。
- (b) FR-5：JS 驱动原型（如 RupayFlow APP Prototype）在 Full Render 完整渲染（非空白）。
- (c) FR-4：同原型缩略图显示真实预览（非空壳）。

### File List

**修改（代码）：**
- `web/components/FullRender.tsx`（iframe `sandbox="" → "allow-scripts"` + 注释）
- `web/components/ThumbnailIframe.tsx`（iframe `sandbox="" → "allow-scripts"` + 注释）
- `web/app/api/entry/[id]/html/route.ts`（CSP `'sandbox' → 'sandbox allow-scripts'` + 注释）

**修改（文档）：**
- `_bmad-output/planning-artifacts/prds/prd-my-bmad-app-2026-05-28/prd.md`（§5 NFR-1 澄清注）
- `_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/core-architectural-decisions.md`（NFR-1 表 + 第 10/231 行 + 修订注）
- `_bmad-output/implementation-artifacts/2-3-full-render-基础-归档跳转衔接.md`（集中修订注 + AC9 指针 + retro 记录）
- `_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/implementation-patterns-consistency-rules.md`（MUST 规则 §367 + Good Example + anti-pattern 注释 · Codex P2）
- `_bmad-output/planning-artifacts/architectures/architecture-my-bmad-app-2026-05-28/architecture/project-structure-boundaries.md`（NFR-1 表集中修订注 + 表行 · Codex P2）

## Senior Developer Review (Codex)

**Reviewer**: Codex CLI v0.130.0（gpt-5.5, reasoning xhigh）· 2026-06-12 · 对抗式（`codex review -`，staged 全量）
**Outcome**: 核心安全模型判定**正确**——运行时三处 iframe/CSP 只加 `allow-scripts`、无 `allow-same-origin`，opaque 隔离成立。2 个 findings（均文档/注释一致性，无代码 bug），**已修复并复验**。无 High/P1。

### Action Items
- [x] **[P2] 同步 architecture 包其余文件的旧沙箱规则** — create-story 只改了 `core-architectural-decisions.md`，遗漏同包另两文件：`implementation-patterns-consistency-rules.md:367` 的 MUST 规则（「iframe 必须 `sandbox=""`、加 `allow-*` 算违规」）会让后续 agent 把本次 allow-scripts 判违规并回滚；`project-structure-boundaries.md` 多处仍写 srcDoc + sandbox=""。**已修**：367 MUST 规则改为 `sandbox="allow-scripts"` + CSP（红线列明禁叠 allow-same-origin 等）；Good Example 范本改为 `src` + allow-scripts；project-structure NFR-1 表加集中修订注 + 改表行（覆盖目录树/数据流图等描述性残留）。
- [x] **[P3] FullRender.tsx 残留 srcDoc 注释** — 第 16 行仍写「srcDoc 留给 Epic 3 缩略图」，但缩略图早已用 `src`。**已修**：改为「缩略图同样走 route-handler `src`，共享同一沙箱模型」。

### Re-verification（2026-06-12）
- `npm --prefix web run typecheck` + `run lint`：均绿（0/0）。P2/P3 均文档/注释改动，无代码逻辑变更。
- 安全性质未变：运行时仍仅 `allow-scripts`、无 `allow-same-origin`。
