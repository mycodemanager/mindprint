---
name: MindPrint
status: final
version: 1.0
created: 2026-05-28
updated: 2026-05-28
finalized: 2026-05-28
language: zh-CN
author: alex
sources:
  - ../../prds/prd-my-bmad-app-2026-05-28/prd.md
  - ../../briefs/brief-my-bmad-app-2026-05-28/brief.md
  - ../../prds/prd-my-bmad-app-2026-05-28/addendum.md
peer: ./DESIGN.md
---

# EXPERIENCE.md · MindPrint

> *PRD 7 FRs + 3 UJs + 3 NFRs 的行为契约。本文档定义 IA、组件行为、状态、交互、可访问性、流程；视觉表达全部委托给 [`DESIGN.md`](./DESIGN.md)（用 `{path.to.token}` 跨引）。两份 spine 在与 mocks 冲突时胜出。*

## Foundation

**Single-surface 响应式 web 应用**。技术栈倾向 Next.js（[ASSUMPTION] 承接 brief addendum §1.1，最终由架构阶段决定），UI 实现层不锁定（Tailwind / shadcn / 纯 CSS 均可）。

- **单用户**：alex 是唯一用户（PRD §2.3 非用户）；本 spine 全程将"用户"实例化为"alex"
- **形式因子**：浏览器作为唯一终端——桌面（Chrome / Safari / Firefox 当前稳定版）+ 移动（iOS Safari / Android Chrome 当前稳定版），不做 PWA / 原生 App（PRD §6.2）
- **UI system inheritance**：未绑定外部 UI 库。`DESIGN.md` tokens 直接定义所有组件视觉，无 shadcn / MUI / Radix 等外部依赖
- **沙箱化是产品 DNA**：所有 HTML 内容渲染（缩略预览 + Full Render）必须沙箱化（PRD §5 NFR-1）；本 spine 在 Component Patterns 与 State Patterns 中标注沙箱影响的行为分支

## Information Architecture

| Surface | Reached from | Purpose | Realizes |
|---|---|---|---|
| **登录** | 任意未认证 URL 重定向 | 私有访问入口 | FR-6 |
| **时间线**（主屏） | 登录成功 / 顶部 logo 单击 / 浏览器后退 | 卡片网格 + 月份分隔 + 排序切换 + 归档入口 | FR-4，UJ-1, UJ-3 |
| **Full Render** | 时间线卡片单击 / 归档成功后跳转 / 上一·下一 Entry 导航 | HTML 沙箱化原貌呈现 + 顶部 chrome + 管理动作入口 | FR-5，FR-7，UJ-1, UJ-2 衔接，UJ-3 |
| **归档** *(modal，非独立 surface)* | 时间线右上"归档"按钮 / 空状态 dropzone / 任意位置 drag .html | 上传 + 元数据预览 + 标题编辑 + 确认 | FR-1, FR-2, FR-3 |
| **删除确认** *(modal)* | Full Render 顶部 ⋯ 菜单 → 删除 | 二次确认 | FR-7 |

**关键约定**：

- **无侧边栏**（hobby 单用户产品 V1 不需要）
- **无 Settings 页**（V1 仅必要的"跟随系统暗色"，无切换器；OQ-1 产品名已定，无更名入口）
- **Modal 嵌套深度上限 = 1**（归档 modal 之上不能再开模态；删除确认在 Full Render 之上算 1 层）
- **Surface closure check**：UJ-1（找回）落在时间线 + Full Render；UJ-2（归档）落在归档 modal + Full Render；UJ-3（演进回看）落在时间线 + Full Render 顺序导航。**所有 UJ 都有归宿；所有 surface 都有 UJ 落点。**

→ **Composition reference**：[`mockups/timeline-mock.html`](./mockups/timeline-mock.html)（时间线主屏 · 9 张语义化卡片 · 月份分隔 · light/dark 双模 · reduced-motion 退化）、[`mockups/full-render-mock.html`](./mockups/full-render-mock.html)（Full Render 视图 · 顶部 chrome + More menu 展开态 + 沙箱化 HTML 内容渲染区）。**Spine 在与 mock 冲突时胜出**。归档 modal / 删除 modal / 空状态 dev 阶段从 spine 表 + Timeline mock 推导。

## Voice and Tone

Microcopy。Brand voice / aesthetic 立场已在 `{DESIGN.md}.Brand & Style` 定义为"克制工具"——本节是它在实际文案中的兑现。

| Do | Don't |
|---|---|
| "上传失败。请重试。" | "哎呀，似乎出错了 😅 让我们再试一次！" |
| "还没有 Entry。" | "你还没归档任何内容哦~ 快上传第一份吧！" |
| "已归档。" | "归档成功！🎉 你的思维已加入档案库。" |
| "已归档。原文件在档案库中。" *(承接 brief"已发生过实际丢失 → 安心"的对消)* | "永远不会再丢了 ✓" |
| "已删除。原始 .html 已不在档案库中。" *(明确告知发生了什么 + 不可逆已成事实)* | "删除完成。" |
| "确认删除？" | "你真的、真的要删除吗？此操作无法撤销哦！" |
| "渲染未能完成。" | "啊哦，这份 .html 似乎有点问题……" |
| "正在加载……" | "请稍候，马上为您呈现..." |
| 用句号收束陈述，不用感叹号 | 不在 voice 中使用 emoji / icon 装饰 |
| 数字优先（"3 份 Entry"） | 不堆砌副词（"非常多 / 大量 / 海量"） |

**统一基调**：陈述、克制、把 alex 当成主角而非被服务的对象。不预测下一步、不引导操作、不评价 alex 的行为。

**例外**：FR-7 删除确认动作的措辞必须包含"无法恢复"明示——这是 safety affordance 不是 voice 选择。

## Component Patterns

行为约束。视觉规格在 `{DESIGN.md}.Components`。

| Component | Use | Behavioral Rules |
|---|---|---|
| **Card** | 时间线 | **单击整张卡片**进入对应 Entry 的 Full Render（FR-4 D14）。缩略预览区 pointer-events 禁用，不响应 HTML 内部的 click——hover 时整张卡片微抬起（视觉规格见 `{DESIGN.md}.Components.Card`）。**禁用 hover overlay 按钮**（管理动作集中在 Full Render，承接 PRD D28） |
| **Month Divider** | 时间线 | 不可交互、不可折叠（PRD D11）。仅作为视觉与语义节奏标记。屏幕阅读器宣告 "{年份} 年 {月份}，{N} 份 Entry" |
| **Dropzone** | 归档入口 | 空时间线时占主区域；有 Entry 时缩成右上"归档"按钮 + **任意位置 drag-and-drop 仍生效**（整屏拖拽区，视觉上隐藏）。文件 drop 时触发归档 modal（FR-1） |
| **Upload Preview Form** | 归档 modal | 标题编辑框预填自动抽取值（FR-2 A1）。归档时间戳显示为 `{typography.mono-metadata}`，**只读**。alex 编辑标题后按确认 → modal 关闭、自动跳进 Full Render（FR-3） |
| **Inline Title Editor** | Full Render 顶部 chrome | **单击标题进入 inline edit 模式**（[ASSUMPTION] Notion / Linear 风格），Blur 或 Enter 保存，Esc 撤销（FR-7 编辑标题）。失败时 inline 错误提示，编辑态保留 |
| **Top Chrome (Full Render)** | Full Render | 固定在 Full Render 视图顶部。左 ← 返回时间线 / 中标题 + 时间 / 右上一·下一 + ⋯ 更多菜单（FR-5 + FR-7） |
| **More Menu (⋯)** | Full Render 顶部右 | 单击展开 dropdown：编辑标题、下载原 .html、**删除（destructive 红色）**。Esc / 点击外部关闭。**所有 FR-7 管理动作的唯一入口** |
| **Download Link** | Full Render More Menu / Render 失败兜底 | 下载按钮触发 **签名 URL + 短时效**（防"链接外泄即数据外泄"，承接 PRD §5 NFR-2 资源层）—— 签名生成机制由架构决定，UX 端只保证：(a) 下载链接不进浏览器历史记录、(b) 链接在会话过期后立即失效、(c) 不暴露存储后端真实 URL |
| **Confirm Dialog** | 删除前 | Modal，标题"确认删除？"，正文"删除后无法恢复。"，按钮"取消" + "删除"（destructive）。删除完成后自动返回时间线（FR-7） |
| **Sort Toggle** | 时间线右上 | 二态切换器：「最新在前」/「最早在前」（FR-4 D10）。切换立即重新排序，**不持久化**——刷新页面回到默认倒序（PRD `[NOTE FOR PM]`） |
| **Auth Screen** | 未认证时 | 极简：MindPrint wordmark + 单一登录入口（机制由架构决定）。无注册、无社交、无找回密码 link（FR-6 + brief V1 硬约束） |
| **Empty State** | 时间线无 Entry / Full Render 渲染失败 | 居中衬线大字 + 描述 + 单一主按钮。voice 遵循 "克制工具" 表 |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| **Cold load** | 时间线 | `{colors.surface-container-low}` skeleton 卡片网格（4-6 张占位），保持网格 layout 不抖动。Auth check + 元数据 fetch 完成后替换 |
| **空时间线** | 时间线 | Empty state：`{typography.display-lg}` "还没有 Entry。" / `{typography.body-lg}` "从这里开始。" / Dropzone 占主区域（PRD §4.2 FR-4 空状态） |
| **有 Entry 但加载缩略预览中** | 时间线 | 卡片框架已显示（标题 + 时间），缩略预览区为 `{colors.surface-container}` 占位 + spinner。视口内的卡片优先加载（IntersectionObserver 视口懒渲染，A4 + A5 落地） |
| **缩略预览生成失败** | 时间线（单卡） | 该卡片退化为"标题 + 时间"占位（**不静默降级到文本摘要**——FR-4 静默降级禁止条），其他卡片不受影响（NFR-3 错误隔离） |
| **归档中**（modal 上传阶段） | 归档 modal | 主按钮 disabled + 进度文字"上传中……"（不用 spinner 圈 + 不用百分比，承接克制 voice） |
| **归档失败** | 归档 modal | inline 错误提示在 modal 底部："{原因}。请重试。" + "重试" 主按钮恢复 enabled。失败不残留半个 Entry（FR-1 事务性） |
| **Full Render 加载** | Full Render | iframe 容器显示 spinner + "正在加载……"。HTML 加载完成后 spinner 消失 |
| **Full Render 失败** | Full Render | "渲染未能完成。" + "下载原文件" 链接（FR-7 下载兜底）+ "返回时间线"按钮。**Entry 仍在库中**——失败不影响归档状态（FR-3 D8） |
| **未认证访问** | 任意 URL | 应用层重定向至登录入口（NFR-2）；API 层返回 401（非 404，避免泄露 Entry 是否存在） |
| **会话过期** | 任意 surface | 重定向至登录 + 登录后回到原 URL [ASSUMPTION] |
| **删除中** | 删除 modal | 删除按钮 disabled + 文字"删除中……"。完成后自动关闭 modal + 返回时间线 |
| **跨设备并发归档** | 时间线 | V1 不处理实时同步——alex 在 A 设备归档后切到 B 设备需手动刷新页面（[ASSUMPTION]）。`[NOTE FOR UX]`：若实际使用中跨设备频繁切换，v2 加 polling 或 WebSocket |

## Interaction Primitives

**点击优先 + 关键键盘等价**。MindPrint 不是 Linear 那种键盘驱动产品，但核心动作必须有键盘可达性（accessibility floor）。

### 鼠标 / 触控

- **单击 Card** → 进入对应 Entry 的 Full Render
- **Hover Card** → 轻微抬起 + 染棕阴影——**这是"漫游中的驻足提示"**，承接 brief"画廊式翻看"中"可漫游、可驻足"的动词节奏。**不强制点击**，alex 可以一直 hover 移动扫过整个网格而不进任何卡片
- **拖拽 .html 文件到任意区域** → 触发归档 modal（dropzone 整屏可接收）
- **单击标题** (Full Render 顶部) → 进入 inline edit 模式
- **单击 ⋯ 菜单** → 展开 dropdown
- **单击遮罩 / × 按钮 / Esc** → 关闭 modal

### 键盘

| 快捷键 | 作用 | 上下文 |
|---|---|---|
| `Esc` | 关闭最顶层 modal / 退出 inline edit / 返回时间线 | 全局 |
| `←` / `→` | 上一条 / 下一条 Entry | **仅 Full Render** |
| `Enter` | 保存当前 inline edit / 确认 modal 主按钮 | inline edit / modal |
| `Tab` / `Shift+Tab` | 顺序焦点移动（包含上一/下一导航 + ⋯ 菜单） | 全局 |
| `Space` / `Enter` | 激活当前焦点元素（卡片单击等价） | 全局 |

**故意不做的快捷键**（避免与浏览器冲突 + 单用户产品不需要密集键位）：
- ⌘K / Ctrl+K 命令面板（V1 不做搜索，无意义）
- `g t` / `g h` 等 vim 风格导航（surface 只有 2 个，不必）
- 数字键跳转（无多 surface 切换需求）

### 触控特例

- **拖拽 .html 在移动端不可行**——iOS Safari / Android Chrome 文件拖拽 API 受限。归档按钮触发系统文件选择器（[ASSUMPTION]）
- **Hover 退化**：移动端无 hover 概念，卡片单击直接进 Full Render（与桌面 hover→单击 行为序列一致）

## Accessibility Floor

行为约束。视觉对比度承诺在 `{DESIGN.md}.Colors`（所有主要 token 对应 surface 验证 ≥ WCAG AA 4.5:1 对比度——`on-surface #1B1C19` vs `surface #FAF8F3` 约 16:1 远超 AAA）。

- **WCAG 2.2 AA** 全 surface 覆盖
- **键盘可达**：所有交互在 Interaction Primitives 表中均有键盘等价
- **Focus ring**：所有可聚焦元素 focus 时显示 2px `{colors.primary}` outline（与背景 4.5:1+ 对比）
- **Tab order**：匹配阅读顺序——时间线为"从顶部归档按钮 → 排序切换 → 卡片网格按行从左到右"；Full Render 为"返回 → 标题 → 上一·下一 → ⋯ 菜单 → 渲染区"
- **屏幕阅读器宣告**：
  - 进入 surface 时宣告 surface 类型："时间线，{N} 份 Entry" / "{Entry 标题}，归档于 {绝对时间}" / "归档对话框"
  - 月份分隔条宣告："{年}年{月}，{N} 份 Entry"
  - 缩略预览图作为 `<iframe>` 时，aria-label = "{Entry 标题} 内容缩略"，不让屏幕阅读器读 iframe 内 HTML
- **错误信息**：使用 `role="alert"` + 可视错误文本（不仅靠颜色——衰红 + 文字双通道）
- **可访问性 escape hatch**：任何 modal / inline edit / dropdown 均能用 Esc 关闭——**没有"必须完成才能退出"的强制流程**
- **Reduced motion**：用户系统设置 `prefers-reduced-motion: reduce` 时——卡片 hover 抬起动画移除、Full Render 切换为瞬移、modal 弹出无动画

## Key Flows

### Flow 1 — 找回旧 Entry（UJ-1，alex 周末晚 9 点）

**场景**：alex 想回看两个月前自己用 AI 生成的"AI 工具调研单页"——名字记不清，但视觉印象还在（深色背景 + 表格）。

1. alex 在 macOS Chrome 打开 `https://mindprint.<domain>`（已认证，30 天会话内）
2. **时间线主屏**加载——卡片网格按月分隔条呈现。最新月份在顶（默认倒序）
3. alex **肉眼下滑两屏**，看到 "2026 年 3 月" 分隔条，停下来
4. 网格里第二张卡的缩略预览呈现深色背景 + 表格的轮廓——alex 一眼认出来"就是这个"
5. **Climax**：单击卡片，Full Render 加载，HTML 原貌呈现。alex 看了三屏内容，按 `Esc` 返回时间线——找回完成
6. **后续可能**：alex 想顺便看看那个月还做了什么 → 按 `←` 进入上一条 Entry，看完 `→` 回来 / 关闭浏览器

**失败分支**：
- 网络中断 → 时间线 skeleton 卡住 → 顶部出现 Toast "网络中断，正在重试……"（[ASSUMPTION]）
- 某张卡片缩略预览生成失败 → 该卡退化为"标题 + 时间"占位，**其他卡正常显示**——alex 仍能通过标题判断是不是要找的那份

### Flow 2 — 归档新 Entry（UJ-2，alex 用 Cursor 生成完一份 .html 后）

**场景**：alex 在 Cursor 里让 Claude 生成了一份新的"AI 工具调研第二轮"单页，导出到 `~/Downloads/index.html`。

1. alex 在浏览器切到 MindPrint 标签页（时间线主屏在）
2. 从 Finder 把 `index.html` 拖到 MindPrint 窗口任意位置——**整屏 dropzone 触发**：界面整体淡色覆盖 + 中央显示"放下以归档"
3. alex 松手——**归档 modal 弹出**：
   - 顶部预览：缩略图 + 标题编辑框预填 "AI 工具调研第二轮"（从 `<title>` 抽取）+ 归档时间戳显示
   - alex 把标题改成 "AI 工具调研 v2（含 6 家对比）"
4. alex 点击"确认"
5. **Climax**：modal 关闭，**自动跳进新 Entry 的 Full Render**——alex 在 < 1 秒内看到自己刚刚归档的 HTML 完整呈现。"档案库正确接住了"——这是 PRD §4.1 描述段的体感兑现
6. alex 按 ← 返回时间线，新 Entry 已在顶部

**失败分支**：
- 文件 > 10MB → modal 不弹出，dropzone 区域出现红色 inline 提示 "文件超过 10MB 上限。请减小后重试。"
- 网络 / 后端故障 → modal 内底部 inline 错误 "上传失败。请重试。" + 主按钮变成"重试"
- 文件不是 .html / .htm → dropzone 红色 inline "仅接受 .html 或 .htm 文件。"
- 重复内容 → V1 不检测，alex 会看到两条卡片（PRD §4.1 FR-1 Out of Scope）

### Flow 3 — 思维演进回看（UJ-3，alex 季度 retro）

**场景**：alex 想看 2026 年 1 月到 5 月这半年自己的思维变化。

1. alex 打开 MindPrint，时间线主屏
2. 单击右上排序切换："最早在前"——网格瞬间反转，最早的 Entry 出现在顶部
3. alex 看到 "2026 年 1 月" 月份分隔条 + 当月的卡片
4. **单击第一张卡** → Full Render
5. **进入"翻页式回看"模式**——alex 不再回时间线，而是连续按 `→`：每按一次，下一条 Entry 加载，顶部 chrome 更新标题 + 归档时间，渲染区 HTML 切换
6. 每条扫一眼，5-10 秒，按 `→`。约 10 分钟翻完 30 条
7. **Climax**：翻到 2026 年 5 月某一条停下，alex 看见自己最近的产出风格——和 1 月对比，对自己思维状态有了新的判断
8. 按 `Esc` 返回时间线，关闭浏览器

**Reduced motion 用户的体验**：步骤 5 中每次 `→` 切换无动画，HTML 瞬间替换——节奏感稍弱但功能完整。

## Inspiration & Anti-patterns

**Lifted from Are.na**：卡片网格作为"视觉档案"的呈现方式——卡片本身就是内容，UI chrome 退居二线。MindPrint 的整体网格密度向 Are.na 看齐（**但更安静**——单一强调色而非 Are.na 那种荧光高对比）。

**Lifted from Linear**：克制 voice + 键盘 escape hatch（`Esc` 无死角）+ inline edit (Notion 也用了类似模式)。

**Lifted from Notion**：标题 inline edit 模式——单击标题进入编辑、blur 保存，**无 edit / view mode toggle**。

**Lifted from 私人书房**：月份分隔条 + 衬线字体作为时间感锚点。这不是任何具体产品的复刻——而是对"私人档案"心智模型的视觉化。

**Rejected — 推送 / 邮件 / 红点 / 通知**：MindPrint **永远不通过这些机制刺激 alex 打开应用**（PRD §8.3 SM-C2 反向指标）。回看必须是 alex 自然产生的行为。

**Rejected — AI 推荐 / "为你"卡片**：MindPrint 不预测 alex 想看什么。时间线就是时间线，alex 自己选下一个看什么。

**Rejected — 多用户 / 协作 / 分享 / 公开链接**：永久边界（PRD §6.1）。

**Rejected — 标签 / 搜索 / 过滤**：V1 不做（PRD §6.2 + §7.2"最容易冲动加但必须不做的三条"之一）。50 条目以内时间线 + 缩略预览足以应对。

**Rejected — 卡片悬浮快捷预览（Quick Look）**：交互模式单一 = 单击直接进 Full Render（FR-4 D14）。无 hover preview / 右键菜单 / 长按操作。

**Rejected — 沉浸全屏模式（隐藏 MindPrint chrome）**：V1 Out of Scope（PRD §4.3 OQ-6），M3 retro 再评估。

**Rejected — 拖拽排序 / 自定义分组 / 收藏标记**：时间线的语义是"归档时间序"，alex 不可改。`[NOTE FOR UX]`：M3 阶段 retro 若发现"想标记某些 Entry 为重要"成立，再加 starred 概念。

## Responsive & Platform

| Breakpoint | 时间线 | Full Render | 归档 modal |
|---|---|---|---|
| `≥ 1440px` | 4 列网格 + 桌面 margin 56px | 渲染区最大宽 1200px 居中 | modal 宽 560px 居中 |
| `1024–1440px` | 3 列网格 | 渲染区最大宽 1000px | modal 宽 560px |
| `768–1024px` | 2 列网格 + margin 32px | 渲染区填满主区域 | modal 宽 480px |
| `< 768px`（移动） | 1 列网格 + margin 20px + 顶部归档按钮变 floating action | 渲染区填满 + 顶部 chrome 转为更紧凑形态（图标为主） | modal 全屏化（覆盖整个视口） |

**移动端的关键退化**：

- **拖拽上传不可用** → 归档按钮触发系统文件选择器
- **Hover 移除** → 卡片无 hover 抬起，单击即进 Full Render
- **顶部 chrome 紧凑化** → 标题截断更狠（1 行）；上一/下一按钮变图标无 label；⋯ 菜单展开为底部 sheet 而非 dropdown

**不做的事**：
- V1 不做 PWA（设计决策见 PRD §6.2 "V1 暂不做"，未来视使用情况评估）
- 不做原生 App
- 不在移动端添加桌面没有的功能（如手势、底部 tab bar）——保持 surface 与 IA 一致
