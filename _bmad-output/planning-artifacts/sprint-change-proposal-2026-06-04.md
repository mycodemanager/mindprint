# Sprint Change Proposal · NFR-1 沙箱模型修订（allow-scripts）

- **Date**: 2026-06-04
- **Author**: alex（借助 Claude）
- **Trigger story**: Story 3.1/3.2 生产验收（Full Render 经 Story 2.3）
- **Status**: ✅ approved（方向）· 2026-06-04 —— **D1 = 仅 allow-scripts**（不收紧 connect-src）· **D2 = 缩略图也放开**
- **Mode**: Batch
- **实现**: 经 Story 3.6（见 §5/§6），走 create-story → dev → Codex review → alex 生产验收

---

## 1. Issue Summary

**触发**：alex 在生产验收 Story 3.1/3.2 时，单击 Entry「RupayFlow APP Prototype」进 Full Render，**内容区空白、只剩静态外壳（手机框）**。

**根因（已实测核验）**：该 Entry 是 **JS 驱动的单页应用**——`<div id="app">` + 1 个内联 `<script>` + `innerHTML` 注入模板（直接列 R2 实物核验：3 个副本均 1 内联 script、6511 字符静态文本全在 `<template>`、截图渲染空白）。Full Render 的 iframe 用 `sandbox=""`（Story 2.3）**禁止所有脚本执行** → `#app` 永不被填充 → 空白。

**关键定性 —— 这是实现过严、非安全放松**：
- **NFR-1（PRD §5）** 的「行为隔离」只要求 Entry 脚本**不能**修改宿主 DOM / `top.location` / `parent`、不能经 `postMessage` 取应用状态；「凭据隔离」只要求**碰不到** cookie/session/storage/API。**NFR-1 从未要求"禁止脚本执行"**。
- **FR-5「原貌等同性」** 明确要求渲染**视觉等同于浏览器打开 .html**，唯一例外是"沙箱阻止脚本访问宿主"那类副作用。
- Story 2.3 选的 `sandbox=""`（禁所有脚本）**比 NFR-1 要求的更严，反而违反了 FR-5 的原貌等同**。这是实现层的过度收紧，被 alex 的**核心用法**（归档 AI 生成的交互原型，多为 JS 驱动）暴露出来。

**影响范围**：alex 的主要归档内容是 AI 交互原型（JS 驱动）→ 当前姿态下 Full Render（FR-5）与时间线缩略（FR-4）对这类内容大多只显示空壳，**两个核心 FR 的价值对其失效**。

---

## 2. Impact Analysis

| 维度 | 影响 |
|---|---|
| **Epic** | 不新增/不废弃/不重排 epic。涉及 **Epic 2**（FR-5 Full Render · Story 2.3 done）+ **Epic 3**（FR-4 缩略 · Story 3.2 review）的沙箱实现。 |
| **Story** | Story **2.3**（route CSP + FullRender iframe）、**3.2**（ThumbnailIframe）需修订；**新增 1 个实现 story**。3.3/3.4/3.5 不受影响（独立）。 |
| **PRD** | NFR-1 措辞**无需改**（allow-scripts opaque 已满足其隔离要求）；建议加一条**澄清注**：沙箱目标是「隔离宿主访问」非「禁脚本」，机制锁定 allow-scripts(opaque)。FR-5「原貌等同」得以真正兑现。MVP 范围不变。 |
| **Architecture** | `core-architectural-decisions.md` 的 NFR-1 表「机制 = 同源 srcDoc + sandbox=""」**需更正**为「`src`(route handler) + `sandbox="allow-scripts"`（opaque，无 allow-same-origin）+ 路由 CSP `sandbox allow-scripts`」。（注：srcDoc 早被 2.3/3.2 改为 src，本就 stale，一并更正。）"改沙箱要同时影响 FR-4+FR-5"依然成立。 |
| **UX** | 无视觉规格变更；FR-5「原貌等同」行为契约更好兑现。 |
| **其它** | route CSP header、FullRender iframe、ThumbnailIframe iframe；Story 2.3 **AC9 测试语义需更新**（从「脚本不执行」→「脚本执行但隔离：无宿主 cookie/DOM/parent 访问」——安全性质等价）。**无新依赖、无新 env**。 |

---

## 3. Recommended Approach

**选定 Option 1 · Direct Adjustment**（新增 1 实现 story + 修订文档）。

- **Option 2 Rollback**：N/A —— 无需回滚已完成 story，这是增量修订。
- **Option 3 MVP Review**：不需要 —— MVP 范围不变，本变更反而**更好兑现**既定 FR-5/FR-4。
- **Option 1** Effort: **Low–Med**（4 个文件的属性/CSP 改动 + 文档更正 + 验证）；Risk: **Low–Med**（核心安全属性，需 alex 生产实测 AC9 + 渲染）。

### 安全分析（核心）
`sandbox="allow-scripts"`（**不加** `allow-same-origin`）→ iframe 文档获 **opaque origin**：
- ✅ 脚本执行（渲染 JS 原型）。
- ✅ `document.cookie` 为空、无法读 parent DOM / localStorage / sessionStorage（opaque + 跨源）→ 碰不到 MindPrint 会话（NFR-1 凭据隔离）。
- ✅ 无 `allow-top-navigation` → 不能导航宿主；无 `allow-popups`/`allow-forms`/`allow-modals` → 不能弹窗/外发表单（NFR-1 行为隔离）。
- ✅ Story 2.3 AC9 的安全性质（脚本写 cookie / 改 parent.location 无效）**仍成立**——脚本跑，但作用于隔离的 opaque 上下文。
- 路由 CSP 同步 `sandbox allow-scripts`：**直接导航**该 URL 时文档也是 opaque origin + 脚本跑但碰不到会话（保留 2.3 P1 对直接导航的防护）。

**残余风险（非 NFR-1 范畴，新增考量）**：脚本可发网络请求（beacon/外链跟踪）、耗 CPU、尝试浏览器漏洞逃逸。对 alex **自制**内容风险低。可选硬化见 D1。

---

## 4. 决策（已拍板 2026-06-04）

- **D1 = (a) 仅 `sandbox allow-scripts`** —— 不加 connect-src 收紧。最小修订、最大保真；对 alex 自制内容风险低。（未来若归档不可信第三方 HTML，可再加 connect-src 硬化。）
- **D2 = (a) 缩略图也 allow-scripts** —— JS 原型缩略呈现真实预览（兑现 FR-4 视觉浏览）；多卡并发 JS 由 IO 懒挂载限到近视口卡，性能列入 M3 retro watch。

---

## 5. Detailed Change Proposals（D1/D2 定后定稿）

1. **PRD §5 NFR-1**：加澄清注（沙箱=隔离宿主访问，非禁脚本；机制 allow-scripts opaque）。
2. **architecture/core-architectural-decisions.md**：NFR-1 表 + Critical Decisions 行更正（srcDoc+sandbox="" → src + allow-scripts opaque + CSP）。
3. **Story 2.3**：`FullRender.tsx` iframe `sandbox="" → "allow-scripts"`；`/api/entry/[id]/html` route CSP `sandbox → "sandbox allow-scripts"`（按 D1）；AC9 语义更新；加 retro 注。
4. **Story 3.2**：`ThumbnailIframe.tsx` sandbox（按 D2）。
5. **新 Story（建议 3.6「NFR-1 沙箱修订 · allow-scripts」）**：实现上述 3+4 + 文档同步 + 验证（typecheck/lint + alex 生产实测：AC9 脚本隔离 + JS 原型完整渲染）。

---

## 6. Implementation Handoff

- **Scope 分级：MAJOR**（修订核心 NFR）。正式路径：**alex 批准 NFR 修订（PM/架构帽）→ `create-story` 新建实现 story → dev → Codex review → alex 生产验收**。
- 与 Story 3.3/3.4/3.5 **独立**，可并行或任意排期（建议优先，因影响 alex 核心体验）。
- 成功标准：JS 原型在 Full Render（及按 D2 的缩略）**完整渲染**；AC9 安全实测通过（脚本碰不到会话/宿主）；typecheck+lint 绿。
