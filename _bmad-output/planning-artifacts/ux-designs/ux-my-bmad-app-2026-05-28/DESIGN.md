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
peer: ./EXPERIENCE.md

colors:
  # Light mode (default) — "纸张 + 墨 + 旧书皮"
  surface: '#FAF8F3'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F5F2EB'
  surface-container: '#F0EDE5'
  surface-container-high: '#EAE7DD'
  surface-container-highest: '#E4E0D5'
  on-surface: '#1B1C19'           # 墨黑文字
  on-surface-variant: '#4E453D'   # 次要文字 / 元数据
  outline: '#80756B'              # dust 实线
  outline-variant: '#D1C4B9'      # dust ghost 边
  primary: '#735C41'              # 旧书皮深棕 — buttons / hover / selected
  on-primary: '#FAF8F3'
  primary-container: '#F0E5D2'
  on-primary-container: '#3A2B16'
  secondary: '#B84A39'            # 衰红 — 极少使用，仅强调 / 错误 / 删除提示
  on-secondary: '#FFFFFF'
  error: '#BA1A1A'
  on-error: '#FFFFFF'
  error-container: '#FFDAD6'
  on-error-container: '#93000A'
  background: '#FAF8F3'
  on-background: '#1B1C19'
  inverse-surface: '#1B1C19'
  inverse-on-surface: '#FAF8F3'

  # Dark mode — "夜读灯下的旧书皮"
  dark-surface: '#1A1B19'
  dark-surface-container-low: '#22231F'
  dark-surface-container: '#28291F'
  dark-surface-container-high: '#33342B'
  dark-on-surface: '#F0EDE5'
  dark-on-surface-variant: '#C2BAA9'
  dark-outline: '#9A8E80'
  dark-outline-variant: '#3D3A33'
  dark-primary: '#E0C1A1'          # 倒置：深棕 → 暖米色
  dark-on-primary: '#3A2B16'
  dark-primary-container: '#5A4730'
  dark-on-primary-container: '#F5D6B4'
  dark-secondary: '#E0A192'        # 衰红 → 暖珊瑚
  dark-on-secondary: '#5A1A0F'
  dark-background: '#1A1B19'
  dark-on-background: '#F0EDE5'

typography:
  # 中文优先，所有 fontFamily 字符串以"中文 → 英文 → 系统 fallback"顺序声明
  display-lg:
    fontFamily: '"Source Han Serif SC", "Noto Serif CJK SC", "Newsreader", "ET Book", Georgia, serif'
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.15'
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: '"Source Han Serif SC", "Noto Serif CJK SC", "Newsreader", Georgia, serif'
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: '"Source Han Serif SC", "Noto Serif CJK SC", "Newsreader", Georgia, serif'
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.25'
  headline-sm:
    fontFamily: '"Source Han Serif SC", "Noto Serif CJK SC", "Newsreader", Georgia, serif'
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: '"Source Han Serif SC", "Noto Serif CJK SC", "Newsreader", Georgia, serif'
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.65'
  body-md:
    fontFamily: '"Source Han Sans SC", "Noto Sans CJK SC", "Inter", -apple-system, system-ui, sans-serif'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: '"Source Han Sans SC", "Noto Sans CJK SC", "Inter", -apple-system, sans-serif'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.08em
    textTransform: uppercase
  caption:
    fontFamily: '"Source Han Sans SC", "Noto Sans CJK SC", "Inter", -apple-system, sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  mono-metadata:
    fontFamily: '"JetBrains Mono", "SF Mono", "Source Han Mono", ui-monospace, monospace'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: 0.02em

rounded:
  sm: 0.125rem      # 2px — input 下划线 / 细节边
  DEFAULT: 0.25rem  # 4px — 按钮 / 标签
  md: 0.375rem      # 6px — chips
  lg: 0.5rem        # 8px — cards / modal
  xl: 0.75rem       # 12px — large containers
  full: 9999px

spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 56px
  editorial-gap: 64px         # 月份分隔条上下间距
  card-gap: 20px              # 卡片网格 grid-gap
  card-padding: 16px

components:
  card:
    background: '{colors.surface-container-low}'
    border: '1px solid {colors.outline-variant}'
    rounded: '{rounded.lg}'
    shadow-rest: '0 1px 2px rgba(115, 92, 65, 0.04)'
    shadow-hover: '0 4px 12px rgba(115, 92, 65, 0.08), 0 1px 2px rgba(115, 92, 65, 0.06)'
  button-primary:
    background: '{colors.primary}'
    color: '{colors.on-primary}'
    rounded: '{rounded.DEFAULT}'
    padding: '8px 20px'
    typography: '{typography.label-caps}'
  button-secondary:
    background: 'transparent'
    color: '{colors.on-surface}'
    border: '1px solid {colors.outline-variant}'
    rounded: '{rounded.DEFAULT}'
    padding: '8px 20px'
  button-destructive:
    background: '{colors.secondary}'
    color: '{colors.on-secondary}'
    rounded: '{rounded.DEFAULT}'
  input-underline:
    border-bottom: '1px solid {colors.outline-variant}'
    focus-border-bottom: '1px solid {colors.primary}'
    typography: '{typography.body-md}'
  month-divider:
    typography: '{typography.headline-md}'
    rule-color: '{colors.outline-variant}'
    rule-thickness: '1px'
---

# DESIGN.md · MindPrint

> **视觉参考 mocks**：[`mockups/timeline-mock.html`](./mockups/timeline-mock.html) · [`mockups/full-render-mock.html`](./mockups/full-render-mock.html)。两个 mock 实现了本 spine 的所有关键 token——颜色、字体、间距、组件视觉规格。**Spine 在与 mock 冲突时胜出**。

## Brand & Style

MindPrint 是 **alex 的私人思维档案馆**。视觉哲学一句话——*让 HTML 内容自己说话，UI 是承载它们的纸张与书架，不抢戏*。

整体风格定位 **"Editorial Archive"**（编辑档案）：

- **隐喻锚点**：私人书房 / 旧档案室 / 装帧考究的笔记本。**承接 brief §问题中 "画廊式翻看" 体感隐喻** —— 每张卡片是档案柜里的一份独立藏品，时间线是这个书房按月份排列的目录。
- **核心张力**：**视觉温度** vs **voice 克制**——视觉给到"档案馆纸质感"的暖意（让 alex 进入有沉浸感），但 voice 是工具克制（不寒暄、不智能化煽情，承接 §8.3 SM-C2 "不优化打开频次"的反推）。最终体验：像走进一家安静的私人书店——氛围温暖，但店员不打扰。
- **反向定位**：MindPrint 不是 Notion / Linear / Google Drive。它没有协作、没有侧边栏菜单、没有推送、没有 AI 智能推荐。它是 alex 一个人的档案，**UI 越透明、内容越显眼，越成功**。

## Colors

调色板灵感：旧书皮、亚麻纸、墨水、夕阳衰红。**功能定位极简**——绝大多数界面只用 3 个颜色：暖白底（surface）、墨黑字（on-surface）、灰墨次文字（on-surface-variant）。

- **Surface 暖白 `#FAF8F3`**：主背景。**全屏占据视野，让卡片浮在上面而非镶嵌于色块**。
- **Surface container low `#F5F2EB`**：卡片背景。比 surface 略深一档，制造极轻的"纸张叠层感"。
- **On-surface 墨黑 `#1B1C19`**：正文字。非纯黑，偏墨绿黑，眼镜友好。
- **Outline-variant dust `#D1C4B9`**：1px ghost 边——卡片描边、月份分隔横线、input 下划线。**这是 UI 的"骨架色"**，比阴影低调，比纯白边醒目。
- **Primary 旧书皮深棕 `#735C41`**：主按钮 fill、selected state、hover focus。**用于"alex 的动作"** 的颜色——归档、确认、链接。
- **Secondary 衰红 `#B84A39`**：极少使用。只在以下场景出现：删除确认按钮、错误提示前置图标、Open Question 醒目标记。**全屏面积加起来不超过 50px²**。
- **Error `#BA1A1A`**：上传失败 / 网络错误的标准红。比衰红更刺眼，用于"真坏掉了"的硬错误。

**暗色模式（V1 正式承诺）**：tokens 完整定义（见 frontmatter `dark-*`），**跟随系统 `prefers-color-scheme: dark` 切换**——alex 不需要手动开关。暗色版本以"夜读灯下的旧书皮"为基调——背景深墨绿黑 `#1A1B19`，文字象牙白 `#F0EDE5`，主色倒置为暖米色 `#E0C1A1`（深棕在暗背景下不够对比度）。这是 brief / PRD 未明示但 alex 在 UX Discovery 阶段显式扩展进 V1 的承诺（2026-05-28），架构 / dev 阶段必须实现。

## Typography

字体是 MindPrint 视觉表达的主载体。中文优先，所有 family 声明以"中文宋体 → 英文 serif → 系统 fallback"链承接。

- **Source Han Serif SC（思源宋体）** 作为中文衬线主字体——标题、正文、卡片显示标题。**这是档案馆质感的核心载体**。
- **Newsreader / ET Book** 作为英文衬线 fallback——技术术语（如 "Entry"、"Timeline"）穿插在中文中时使用同样的衬线节奏。
- **Source Han Sans SC（思源黑体）/ Inter** 作为无衬线辅助字体——仅用于 UI 元素：按钮、标签、表单 label、菜单。**比例上不超过 UI 总字数的 15%**。
- **JetBrains Mono / SF Mono** 作为等宽字体——专用于 metadata：归档时间戳（绝对时间 hover）、文件大小、版本号。**等宽给"档案登记"的精确感**。

**字号 / 行高规则**：
- 大标题 `display-lg` (48px / 1.15) 主要出现在**月份分隔条**和**空状态**——稀疏使用，每屏不超过 1 个。
- 卡片标题 `headline-sm` (20px / 1.3) 是最高频字号——多行截断，2-3 行。
- 正文 `body-lg` (17px / 1.65) 用于较少的描述文本（如错误提示展开）。
- 元数据 `caption` (13px) + `mono-metadata` (12px 等宽) 用于时间戳、文件名、技术细节。

**字间距**：标签 `label-caps` 字间距 0.08em + uppercase，给"档案标签纸"的质感。

## Layout & Spacing

8px base unit。**整体偏宽松**——承接"archive 沉浸感"，UI 不应让 alex 感觉拥挤。

- **桌面 margin 56px** vs **移动 margin 20px**——桌面留出大量呼吸空间，让卡片网格居中浮现。
- **Editorial gap 64px**——月份分隔条上下使用此间距，给"翻页"的节奏感。
- **Card gap 20px**——卡片之间的网格间距。够近以呈现"密度感"，够远以让每张卡独立呼吸。
- **Card padding 16px**——卡片内部 padding（标题 + 元数据区与边的距离）。
- **网格列数**：响应式 — `< 768px` 1 列（移动）、`768-1024px` 2 列、`1024-1440px` 3 列、`> 1440px` 4 列。**最大不超过 4 列**——再多会丢失卡片个体的存在感。**断点与 `{EXPERIENCE.md}.Responsive & Platform` 严格一致**。

## Elevation & Depth

深度由 **tonal layering + 极轻阴影**表达，**避免硬边界 + 强投影**。

- **Tonal layering**：卡片用 `surface-container-low` 比 surface 略深一档，制造"纸张叠在纸张上"的层次。Modal 用 `surface-container-high` 进一步加深一档。
- **阴影**：极轻、染棕（基于 primary 色调 `rgba(115, 92, 65, ...)`）。卡片默认阴影几乎不可见（`0 1px 2px rgba(115, 92, 65, 0.04)`），hover 时柔和提升（`0 4px 12px rgba(115, 92, 65, 0.08)`）。**绝不使用纯黑投影或硬阴影**。
- **边框**：1px `outline-variant` (dust) ghost outline——比阴影更靠"线稿"，给"档案标签纸"的边缘感。**所有卡片都有 1px dust 边**——这是 MindPrint 的视觉签名。

## Shapes

形状语言：**软方（Soft Rectangular）**。整体偏方正——衬呼应"档案纸张"的方形质感；但所有边角微圆 0.25rem，避免"工程感"过度的尖锐。

- **按钮 / 标签**：`rounded.DEFAULT` (4px)——足够柔和但不显得圆胖。
- **卡片 / Modal**：`rounded.lg` (8px)——稍大圆角，让大块元素有"独立物体感"。
- **Input 下划线**：`rounded.sm` (2px) 或不圆——下划线本身就是直线。
- **缩略预览容器**：跟随卡片圆角，clip-path 对 HTML 内容做圆角裁切。

## Components

### Card

时间线上的核心组件，承载一个 Entry。

- **结构**（上 → 下）：HTML 内容缩略预览（视觉主体，约占 65% 卡片高度） + 显示标题（`headline-sm`，2-3 行截断） + 归档时间（`caption` 相对格式，hover 显示 `mono-metadata` 绝对时间戳）
- **背景** `surface-container-low`，**边** 1px dust ghost outline，**圆角** `rounded.lg`
- **默认阴影几乎不可见**，hover 抬起到 `0 4px 12px rgba(115, 92, 65, 0.08)`
- **缩略预览区**：呈现原 HTML 视觉外观；pointer-events 禁用（卡片整体单击进 Full Render）。**生成机制 spine 不锁**——由架构阶段决定（详见 PRD §10 A5 + OQ-8 + addendum §2.4）
- **没有 overlay 按钮**——hover 不出现"删除 / 编辑"等行内操作（管理动作集中在 Full Render，承接 PRD §4.4 D28）

### Month Divider

月份分隔条 —— 时间线的"目录骨架"。

- **结构**：左对齐衬线大字（如 `2026 年 5 月`，`headline-md`） + 右侧 1px dust 横线延伸到容器右边缘
- **上下间距** `editorial-gap` (64px)——给"翻页"节奏感
- **语义角色**：让 alex 从视觉密度反向感受"那个月我做了多少"——这是 §1 thesis "思维演进回看" 的视觉锚点
- **绝不折叠**——它不是导航元素，而是阅读节奏标记

### Button

- **Primary**：`primary` (旧书皮深棕) 实心 fill + 暖白字 + `label-caps` 字号 + 8/20px padding + 4px 圆角。例："归档"、"确认"、"保存"
- **Secondary**：纯文字 + 1px dust 边 + `on-surface` 颜色。例："取消"
- **Destructive**：`secondary` (衰红) 实心 fill + 白字。**只用于删除确认按钮**——其余位置一律禁用衰红
- **悬停**：primary 加深 5%，secondary 边框变 primary 色，destructive 加深

### Input

- **默认形态**：1px dust 底部下划线 + 透明背景 + `body-md`。**不用 box 边框**——下划线给"手写"质感
- **聚焦**：下划线变 primary 色（深棕），无 ring
- **错误**：下划线变 error 红
- **Label**：上方 `label-caps`，字间距 0.08em uppercase

### Dropzone（归档上传区）

- **空状态主显**：暖白背景 + dashed 2px dust 边 + 居中"拖拽 .html 至此 / 或点击选择"。整个时间线主区域被它占满
- **有 Entry 时**：缩小为右上角"归档"按钮 + 仍然支持任意位置 drag-and-drop（dropzone 整屏可拖，但视觉上隐藏）
- **拖拽悬停态**：dropzone 背景变 `surface-container-high`，边变 primary 实线

### Modal / Dialog

- **居中弹出**，`surface-container-high` 背景，`rounded.lg`，soft shadow（比卡片重一档）
- **背后遮罩**：`rgba(27, 28, 25, 0.4)`（墨黑半透明，不是纯黑）
- **关闭手段**：右上角 × 按钮 + Esc 键 + 点击遮罩区
- **标题** `headline-sm`，**正文** `body-lg`，**操作按钮**右对齐底部

### Top Chrome（Full Render 视图顶部条）

- **左**：← 返回时间线（图标 + 文字 label）
- **中左**：当前 Entry 的显示标题（`headline-sm`，单行截断）+ 归档时间（`caption`）
- **中右**：⟨ ⟩ 上一条 / 下一条 Entry 导航
- **右**：⋯ 更多 menu（编辑标题 / 下载原文件 / 删除）
- **背景**：`surface` + 1px dust 底边——视觉上是"卡片渲染区上方的导航纸条"

### Empty State

- **居中布局**，`display-lg` 衬线大字 + `body-lg` 描述 + 单一主按钮
- 例："还没有 Entry。" / "从这里开始。" + 拖拽区
- **不使用插图 / icon**——让文字本身承担情绪

## Do's and Don'ts

**Do**

- 让 HTML 内容缩略预览成为卡片视觉主角——UI chrome（标题 / 时间 / 边）退居二线
- 用衬线字体承担"档案馆"质感——避免 UI 等宽字 + 大粗字组合的"Web 3 风"
- 卡片之间保持充分呼吸空间——20px gap 是下限，**不为塞更多卡而压缩**
- 月份分隔条用 `display-lg` 衬线大字 + 1px dust 横线——这是时间线的视觉锚点，**不省略不折叠**
- 暗色模式让 token 倒置——主色深棕 → 暖米色，背景 → 墨绿黑

**Don't**

- **不要**在卡片上加 hover overlay 按钮（删除 / 编辑 / ⋯）——所有管理动作集中在 Full Render
- **不要**用衰红 `#B84A39` 做主色——它是极少使用的"标记色"，全屏面积上限 50px²
- **不要**使用 emoji 或 icon 装饰 voice 文本——克制工具调性禁止煽情
- **不要**给 empty state 加插图 / illustration——文字本身承担情绪
- **不要**用渐变背景 / 玻璃拟态 / Neumorphism 等 trending 效果——它们违反"档案馆"的静态质感
- **不要**在卡片标题下显示文件名（如 `index-2.html`）——alex 关心的是"什么时候做的什么"，原始文件名是底层细节
- **不要**在时间线上做悬浮预览 / Quick Look——单一交互模式：单击进 Full Render（承接 PRD §4.2 D14）
