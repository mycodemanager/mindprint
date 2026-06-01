# UX Rubric Review · MindPrint
> Reviewer: BMAD UX Finalize rubric, hobby / 单用户 / Fast path 校准
> Date: 2026-05-28
> Inputs: DESIGN.md (草拟完成), EXPERIENCE.md (草拟完成), .decision-log.md, prd.md (final), brief.md (final)

---

## 总体裁定（Overall Verdict）

**通过（PASS）**——两份 spine 完整覆盖 PRD 的 7 FRs / 3 UJs / 3 NFRs，token 体系完整且 cross-reference 准确，"Editorial Archive + 克制工具"风格在 DESIGN 和 EXPERIENCE 中保持一致。Fast path 的代价主要表现在**少量 [ASSUMPTION] 未做替代方案探勘**（如 inline title edit 默认 Notion 模式、归档进度的 voice 表述）和**几处视觉判断未引用 brief / PRD 锚点**，但下游 dev / architecture 可基于这两份 spine 安全推进。**不需要返工**，但建议在 finalize 时让 alex 显式确认 4 条 [ASSUMPTION] 标签。

---

## 1. DESIGN.md spine coverage — **STRONG**

### 章节完整度
- ✅ **Brand & Style**（含隐喻锚点、核心张力、反向定位三段）
- ✅ **Colors**（含 light + dark 两套，按 functional 角色编排）
- ✅ **Typography**（中文优先字体栈、字号 / 行高规则、字间距说明）
- ✅ **Layout & Spacing**（8px base、margin 桌面 vs 移动、editorial-gap、网格列数）
- ✅ **Elevation & Depth**（tonal layering + 极轻阴影 + 1px dust outline 三段）
- ✅ **Shapes**（软方语言 + 各组件圆角分配）
- ✅ **Components**（Card / Month Divider / Button / Input / Dropzone / Modal / Top Chrome / Empty State 共 8 个）
- ✅ **Do's and Don'ts**（5 条 Do + 7 条 Don't，明确反向边界）

### Token 充分度（YAML frontmatter）
- ✅ **colors**：light + dark 双套 tokens 完整，含 surface tier / on-* / outline / primary / secondary / error
- ✅ **typography**：8 级（display-lg → mono-metadata），含 mobile fallback
- ✅ **rounded**：6 级（sm / DEFAULT / md / lg / xl / full）
- ✅ **spacing**：含 unit / gutter / margin-mobile / margin-desktop / editorial-gap / card-gap / card-padding
- ✅ **components**：6 个组件的视觉 token（card / button-primary / button-secondary / button-destructive / input-underline / month-divider）

### 强项
- 颜色的"功能定位"段（"绝大多数界面只用 3 个颜色"）+ secondary "全屏面积加起来不超过 50px²"——给后续 dev 一个可被审查的视觉预算
- 字体的"15% UI 比例上限"——明确无衬线辅助字体的使用边界
- "1px dust 边——这是 MindPrint 的视觉签名"承接到 Components.Card——视觉签名作为 design system identity 显式声明，下游可基于此做一致性测试
- Don't 列表中"不在卡片下显示原始文件名"承接 PRD §3 Glossary 的"元数据"定义（原始文件名是底层属性而非 alex 关心的语义）——边界推理而非随意主张

### 弱项 / 待改
- 🟡 **[低优]** Typography 表中 `body-lg` 是衬线（Source Han Serif SC）而 `body-md` 是无衬线（Source Han Sans SC）——这是个 deliberate decision（衬线给"档案感"），但 Component table 中**未明确何处用 body-lg 何处用 body-md**。建议在 Components.Card 段补一句 "卡片标题 = headline-sm；正文用 body-lg；UI label / button = label-caps / body-md (sans)"
- 🟡 **[低优]** Components 中 `Dropzone` 组件未在 frontmatter `components:` token 列表中定义——视觉规格仅在散文中描述（"dashed 2px dust 边"等）。Fast path 可接受，但下游可能漏出
- 🟡 **[低优]** Shadow 颜色用 `rgba(115, 92, 65, 0.04)` 而非 token 引用——硬编码 RGB 值会在 dark mode 出问题（暗背景下染棕阴影几乎不可见）。建议在 dark frontmatter 补一组 `dark-shadow-rest` / `dark-shadow-hover`

---

## 2. EXPERIENCE.md spine coverage — **STRONG**

### 必须章节完整度
- ✅ **Foundation**（单用户 / 形式因子 / UI inheritance / 沙箱化 DNA）
- ✅ **Information Architecture**（5 surface 表 + Realizes 列 + 关键约定）
- ✅ **Voice and Tone**（8 行 Do/Don't 表 + 统一基调段 + 例外说明）
- ✅ **Component Patterns**（11 组件的行为规则表）
- ✅ **State Patterns**（12 行状态表，含 cold load / 空 / 加载中 / 失败 / 未认证 / 会话过期 / 跨设备并发）
- ✅ **Interaction Primitives**（鼠标 + 键盘 + 触控特例 三段）
- ✅ **Accessibility Floor**（WCAG 2.2 AA + 键盘 + focus ring + Tab order + 屏幕阅读器 + reduced motion）
- ✅ **Key Flows**（3 条 flow，对齐 UJ-1/2/3，含 climax beat + 失败分支）

### When-triggered 章节
- ✅ **Inspiration & Anti-patterns**（含 lifted-from 4 条 + rejected 6 条）—— rejected 段尤其扎实
- ✅ **Responsive & Platform**（4-tier breakpoint 表 + 移动端关键退化 + "不做的事"列表）

### 强项
- IA 表的 "Realizes" 列直接绑定 FR / UJ 编号——下游 epic / story 拆解可以做反向追溯
- IA "Surface closure check" 段（"所有 UJ 都有归宿；所有 surface 都有 UJ 落点"）——主动证明 surface closure 而非让 reviewer 自己核对
- Interaction Primitives 中 "故意不做的快捷键" 段（⌘K / vim 风格 / 数字键）——边界声明胜过寂静
- State Patterns 含 "跨设备并发归档" 行（V1 不实时同步 + `[NOTE FOR UX]` v2 触发条件）——主动暴露 V1 边界
- Key Flows 中 Flow 3 的 Reduced motion 退化说明——把 accessibility floor 落到具体场景而非抽象承诺

### 弱项 / 待改
- 🟡 **[低优]** Component Patterns 表的 "Inline Title Editor" 行标注 `[ASSUMPTION]`，但**未给替代方案**——Fast path 跳过了"see-to-decide"的创意环节。如果 alex 实际在 finalize 想换成 "edit / view mode 切换" 风格，需要额外讨论。建议在 finalize 给 alex 一个 yes/no（"用 Notion 风格 inline edit"）
- 🟡 **[低优]** State Patterns 中 "归档失败 inline 错误提示" 与 Voice 表"上传失败。请重试。"措辞匹配，但**未规定具体错误文案模板**（如网络中断 vs 后端失败 vs 文件不合规）—— Flow 2 给了 3 条具体文案（10MB 超限、上传失败、文件类型），但 State Patterns 没把这些汇总。建议补一个"错误文案 lookup 表"

---

## 3. Cross-references — **STRONG**

### `{path.to.token}` 引用准确性核查
- ✅ `{DESIGN.md}.Brand & Style`（Voice 段引用）—— DESIGN.md `## Brand & Style` 章节存在
- ✅ `{DESIGN.md}.Colors`（Accessibility Floor 段引用）—— 存在
- ✅ `{DESIGN.md}.Components.Card`（Component Patterns 表引用）—— 存在
- ✅ `{DESIGN.md}.Components`（Component Patterns 节首引用）—— 存在
- ✅ `{colors.surface-container-low}`（State Patterns）—— frontmatter 存在
- ✅ `{colors.surface-container}`（State Patterns）—— frontmatter 存在
- ✅ `{colors.primary}`（Accessibility Floor）—— frontmatter 存在
- ✅ `{typography.display-lg}` / `{typography.body-lg}` / `{typography.mono-metadata}`（State Patterns + Component Patterns）—— frontmatter 均存在

### 强项
- EXPERIENCE.md 顶部 metadata 段显式声明 "视觉表达全部委托给 DESIGN.md（用 `{path.to.token}` 跨引）" + "两份 spine 在与 mocks 冲突时胜出"——precedence rule 显式
- 无任何 dangling token 引用——所有 `{...}` 都能在 DESIGN.md frontmatter 找到对应项

### 弱项 / 待改
- 无显著弱项。

---

## 4. Surface closure — **STRONG**

### UJ → Surface 反向核查
- **UJ-1 找回旧 Entry**：时间线（卡片浏览定位）+ Full Render（点击进入查看）✅
- **UJ-2 归档新 Entry**：归档 modal（拖拽 → 元数据 → 标题编辑 → 确认）+ Full Render（归档后自动跳转）✅
- **UJ-3 思维演进回看**：时间线（月份分隔 + 排序切换）+ Full Render（连续 ← → 翻页）✅

### Surface → UJ 正向核查
- **登录**：所有 UJ 的前置条件（FR-6）✅
- **时间线**：UJ-1, UJ-3 ✅
- **Full Render**：UJ-1, UJ-2 衔接, UJ-3 ✅
- **归档 modal**：UJ-2 ✅
- **删除确认 modal**：服务 FR-7 "数据所有权 + 不误删"——不直接 realize 任何 UJ，但属"长期可持续使用基础"（PRD §4.4 描述段已 anchor）✅

### 强项
- IA 表的最后一行 "Surface closure check" 段——**主动证明** closure 而非让 reviewer 自己核对
- Flow 1（找回）+ Flow 3（演进回看）都用了"时间线 → Full Render → 返回时间线"的 round trip，体现"找回 + 演进"的同源不同节奏

### 弱项 / 待改
- 无显著弱项。

---

## 5. PRD承接 — **STRONG**

### 7 FRs × 2 spine 落点
| FR | DESIGN | EXPERIENCE |
|---|---|---|
| FR-1 上传 | Dropzone 组件 | Component Patterns (Dropzone) + Flow 2 + State (归档中/失败) |
| FR-2 元数据 + 标题预填 | Modal | Component Patterns (Upload Preview Form) + Flow 2 第3步 |
| FR-3 归档→Full Render | — | Component Patterns + Flow 2 climax |
| FR-4 时间线网格 | Card + Month Divider + Empty State + Layout 网格列数 | IA + Component Patterns (Card, Month Divider, Sort Toggle) + State Patterns + Flow 1 |
| FR-5 完整渲染 | Top Chrome | Component Patterns + Interaction Primitives + Flow 1 第5步 + Flow 3 第5步 |
| FR-6 私有访问 | — | IA (登录 surface) + Component Patterns (Auth Screen) + State (未认证/会话过期) |
| FR-7 管理动作 | Modal + Button-destructive | Component Patterns (Inline Title Editor / More Menu / Confirm Dialog) + State (删除中) |

### 3 UJs × 2 spine 落点
- ✅ 三个 UJ 均映射到 IA 表 + Key Flows（一一对应）

### 3 NFRs
- ✅ **NFR-1 沙箱化**：Foundation 段（"沙箱化是产品 DNA"）+ Component Patterns Card 行（pointer-events 禁用）+ State (Full Render 加载) + A11y 段（屏幕阅读器不读 iframe 内 HTML）
- ✅ **NFR-2 私有访问**：IA + Component Patterns Auth Screen + State (未认证/会话过期/API 层 401)
- ✅ **NFR-3 可靠性**：State Patterns "缩略预览生成失败"行（错误隔离）+ Flow 2/1 失败分支

### Key Thesis 承接
- ✅ **"画廊式翻看"**：DESIGN.md Brand & Style 第一段显式 anchor 到 brief；时间线卡片网格 + HTML 缩略预览（FR-4）+ 月份分隔条 + Flow 1/3 三处落地
- ✅ **"思维演进回看"**：DESIGN.md Month Divider 组件描述 "thesis 思维演进回看 的视觉锚点"；Flow 3 直接对应 UJ-3 + Reduced motion 备注

### 弱项 / 待改
- 🟢 无遗漏 FR / UJ / NFR。
- 🟡 **[中优]** **OQ-8 缩略预览生成机制**：PRD 倾向方案 a（缩放 iframe），DESIGN.md Card 段注明 "iframe sandbox（PRD §10 OQ-8 倾向方案 a），CSS scale 缩放，pointer-events 禁用"——技术细节已写入 spine，**但这违反了"spine 不锁机制"的原则**——若架构阶段决定换方案，spine 需改。建议把 "iframe sandbox" 改为更抽象的 "沙箱化容器（机制由架构阶段决定，见 PRD OQ-8）"，把 `CSS scale 缩放` 移到注释。**Fast path 跳过创意阶段没注意到这点是预期**
- 🟡 **[低优]** **A1 标题抽取规则**：PRD FR-2 规定 `<title>` → 文件名 fallback；EXPERIENCE.md Flow 2 第 3 步只说 "预填 'AI 工具调研第二轮'（从 `<title>` 抽取）"——fallback 路径未在 Component Patterns 显式提及。建议在 "Upload Preview Form" 行补一句 "若 `<title>` 缺失或为空，预填值降级为文件名（去扩展名）"

---

## 6. Voice and Tone consistency — **STRONG**

### "克制工具" vs "Editorial Archive" 张力分析
DESIGN.md 显式承认了核心张力（Brand & Style 第二段）："视觉给到'档案馆纸质感'的暖意（让 alex 进入有沉浸感），但 voice 是工具克制（不寒暄、不智能化煽情）"。**这种"视觉温度 + voice 克制"的双层张力本身是 Editorial Archive 的核心命题——视觉档案不是冷峻，但语言不抒情**。

### 一致性核查
- ✅ DESIGN Don't "不要使用 emoji 或 icon 装饰 voice 文本" 与 EXPERIENCE Voice 表 "不在 voice 中使用 emoji" 完全一致
- ✅ DESIGN Empty State "不使用插图 / icon——让文字本身承担情绪" 与 EXPERIENCE Voice "陈述、克制" 协调
- ✅ DESIGN Button-destructive (衰红) 仅用于删除确认按钮 与 EXPERIENCE Voice 例外说明 "FR-7 删除确认动作的措辞必须包含'无法恢复'明示——这是 safety affordance 不是 voice 选择" 形成 visual-tone 双轴一致
- ✅ EXPERIENCE "陈述、克制、把 alex 当成主角而非被服务的对象" 与 DESIGN "UI chrome 退居二线、内容自己说话" 哲学一致

### 强项
- 双层张力（视觉温暖 vs voice 克制）的**显式声明**——这是 Fast path 罕见的优秀片段，通常 fast path 会回避张力。
- EXPERIENCE Voice 表的 "数字优先（'3 份 Entry'）" 对应 DESIGN 的 mono-metadata 字体——voice 与 typography 互锁。

### 弱项 / 待改
- 无显著弱项。

---

## 7. Accessibility Floor — **ADEQUATE**

### WCAG 2.2 AA 覆盖
- ✅ 颜色对比度：EXPERIENCE.md A11y 段显式声明 "`on-surface #1B1C19` vs `surface #FAF8F3` 约 16:1 远超 AAA"——验证落地
- ✅ 键盘可达：Interaction Primitives 键盘表 6 行 + 故意不做的快捷键段
- ✅ Focus ring：2px primary outline 显式定义
- ✅ Tab order：时间线 + Full Render 两个 surface 的 Tab 顺序都明确
- ✅ 屏幕阅读器：surface 进入宣告 + 月份分隔条宣告 + iframe aria-label
- ✅ 错误信息：`role="alert"` + 双通道（颜色 + 文字）
- ✅ Escape hatch：所有 modal / inline edit / dropdown 可 Esc 关闭
- ✅ Reduced motion：`prefers-reduced-motion` 三类降级

### 弱项 / 待改
- 🟡 **[中优]** **触摸目标尺寸未明确**——WCAG 2.5.5 Target Size (Enhanced) 要求 44×44px。EXPERIENCE.md 移动端 chrome 紧凑化提到 "上一/下一按钮变图标无 label"，但没声明最小触摸尺寸。建议在 A11y 段补一行 "所有交互目标 ≥ 44×44px (WCAG 2.5.8 minimum target size)"
- 🟡 **[低优]** **Skip link / 跳过导航**未提及——单屏应用主区域之前的 Top Chrome 不长，但屏幕阅读器用户从 Tab 进入 Full Render 时需要先穿过所有 chrome 才到内容，应有 skip link 跳到渲染区
- 🟡 **[低优]** **Color contrast for primary state**：EXPERIENCE.md 引用了 `on-surface vs surface` 的 16:1，但未验证 `primary #735C41` 在 `on-primary #FAF8F3` 上的对比度——这是按钮主色，需要 AA 4.5:1 以上。手动核算 `#735C41` vs `#FAF8F3` 约 6.5:1，**通过 AA**——但 spine 没显式写出，建议在 A11y 段补一句"primary button 主色对比度 6.5:1（通过 AA）"

---

## 8. Done-ness clarity — **ADEQUATE**

### 下游可提取的 acceptance criteria
**Card 组件**——可提取 ✅
- 单击行为 → Full Render 跳转（FR-4 D14 引用）
- pointer-events 禁用（缩略预览区）
- hover 微抬起（视觉规格 ref DESIGN.md）
- 无 hover overlay 按钮（PRD D28 引用）

**Inline Title Editor**——部分可提取 🟡
- 单击进入 inline edit（[ASSUMPTION] Notion 风格）
- Blur 或 Enter 保存
- Esc 撤销
- 失败时 inline 错误提示，编辑态保留
- **缺**：失败时的具体文案？取消按钮？长度超过 200 字符的 inline truncation？

**Dropzone**——可提取 ✅
- 空时间线占主区域
- 有 Entry 时缩成右上"归档"按钮
- 任意位置 drag-and-drop 仍生效
- 文件 drop 触发归档 modal（FR-1）

**Sort Toggle**——可提取 ✅
- 二态切换器
- 切换立即重新排序
- 不持久化（刷新回默认倒序）

### 强项
- 大部分 Component Patterns 行都同时给"行为 + 视觉规格引用 + PRD/FR/D 引用"三件套——dev / qa 可直接基于此写测试用例
- State Patterns 的"治疗 (Treatment)" 列描述足够具体（如 "skeleton 卡片网格 4-6 张占位"）
- Flow 2 失败分支的 3 条具体错误文案——qa 可直接做 E2E case

### 弱项 / 待改
- 🟡 **[中优]** **Empty State 文案模糊**——Component Patterns 写"voice 遵循克制工具表"，Flow 1 没演到 empty state，DESIGN.md 给了示例 "还没有 Entry。" / "从这里开始。"。需要明确 **Empty state 是几行文字 + 是否含 Dropzone 嵌入 + 是否有 secondary 引导**。三处线索散落但未汇总
- 🟡 **[低优]** **More Menu (⋯) 行为完整度**——EXPERIENCE.md 说 "Esc / 点击外部关闭"，但没说 Tab 顺序、菜单项的 keyboard 上下导航（↑↓ Enter）、首项默认 focus 与否
- 🟡 **[低优]** **响应式 breakpoint 与 DESIGN.md 网格列数不完全一致**——DESIGN Layout 段说 `< 640px` 1 列、`640-1024px` 2 列、`1024-1440px` 3 列、`> 1440px` 4 列；EXPERIENCE.md Responsive 段说 `< 768px` 1 列、`768-1024px` 2 列、`1024-1440px` 3 列、`≥ 1440px` 4 列。**两者 breakpoint 差异：640px vs 768px**——这是 spine 内部不一致

---

## 机械性核查（Mechanical Notes）

### Token 引用准确性
- ✅ 所有 `{path.to.token}` 引用都能在 DESIGN.md frontmatter 找到对应定义
- ✅ 无 typo / dangling reference
- 🟡 **[低优]** EXPERIENCE.md `{DESIGN.md}.Brand & Style` 引用使用了 `.` 分隔节标题——这是 markdown 章节而非 token 路径，建议规范化为 `{DESIGN.md}#brand-and-style`（如果 BMAD 约定支持）或保持现状（如果约定无此区分）

### [ASSUMPTION] 标签追踪
EXPERIENCE.md 中标注 4 处：
1. **Foundation**："技术栈倾向 Next.js [ASSUMPTION]"——backed by brief addendum §1.1 ✅
2. **Component Patterns Inline Title Editor**："Notion / Linear 风格"——decision log 提到，但**无替代方案分析**，需 alex finalize 确认 🟡
3. **State Patterns 会话过期**："登录后回到原 URL [ASSUMPTION]"——decision log 提到 ✅
4. **State Patterns 跨设备并发**："手动刷新页面 [ASSUMPTION]"——decision log 提到 + 含 v2 触发条件 ✅
5. **Interaction Primitives 触控特例**："归档按钮触发系统文件选择器 [ASSUMPTION]"——decision log 提到 ✅
6. **Key Flows Flow 1 失败分支**："Toast '网络中断，正在重试……'[ASSUMPTION]"——decision log **未提及** 🟡，这是一个 voice + UX pattern 决策（toast 在 voice 表中未出现，需检查是否与"克制工具"协调）

### 决策日志覆盖
- ✅ DESIGN.md 关键决策（色板、字体、Card、Month Divider、Don't 列表）有记录
- ✅ EXPERIENCE.md 关键决策（IA closure、Voice 表 8 行、键盘策略、移动退化、3 Flows）有记录
- 🟡 **[低优]** 决策日志中 **OQ-8 缩略预览机制** 未明确登记——PRD 倾向方案 a，DESIGN.md Card 段引用此倾向；建议在决策日志补一条 "OQ-8 缩略预览：spine 跟随 PRD 倾向方案 a，但 spine 文本应保持机制抽象"
- 🟡 **[低优]** 决策日志缺一条 "Flow 1 网络中断 Toast" 的 [ASSUMPTION] 来源——这是 EXPERIENCE.md 引入但 PRD 未规定的 UI 决策

### NFR 戏剧化（NFR theater）核查
- ✅ NFR-3 响应感软目标 < 2 秒 / < 1 秒——PRD 已声明"未达成不阻塞上线"，spine 未把这些当成硬性 acceptance，无戏剧化
- ✅ Accessibility floor 段没堆砌"100% AAA / 全面无障碍"等空头承诺，按 WCAG 2.2 AA 明确化
- ✅ 性能 / 可靠性章节按"50 条目以内"明确边界

### Persona 戏剧化（Persona theater）核查
- ✅ 单用户 alex，全程实例化为 alex，未编造"潜在用户群体"/"用户细分"
- ✅ Flow 场景描述具体（"周末晚 9 点"、"macOS Chrome"、"~/Downloads"）——锚定真实情境而非虚构 persona

### "Elegant" 手挥（Hand-waving）核查
- 🟡 **[低优]** DESIGN.md Brand & Style "整体张力——视觉温度 vs voice 克制" 段落是个**漂亮的修辞**，但**没说清楚** alex 进档案库时第一秒看到什么会让他"感受到暖意"——这是 Fast path 的代价（跳过 see-to-decide）。Strong PRD 让 spine 不至于失锚，但视觉张力的"see-to-decide"环节仍是 thin
- 🟡 **[低优]** "Editorial Archive" 命名 + "私人书房 / 旧档案室 / 装帧考究的笔记本" 隐喻——三个隐喻锚点都很"高大上"但未指向具体视觉证据（如"装帧考究的笔记本"指什么字体？什么纸张质感？）。建议 finalize 时让 alex 看视觉草稿（mockups/ 目录）一次校准

---

## Top critical / high findings 汇总

无 critical 项。

**High** 优先级（建议 finalize 处理）：
- 🟡 [HIGH] OQ-8 缩略预览机制：DESIGN.md Card 段写 "iframe sandbox CSS scale"——技术机制不该锁在 spine，建议改为抽象表述
- 🟡 [HIGH] Breakpoint 不一致：DESIGN 640px vs EXPERIENCE 768px——选一边统一

**Medium** 优先级（建议 finalize 处理）：
- 🟡 [MEDIUM] WCAG 2.5.8 触摸目标 ≥ 44×44px 未声明
- 🟡 [MEDIUM] Empty State 文案未明确（散落在三处）
- 🟡 [MEDIUM] Inline Title Editor [ASSUMPTION] 需 alex 一锤定音（Notion 风格 vs edit/view toggle）

**Low** 优先级（finalize 可选）：
- Dropzone 视觉 token 未进 frontmatter `components:`
- Shadow 颜色硬编码 RGB（dark mode 风险）
- body-lg vs body-md 适用场景未明确
- More Menu keyboard ↑↓ 行为未规定
- A11y "skip link" 未提
- Primary button 对比度未显式验证（实际 ~6.5:1 通过 AA）
- Toast "网络中断" [ASSUMPTION] 未进决策日志
- A1 fallback 路径在 Component Patterns 未显式说明
- Brand & Style "暖意 see-to-decide" 缺视觉证据
- 错误文案 lookup 表未汇总

---

## 最终建议

**通过 finalize**——双 spine 强度足以让 architecture / dev 安全推进，无 critical 项。建议在 finalize 阶段：

1. 修复 breakpoint 不一致（640 vs 768）
2. 把 OQ-8 缩略预览机制描述抽象化
3. 显式 alex 确认 Inline Title Editor [ASSUMPTION]（一句话即可）
4. 补 WCAG 2.5.8 触摸目标声明
5. 汇总 Empty State 文案三处线索

其余 low 项均不阻塞 finalize，可在 dev / 实施阶段自然解决。

**Fast path 的代价主要落在**：视觉"see-to-decide"环节稀薄（隐喻锚点未指向具体视觉证据）+ 部分 [ASSUMPTION] 缺替代方案讨论。但因 PRD 强度足够，spine 内部一致性高，**Fast path 在此项目上是合理选择**。
