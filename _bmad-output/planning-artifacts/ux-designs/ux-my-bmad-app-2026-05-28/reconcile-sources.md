# UX Spines · Reconcile Sources

> 输入对账：识别 UPSTREAM（brief + PRD + addendum）→ DOWNSTREAM（DESIGN.md + EXPERIENCE.md）的**承接缺口**。仅列**未承接 / 承接不充分 / 单向新增**的 gap，不重复确认已对齐内容。

**对账输入**：
- `briefs/brief-my-bmad-app-2026-05-28/brief.md`
- `prds/prd-my-bmad-app-2026-05-28/prd.md`
- `prds/prd-my-bmad-app-2026-05-28/addendum.md`

**对账输出**：
- `ux-designs/ux-my-bmad-app-2026-05-28/DESIGN.md`
- `ux-designs/ux-my-bmad-app-2026-05-28/EXPERIENCE.md`

**严谨度校准**：hobby / 单用户。enterprise 类合规、权限矩阵、SLA 条款一律不强求；substance 类（产品本质 / brief 立场 / PRD 硬约束）保留正常严格度。

---

## Section 1 — PRD 承诺被 UX 丢失（FR / NFR / UJ / SM）

### G1-1 · 【critical】NFR-2 资源层"链接外泄即数据外泄"防护未在 UX 端兑现

**Upstream**：PRD §5 NFR-2 第 3 条**资源层**——"原始 .html 文件的存储位置**不应**可通过猜测 / 枚举 URL 直接访问——即使获取了直链也必须重新经过认证。这是为了防止'链接外泄即数据外泄'"。

**Downstream 缺口**：
- EXPERIENCE.md `State Patterns` 仅写 "API 层返回 401" 一条（应用层 + API 层两层），**资源层未单独列**。
- 当 alex 从 Full Render 触发 "下载原 .html"（FR-7），下载 URL 的生命周期、是否签名、是否短时效、是否需重新认证——**EXPERIENCE.md 完全未提**。
- DESIGN.md 不负责行为，但 EXPERIENCE.md 在"未认证访问"状态行下应展开三层而非两层。

**为何重要**：NFR-2 资源层是 brief "数据所有权 + 仅 alex 一人用" 的工程兑现关键点；下游 dev 若仅看 EXPERIENCE.md，可能用一个"长期公开但难猜的 URL" 满足 API 层 401 但**违反**资源层语义。

**建议补强**：
- EXPERIENCE.md `State Patterns` 表 `未认证访问` 行细化为应用层 / API 层 / **资源层（含下载链接）** 三条。
- `Component Patterns` 表的 More Menu 下"下载原 .html"加一条 behavioral rule："下载 URL 必须为认证态下生成的短时效签名 URL，**不得**为可静态分享的长效链接"。

---

### G1-2 · 【high】FR-2 "归档时间戳一旦写入不可修改"未在 UX 端显式兑现

**Upstream**：PRD §4.1 FR-2 末条——"归档时间戳一旦写入即不可修改——这保证时间线的真实性"。

**Downstream 缺口**：
- EXPERIENCE.md `Component Patterns` Upload Preview Form 行写到 "归档时间戳显示为 mono-metadata，**只读**"——这只解决了"上传 modal 看不到编辑"。
- 但 Full Render 顶部 chrome（FR-5 + FR-7 编辑标题）下的"归档时间"显示状态，以及 More Menu 的可编辑动作清单——**未显式声明"归档时间不可编辑"**。
- "可编辑显示标题，不可编辑归档时间"这一关键不对称在 EXPERIENCE.md 的 Inline Title Editor 与 More Menu 行只覆盖了"可改的标题"，**没有显式排除"时间也能改"的误解空间**。

**为何重要**：alex 是单用户，且本 PRD 由 alex 撰写，对自己来说"可不可编辑时间"是个轻判断；但 dev 阶段实现 More Menu 时若没有约束，可能顺手加一个"编辑归档时间"——破坏时间线真实性这一 PRD 硬性后果。

**建议补强**：
- EXPERIENCE.md `Component Patterns` More Menu 行明示"管理动作仅含：编辑标题 / 下载 / 删除——**时间戳与原始文件名永远不可由 alex 修改**"。

---

### G1-3 · 【medium】FR-1 "失败不残留半个 Entry（事务性）"在状态层缺失 telemetry / 中断细节

**Upstream**：PRD §4.1 FR-1 第 5 条——"失败不残留半个 Entry——任一环节失败时档案库状态不被污染（事务性）"。

**Downstream 缺口**：
- EXPERIENCE.md `State Patterns` 归档失败行写"失败不残留半个 Entry（FR-1 事务性）"——一句话承接，**未展开"环节"**。
- "alex 上传到一半关闭浏览器 / 切到其他 tab / 上传到 70% 网络断开"等中断态下，时间线**绝不可出现一条"上传中"的伪 Entry**——这一约束在 Component Patterns + State Patterns 双表均未明示。
- "归档 modal 关闭（点击遮罩 / × / Esc）= 取消归档" 这一行为虽在 Interaction Primitives 表暗示，但 State Patterns 未给出"取消"状态。

**为何重要**：dev 阶段实现归档流程时可能用"乐观插入 + 失败回滚"或"待确认 Entry 暂存表"——前者更脆弱。EXPERIENCE.md 应该明示禁止"乐观插入"模式。

**建议补强**：
- EXPERIENCE.md `State Patterns` 增 `归档取消 / 中断` 行：alex 关闭 modal / 关闭浏览器 / 切 tab → **档案库无变化**；模态再次打开时为全新归档（不恢复上次未确认状态）。

---

### G1-4 · 【medium】UJ-3 "约 10 分钟扫完最近 30 条" 节奏目标未在 UX 端兑现节奏锚点

**Upstream**：PRD §2.2 UJ-3——"alex 想'看看我这半年思维怎么变的'……每条点开扫一眼，**约 10 分钟扫完最近 30 条**"。

**Downstream 缺口**：
- EXPERIENCE.md Flow 3 描述 "每条扫一眼，5-10 秒，按 →"——**承接了节奏**但未承接"扫完即停"的认知节拍。
- 单条 Entry 的 Full Render 进入 < 1 秒（NFR-3 A7）是软目标，但 UJ-3 的节奏严格依赖此速度——EXPERIENCE.md Flow 3 未提此依赖。
- 没有任何 UX 元素帮助 alex"知道自己看到哪了 / 还有几条"——Top Chrome 仅显示当前 Entry 标题，**未含"第 N / 共 M 条"或浏览进度**——这对"扫完 30 条"心智不友好。

**为何重要**：UJ-3 是 brief §问题 + §愿景反复强调的"思维演进回看"——M2 业务里程碑（"50+ 条目时感受到思维演进"）的兑现关键。无浏览进度指示，alex 可能"翻着翻着不知道翻到哪了"。

**建议补强**：
- EXPERIENCE.md `Component Patterns` Top Chrome 行加："中右上一/下一导航旁可显示当前位置指示——例如 `12 / 47`（mono-metadata）"。**或**：在 Inspiration 段标注此为 OQ 留待 M3 retro。
- 显式标注为 `[ASSUMPTION]`（Section 5 也会列）。

---

### G1-5 · 【low】FR-7 下载文件名规则在 UX 端未承接

**Upstream**：PRD §4.4 FR-7 下载条——"文件名以**当前显示标题**为基础（含中文兼容；文件系统非法字符替换为下划线），扩展名 `.html`"。

**Downstream 缺口**：
- EXPERIENCE.md `Component Patterns` More Menu 仅写"下载原 .html" 标签，**未承接文件名生成规则**。
- 移动端 iOS Safari 对中文文件名的下载行为差异未提（可能 silently 失败 / 改名）。

**为何重要**：这是数据所有权承诺的兜底——alex 下载下来发现"文件名乱码 / 全是下划线"会影响心智。

**建议补强**：
- EXPERIENCE.md More Menu 行加 behavioral rule："下载文件名 = 当前显示标题 + `.html`；非法字符 → `_`；中文保留。移动端若浏览器不支持文件名设置，使用 `entry-{id}.html` fallback（[ASSUMPTION]）"。

---

### G1-6 · 【medium】NFR-3 "错误隔离"中"Full Render 失败时其他卡仍可访问"未在 Flow 中演练

**Upstream**：PRD §5 NFR-3 错误隔离——"单条 Entry 损坏 / 渲染失败 / 缩略预览生成失败**不应阻塞**时间线整体——其他 Entry 仍可正常浏览。Full Render 失败时显示错误信息但 alex 仍可通过'返回时间线'导航离开。"

**Downstream 缺口**：
- EXPERIENCE.md `State Patterns` "Full Render 失败" 行写 "Entry 仍在库中，失败不影响归档状态" ——只承接了"归档侧"，**未承接"时间线侧"**——即"Full Render 一条失败不阻塞其他 Entry 的 Full Render"。
- Flow 1/3 未演练失败分支下"换一条继续看"的行为。

**为何重要**：alex 在 UJ-3 顺序回看时若中间一条渲染失败，应该能 `→` 直接跳到下一条而不卡住。

**建议补强**：
- EXPERIENCE.md `State Patterns` Full Render 失败行补："→ / ← 仍可工作——按下后直接加载相邻 Entry，不阻塞 alex 的浏览节奏"。

---

### G1-7 · 【low】SM-1 "30 分钟内重复访问算同一次"埋点要求未在 UX 端承接

**Upstream**：PRD §8.1 SM-1 计量方法——"服务端记录 alex 进入时间线 / Full Render 的次数，30 分钟内重复访问算同一次"。

**Downstream 缺口**：
- EXPERIENCE.md 未提及任何 telemetry / 埋点行为。

**为何重要**：SM-1 是 M3 业务里程碑的核心 Primary 指标；若 UX 不明示"应用应在哪里埋点"，dev 阶段可能漏埋。**但**：这本质上是 architecture / dev 阶段的承接职责，UX spine 可不承接。

**建议补强**：
- 可选——EXPERIENCE.md 末段加 `[NOTE FOR ARCHITECT]`："SM-1 计量要求服务端记录 alex 访问，UX 侧不感知"（澄清责任边界）。**或不做**——视 UX finalize 风格。

---

## Section 2 — Brief 定性气味（vibe / 情绪）被 UX 丢失

### G2-1 · 【high】Brief "已发生过实际丢失"的焦虑情绪未在 UX voice 中显式回应

**Upstream**：
- Brief §概要："已发生过'想回看却找不到'的实际损失"
- Brief §问题 §2："遗忘 + 实际丢失 — 时间一长记不起来'曾经做过什么'，且**已发生**找不到的事实"
- PRD §2.1 emotional JTBD："消除'我做过但找不到了'的焦虑——已经发生过的实际丢失不再重演"

**Downstream 缺口**：
- DESIGN.md `Brand & Style` 提到"sandboxing"、"档案馆质感"、"克制 voice"等，**未触及"对抗丢失焦虑"这一情绪 anchor**。
- EXPERIENCE.md `Voice and Tone` 表展示了"克制 vs 煽情"对照，但**没有任何一条针对"alex 看到自己旧产物时的安心感"**的微文案设计——比如时间线为空时的引导文案、归档成功时的回执文案。
- 归档成功后 alex 看到 Full Render 的瞬间——PRD §4.1 描述段说这是"'这个文件已经被档案库正确接住'"的体感兑现——EXPERIENCE.md Flow 2 步骤 5 借用了"档案库正确接住了"的表述，**但 microcopy 表里"已归档。"这种克制收束**反而进一步抑制了"接住"感。

**为何重要**：brief 反复强调的核心情绪是"丢失焦虑 → 安心"——"克制 voice" 是正确的方向，但"克制"不等于"中性 / 平铺"。私人书房氛围的回执文案可以**克制且有重量**（例："已归档于 {date}。" 比 "已归档。" 多一层"被档案馆登记入册"的语义）。

**建议补强**：
- EXPERIENCE.md `Voice and Tone` 加 "对抗丢失焦虑"的微文案行——例如：
  - 归档成功 Toast / inline confirmation：`"已归档于 {date}。"`（强化"被登记入册"语义）
  - 时间线 0 Entry 空状态：现行 "还没有 Entry。 / 从这里开始。" 可保留，但可考虑承接 brief "实际损失" 立场——例 `"档案库还是空的。从这里开始，再也不会丢。"`（**或**保持当前克制，但在 Voice and Tone 章节显式标注"voice 选择不延伸至情绪宽慰"——使丢弃成为有意识决策而非疏忽）。
- DESIGN.md `Brand & Style` 中"私人书店"隐喻段可补一句——"档案馆质感的另一面是 alex 不再丢东西的安全感"——这是视觉 + voice 共同要承接的情绪基底。

---

### G2-2 · 【high】Brief "画廊式翻看" 体感隐喻在 EXPERIENCE.md 仅作为 Card 命名承接，未落到交互节奏

**Upstream**：Brief §问题 §3："Finder 双击预览体验破碎，不支持'**画廊式翻看**'"。
PRD §4.2 描述段也明确承接："承接 brief §问题中 '画廊式翻看' 体感隐喻——把每份 .html 当成视觉作品逐一翻阅，可漫游、可驻足、可翻页"。

**Downstream 承接情况**：
- DESIGN.md `Brand & Style`"隐喻锚点"段引用了"画廊式翻看"——**视觉层承接到位**。
- EXPERIENCE.md `Inspiration` 段 "Lifted from Are.na" 承接了卡片网格密度。

**Downstream 缺口**：
- "画廊式翻看"的核心动作是**翻看**（页/作品级），但 EXPERIENCE.md `Interaction Primitives` 中卡片只有"单击进 Full Render"——**没有"在时间线上轻量预览 / 翻看而不全屏渲染"的中间态**。
- PRD §4.2 Out of Scope 明确"卡片 hover 预览 / 右键菜单 / 长按操作"V1 不做、单一交互——所以 EXPERIENCE.md 当前承接是**忠于 PRD**的。
- 但 PRD §4.2 描述段说"可漫游、可驻足、可翻页"——**漫游 / 驻足**这两个动词没有任何 UX 兑现物。**漫游**可对应"无障碍滚动"+"足够大的卡片密度"+"缩略预览质量"；**驻足**可对应"卡片 hover 时的视觉反馈"——EXPERIENCE.md Component Patterns 提到 hover 微抬起，但**未把它与"驻足"画廊体感关联**。

**为何重要**：brief / PRD 把"画廊式翻看"作为对 Finder 双击预览的差异化核心——若 UX 仅承接成"网格 + 单击进全屏"，丢掉了 brief 想要的"在网格里慢慢翻"的氛围。

**建议补强**：
- EXPERIENCE.md `Component Patterns` Card 行的 "hover 微抬起" 旁加一句——"hover 抬起是'驻足画廊'体感的视觉承接（brief §问题 + PRD §4.2 描述段）"。
- `Inspiration` 段 "Lifted from Are.na" 之后加 "Lifted from 实体画廊 / 旧书店"——明示"漫游 / 驻足 / 翻页"心智 anchor。

---

### G2-3 · 【medium】Brief "提升思维逻辑" 这一核心动机未在 UX voice 中显式承接

**Upstream**：
- Brief §概要："让 alex 已经在做且确认能'**提升思维逻辑**'的'回看自己旧产物'这个行为变得可持续"
- Brief §用户："已经有定期回看旧产物的习惯，且明确感到这件事'对思维逻辑是一种提升'"
- PRD §1 愿景反复引用此立场

**Downstream 缺口**：
- DESIGN.md / EXPERIENCE.md 全文**无一处使用"思维逻辑"或"提升思维"** 措辞。
- 月份分隔条被 PRD §4.2 + DESIGN.md `Components.Month Divider` 都标注为"思维演进"视觉锚点——但 EXPERIENCE.md 的相关 microcopy（屏幕阅读器宣告等）只承接了"N 份 Entry"，**未承接"思维演进"语义**。
- M2 业务里程碑（50+ 条目）的兑现关键是"从月份分隔条 + 缩略预览能感受到思维变化"——但 EXPERIENCE.md 在 Flow 3 步骤 7 ("看见自己最近的产出风格——和 1 月对比，对自己思维状态有了新的判断") 仅一笔带过。

**为何重要**：这是 brief 最核心的产品动机之一——既然 voice 选择"克制不煽情"，"思维提升"立场也不必出现在微文案中；但 UX spine 应该在某处显式声明"该立场是月份分隔条 / 缩略预览 / 顺序导航这些 surface 设计的语义基础"——避免下游 dev 把月份分隔条理解成纯"视觉分组"而忽视其"思维演进锚点"语义。

**建议补强**：
- EXPERIENCE.md `Component Patterns` Month Divider 行的 "仅作为视觉与语义节奏标记" 后补充——"语义角色：承接 brief 'thinking evolves' 立场，是 alex 感受思维演进的视觉锚点（PRD §1 + §4.2）"。
- 或——`Foundation` 段在 "沙箱化是产品 DNA" 之后加一条 "'思维演进可视化'是产品 thesis"——月份分隔条 + 缩略预览 + 顺序导航是其 surface 兑现物。

---

### G2-4 · 【low】Brief §愿景 "5 年视角" 长期叙事未在 UX 端承接长尺度浏览体感

**Upstream**：Brief §愿景 "5 年视角：MindPrint 沉淀了 alex 多年的 HTML 思维产物，从中能直观回看自己每一阶段的思维变化"。

**Downstream 缺口**：
- A4 假设 "5 年 N 百条 Entry 元数据浏览器单次加载内无性能问题" — 但 EXPERIENCE.md `Responsive & Platform` 没有针对"年度回看 / 跨多年浏览"的设计——例如"按年份折叠 / 跳到某年初" 等长尺度导航工具。
- 这是 V1 Out of Scope 还是 UX spine 应该埋点的可扩展位？

**为何重要**：低优先级——V1 50 条目以内月份分隔已足够。但 EXPERIENCE.md `Inspiration & Anti-patterns` 段可明示"V1 浏览尺度上限为 1-2 年"——避免下游误用月份分隔到 5 年时密度爆炸。

**建议补强**：
- EXPERIENCE.md `Responsive & Platform` 后或 `Inspiration` 段加 `[NOTE FOR UX]`："V1 浏览尺度按 1-2 年范围设计（参 A4 / brief §愿景）；超过此尺度的长跨度浏览（如 3 年以上 / 跨年快速跳转）是 v2 议题"。

---

## Section 3 — PRD addendum §2 信号未被 UX 端承接

### G3-1 · 【medium】Addendum §2.2 "数据所有权 vs 无自有服务器" 张力未在 UX 端承接

**Upstream**：Addendum §2.2 ——
- "Supabase Storage / R2 / Vercel Blob 上的数据是不是真的算 'alex 自己掌控'？"
- "把对象存储放到 alex 自己的 S3 / R2 桶……vs 直接用 Supabase Storage（集成简单但迁出门槛更高）"

**Downstream 承接情况**：
- PRD §6.2 + OQ-7 已转化为"全量导出 V1 不做"——架构阶段决策。

**Downstream 缺口**：
- UX 端**没有任何承接"数据可迁出"的 affordance**——FR-7 单条下载已承接但局限于单条。
- "alex 想验证自己的数据真的在自己掌控的位置" 这一信任感建立动作——UX 端没有任何 surface 触及（例如 Settings 页显示"数据存储位置: {provider}, 桶: {bucket}"）。

**为何重要**：addendum §2.2 是 brief "数据所有权"承诺的工程兑现张力——hobby 项目可以接受不在 V1 解决，但 UX spine 应该至少承认这一张力的存在（例如标注 "V1 UX 不解决数据可见性，留待 OQ-7 / M3 retro 评估"）。

**建议补强**：
- EXPERIENCE.md `Information Architecture` 表的下方"关键约定"里"无 Settings 页"那一条加备注——"承接 addendum §2.2 张力：V1 不暴露数据存储位置 UI；alex 通过 FR-7 单条下载部分兑现数据所有权（OQ-7 全量导出未做）"。

---

### G3-2 · 【low】Addendum §2.3 认证机制候选未在 UX 端预留承接面

**Upstream**：Addendum §2.3 候选——magic link / 单一长密码 / passkey / IP 白名单 + 共享密码。

**Downstream 承接情况**：
- EXPERIENCE.md `Component Patterns` Auth Screen 行写 "机制由架构决定"——承接到位。

**Downstream 缺口**：
- 不同机制的 UX 影响差异巨大：
  - **magic link**：需要 "邮箱输入框 + 等邮件 + 邮件内点击" UX 流——含一个**离开 MindPrint 应用 → 回到应用** 的跨 surface 跳转。
  - **单一长密码 / passkey**：单 surface 内完成，无跨 surface。
  - **IP 白名单**：可能"无登录界面"——直接进时间线（若 IP 通过）。
- EXPERIENCE.md 仅画了"极简: wordmark + 单一登录入口"——**未列任何一种机制下的具体 surface 状态**（特别是 magic link 的"邮件已发送，请在邮箱中打开" 中间态）。

**为何重要**：架构阶段选了某机制后，UX spine 应能直接给出"该机制下的 Auth Screen 状态机"。当前 spine 在这一点上**过于压缩**，dev 阶段可能需要回到 UX 阶段补状态机。

**建议补强**：
- EXPERIENCE.md `State Patterns` 表加 `Auth - 等待中间步骤`（[ASSUMPTION] 若架构选 magic link）行——"邮件已发送，等待 alex 在邮箱中点击 link"——或显式说明 "等架构定" 与"UX 不预承接"。

---

### G3-3 · 【medium】Addendum §2.4 OQ-8 "静默降级触发 PM 回顾"承接不充分

**Upstream**：
- PRD §4.2 FR-4 (c) 条："生成失败时 fallback 到 '显示标题 + 归档时间' 占位卡片，**不得静默降级到纯文本摘要**——若架构阶段评估倾向方案变更（如方案 a 性能不足、需降级到方案 c 文本摘要），**必须触发 PM 回顾**"
- A5 末："**任何静默降级（如方案 a 失败转方案 c 文本摘要）需触发 PM 回顾**"

**Downstream 承接情况**：
- EXPERIENCE.md `State Patterns` "缩略预览生成失败" 行写 "**不静默降级到文本摘要**——FR-4 静默降级禁止条" ——**承接到位**。

**Downstream 缺口**：
- "触发 PM 回顾" 这一**流程性约束**仅是 PRD 给架构 / dev 阶段的话；UX spine 不必承接。**这条不算 gap**——但下方流程性细节可补：
- DESIGN.md `Components.Card` 写"缩略预览区: iframe sandbox (PRD §10 OQ-8 倾向方案 a)，CSS scale 缩放"——若架构阶段实际**选了**方案 b（服务端截图），DESIGN.md 此处描述就失效。

**为何重要**：DESIGN.md 当前**绑定到了方案 a 的实现细节**——这违反 PRD §10 A5 "机制不锁，由架构阶段决定"。

**建议补强**：
- DESIGN.md `Components.Card` 删掉 "iframe sandbox (PRD §10 OQ-8 倾向方案 a)，CSS scale 缩放，pointer-events 禁用" 这种**实现细节绑定**——改为 "缩略预览区: 沙箱化容器渲染原 HTML 视觉摘要（机制见 PRD §10 OQ-8 + addendum §2.4）；预览态 pointer-events 禁用（卡片整体点击进 Full Render）"。

---

### G3-4 · 【low】Addendum §2.5 "外链资源完整性"未在 UX failure mode 演练

**Upstream**：Addendum §2.5 + OQ-4——"上传时 HTML 外链 CDN / 图床离线后样式塌"。

**Downstream 承接情况**：
- EXPERIENCE.md `State Patterns` `Full Render 失败` 行覆盖了"渲染失败"。

**Downstream 缺口**：
- "**部分失败**——HTML 渲染完成但图片 / 字体加载失败"——这不是 "渲染失败" 的语义，而是 "渲染降级"。EXPERIENCE.md 无对应状态。

**为何重要**：alex 看着一份 Entry 发现图片都裂了，是该联系开发 / 还是接受？UX spine 应说明 "**视觉降级不被识别为失败**——alex 看到的就是 HTML 当下的渲染结果，外链不可用是 'as-is' 现状"。

**建议补强**：
- EXPERIENCE.md `State Patterns` 加 `Full Render 部分降级（外链失效）` 行："Entry 完整渲染但外链资源（图片 / 字体 / 第三方脚本）加载失败 → MindPrint **不识别**为错误，alex 看到的是 HTML 当下的真实状态（参 addendum §2.5 + OQ-4）"。

---

## Section 4 — PRD A1-A7 / OQ 未承接的 UX 影响

### G4-1 · 【medium】A6 "30 天会话期"在 EXPERIENCE.md 仅承接到 Foundation，未承接 "会话过期" 的体感

**Upstream**：
- A6："认证会话默认有效期 30 天，alex 不必每次访问都重新登录"
- PRD §4.4 FR-6："认证成功后 alex 在合理时长内保持会话"

**Downstream 承接情况**：
- EXPERIENCE.md `State Patterns` "会话过期" 行写 "重定向至登录 + 登录后回到原 URL [ASSUMPTION]"——承接到位。

**Downstream 缺口**：
- 30 天到期的**时机**：到期当下 alex 是"突然被踢出 + 看到登录页"还是"会话即将过期可续期"？UX 未说明。
- 若 alex 在 Full Render 中渲染了 5 分钟 + 30 天会话刚好到——这一刻 alex 该看到什么？

**为何重要**：单用户 hobby 项目，alex 自己能容忍突然踢出；但 EXPERIENCE.md 应明示 "V1 不做'即将过期提示'——突然踢出可接受"——避免下游 dev 误加复杂续期机制。

**建议补强**：
- EXPERIENCE.md `State Patterns` 会话过期行补："V1 不做'即将过期'提示——30 天到达后下次请求时重定向登录 + 登录后回到原 URL（[ASSUMPTION]）"。

---

### G4-2 · 【low】A2 "10MB 上限" 在 EXPERIENCE.md 仅一笔带过，未承接 alex 的预判

**Upstream**：A2 "单文件大小上限 10MB"，PRD §4.1 FR-1 "超限拒绝并提示"。

**Downstream 承接情况**：
- EXPERIENCE.md Flow 2 失败分支提到"文件 > 10MB → modal 不弹出，dropzone 红色 inline 提示 '文件超过 10MB 上限。请减小后重试。'"——承接到位。

**Downstream 缺口**：
- alex 在拖拽前不知道某份 HTML 多大——10MB 上限对 alex 的认知没建立。Dropzone 空状态的引导文案可声明此上限（例 "拖拽 .html 至此（最大 10MB）"）——但 DESIGN.md / EXPERIENCE.md 均未承接。

**为何重要**：低优先级——alex 自己撰写 PRD，知道这条约束。但若忘了，被拒绝时才知道——这是低质量体验。

**建议补强**：
- EXPERIENCE.md `Component Patterns` Dropzone 行 microcopy 例："拖拽 .html 至此（≤ 10MB）/ 或点击选择"。

---

### G4-3 · 【medium】OQ-1 产品名称待定 — UX 阶段应触发 OQ-1 结束但未承接

**Upstream**：OQ-1 "产品名称最终确认 — UX 阶段或上线前必须定，否则品牌资产无法沉淀"。

**Downstream 承接情况**：
- DESIGN.md / EXPERIENCE.md 全程使用 "MindPrint" —— 隐式承接 "用 MindPrint 作为最终名"。
- 但**没有任何位置显式声明"产品名已锁定为 MindPrint"**，也没有承接 OQ-1 触发条件 "UX 阶段必须定"。

**为何重要**：OQ-1 是 PRD 内最高优先级的产品决策之一；UX 阶段是它的最迟兑现期。**当前 UX spine 实际上做了决策但未声明**——这违反 BMAD 决策可追溯原则。

**建议补强**：
- DESIGN.md frontmatter 或 `Brand & Style` 段加一句："**OQ-1 在此 spine finalize 时关闭**——产品名最终定为 MindPrint。"
- 或——EXPERIENCE.md `Foundation` 段补一行同样的声明。

---

### G4-4 · 【low】A1 "标题 fallback 到原始文件名（去扩展名）" 在 UX 端未演练空标题边界

**Upstream**：A1 "若无 `<title>` 或抽取结果为空白，fallback 为原始文件名（去扩展名）"。

**Downstream 缺口**：
- EXPERIENCE.md `Component Patterns` Upload Preview Form 行写"标题编辑框预填自动抽取值（FR-2 A1）"——**未演练 fallback 路径下 alex 看到的预填值是什么**。
- 极端 case：原始文件名也是中文 / 含 emoji / 含 `_` / 含数字时空（如 `index-2 (1).html`）——alex 看到的预填值是 `index-2 (1)` 还是 `index-2 1`？

**为何重要**：低 — alex 自己手动编辑即可。但 dev 阶段可能漏掉空白 fallback 路径。

**建议补强**：
- EXPERIENCE.md Upload Preview Form 行加："`<title>` 缺失 / 抽取结果空白时预填值 = 原始文件名去扩展名（保留括号 / 空格 / 中文等字符，不做 sanitization）"。

---

## Section 5 — UX 端单向新增（应标 [ASSUMPTION] 但未标）

### G5-1 · 【high】"Inline Title Editor — 单击标题进入 inline edit (Notion / Linear 风格)"

**Status**：EXPERIENCE.md `Component Patterns` Inline Title Editor 行**已标 [ASSUMPTION]**——✅ 标注到位。

但 PRD §4.4 FR-7 "编辑显示标题" 仅说 "alex 可在 Full Render 视图触发对当前 Entry 的显示标题编辑"——**触发方式未指定**。UX 端选择"单击标题"是合理但**非唯一**承接——例如更稳妥的"More Menu → 编辑标题 → 弹出 modal"也满足 FR-7。

**为何重要**：当前 [ASSUMPTION] 标注已经合规；**此条不是 gap，仅记录确认**。

---

### G5-2 · 【medium】"Top Chrome 上一/下一 Entry 导航按钮"——视觉位置 / 是否有 keyboard hint

**Upstream**：PRD §4.3 FR-5 "提供 '上一条 / 下一条 Entry' 导航；方向跟随时间线当前的排序方向"。

**Downstream 新增**：
- DESIGN.md `Components.Top Chrome` 段 "中右：⟨ ⟩ 上一条 / 下一条 Entry 导航"——⟨ ⟩ 这一具体图标选择是 UX 新增，PRD 未指定。✅ 可接受。
- EXPERIENCE.md `Interaction Primitives` 键盘表 "← / → → 上一/下一 Entry (仅 Full Render)"——PRD 未指定快捷键。✅ 应标 [ASSUMPTION]，**当前未标**。

**为何重要**：键盘快捷键是 UX 阶段的合理新增，但应显式标注以便 BMAD retro 追溯。

**建议补强**：
- EXPERIENCE.md `Interaction Primitives` 键盘表上方加："[ASSUMPTION] ←/→ 用于 Full Render 内的相邻 Entry 导航——PRD §4.3 FR-5 未指定快捷键；这是 UX 阶段从 UJ-3 '顺序回看' 推导的承接"。

---

### G5-3 · 【medium】"Auth Screen 极简: wordmark + 单一登录入口"——视觉设计 vs PRD 不指定的边界

**Upstream**：PRD §4.4 FR-6 仅约束行为（"任何未认证请求被拒 + 引导至登录入口"），**未约束登录入口的视觉形态**。

**Downstream 新增**：
- EXPERIENCE.md `Component Patterns` Auth Screen 行 "极简：MindPrint wordmark + 单一登录入口"——UX 新增。
- DESIGN.md 无单独的 Auth Screen 视觉规格——隐式承接到全局 token。

**为何重要**：合理新增；但应标 [ASSUMPTION]——PRD 没说"极简"，UX 选择"极简"是承接 brief "克制 voice" 的 inference。

**建议补强**：
- EXPERIENCE.md Auth Screen 行加 "[ASSUMPTION]" 标记。

---

### G5-4 · 【low】"Cold load — 4-6 张 skeleton 占位卡片"——具体数字非 PRD 指定

**Status**：PRD 无 skeleton 数量约束；UX 选 4-6 是合理新增。建议加 [ASSUMPTION] 但优先级低。

---

### G5-5 · 【medium】Responsive 表中"breakpoint" 划分 1440 / 1024 / 768——具体数字非 PRD 指定

**Upstream**：PRD §5 NFR-3 "支持当前主流桌面浏览器 + 主流移动浏览器"——**未指定 breakpoint**。

**Downstream 新增**：
- EXPERIENCE.md `Responsive & Platform` 表 1440/1024/768/<768 四段。
- DESIGN.md `Layout & Spacing` 段 `< 640px` / `640-1024px` / `1024-1440px` / `> 1440px`——**与 EXPERIENCE.md 不一致**（640 vs 768 是同一边界还是不同？）。

**为何重要**：
- (a) DESIGN.md 与 EXPERIENCE.md **breakpoint 数字不一致**——critical 内部一致性 bug。DESIGN.md 写 640，EXPERIENCE.md 写 768。
- (b) UX 选择具体数字是合理新增，但应在某一处标 [ASSUMPTION] 并确保两份 spine 一致。

**建议补强**：
- **必修**：统一 DESIGN.md 和 EXPERIENCE.md 的 breakpoint 数字。建议同时改为 `640 / 1024 / 1440` 或 `768 / 1024 / 1440`——保持业内主流即可（Tailwind 默认 `sm:640 md:768 lg:1024 xl:1280 2xl:1536`）。
- 在 DESIGN.md `Layout & Spacing` 或 EXPERIENCE.md `Responsive & Platform` 一处标 [ASSUMPTION]："breakpoint 数字 = Tailwind 主流划分；PRD 未指定，UX 阶段引入"。

---

### G5-6 · 【medium】"暗色模式跟随系统切换" 是 UX 完全新增

**Upstream**：PRD / brief / addendum **均未提及暗色模式**。

**Downstream 新增**：
- DESIGN.md frontmatter 完整定义 `dark-*` tokens。
- DESIGN.md `Colors` 段段 末 "暗色模式：tokens 完整定义……跟随系统切换"。
- EXPERIENCE.md `Information Architecture` 的"无 Settings 页"备注里写 "V1 仅必要的'跟随系统暗色'，无切换器"——✅ 这里隐式声明了它是 UX 新增。

**为何重要**：
- 工作量上 — 加暗色模式让 V1 复杂度 ↑ 约 20-30%（需 token 对称、组件双态测试、用户偏好检测）。
- 这是**重大 UX 单向决策**——hobby 项目是否真的需要 V1 就上暗色模式？brief / PRD 均无信号说 alex 有夜读需求。
- 不一定要砍——但应该让 alex 在 finalize 时显式确认这条 [ASSUMPTION]。

**建议补强**：
- DESIGN.md `Colors` 段 "暗色模式" 句首加：**"[ASSUMPTION] V1 含暗色模式（PRD / brief 未明示）——UX 阶段判断衬线 + 暖白主题在夜读场景下对比度过强，引入暗色对称 token；若 alex 评估为复杂度过重，可砍至 v2"**。

---

### G5-7 · 【medium】Voice and Tone 表中 9 条对照——具体 microcopy 是 UX 新增

**Upstream**：brief / PRD 未指定任何具体 microcopy 文案。

**Downstream 新增**：
- EXPERIENCE.md `Voice and Tone` 表全部 9 条对照。

**为何重要**：合理 UX 阶段产物，但应该明示这些是 UX 新增。

**建议补强**：
- EXPERIENCE.md `Voice and Tone` 段首加："[ASSUMPTION] 本表 microcopy 由 UX 阶段提案，承接 brief '克制工具' 立场；finalize 时 alex 显式确认每条措辞"。

---

### G5-8 · 【low】"More Menu (⋯)" 的图标选择 `⋯`

**Status**：合理 UX 新增，不需要 [ASSUMPTION]——这种细节属于 UX 自由度。

---

### G5-9 · 【medium】"Inline edit 模式 — Blur 或 Enter 保存，Esc 撤销"——保存语义边界

**Upstream**：PRD §4.4 FR-7 "编辑后**立即生效**——时间线卡片与 Full Render 顶部 chrome 同步反映新标题" — **未指定 trigger（Enter / Blur / 显式保存按钮）**。

**Downstream 新增**：
- EXPERIENCE.md `Component Patterns` Inline Title Editor 行 "Blur 或 Enter 保存，Esc 撤销"。

**风险**：Blur 保存是 Notion 风格；但 alex 编辑中误点击页面其他位置可能意外保存——是 alex 想要的吗？

**为何重要**：
- "立即生效" 在 PRD 里强调，但**没说"误点击页面其他位置 = 保存"是预期行为**。
- alex 可能在 Inline edit 中切到其他 tab 看 ref 文档，回来发现标题已被保存为半成品。

**建议补强**：
- EXPERIENCE.md Inline Title Editor 行加 [ASSUMPTION] 并讨论 fallback——"Blur 保存为 Notion 风格 [ASSUMPTION]；若实际使用中 alex 频繁因误操作产生半成品标题，可改为显式 ✓ 按钮（M3 retro 议题）"。

---

### G5-10 · 【high】"网格列数：< 640px 1 列、640-1024 2 列、1024-1440 3 列、> 1440 4 列"——超 4 列的禁止

**Upstream**：PRD §4.2 FR-4 "响应式多列布局，宽屏多列、窄屏少列"——**未指定具体列数 / 不指定上限**。

**Downstream 新增**：
- DESIGN.md `Layout & Spacing` "最大不超过 4 列——再多会丢失卡片个体的存在感"——**UX 端硬性约束**。

**为何重要**：
- (a) PRD 没说"上限 4 列"——UX 端给出此硬性约束是合理 inference，但应标 [ASSUMPTION]。
- (b) 如果 alex 用 27" 显示器看时间线 +50 条 Entry——4 列 vs 6 列对"年度感受"的影响可能很大；此 UX 决策**与 brief §愿景 5 年视角的密度感受**直接相关。

**建议补强**：
- DESIGN.md `Layout & Spacing` 加 "[ASSUMPTION] 最大 4 列基于'卡片个体存在感' inference；PRD 未指定上限"。

---

## 总结

### 严重程度分布

| 严重程度 | 数量 | 项 |
|---|---|---|
| critical | 1 | G1-1 |
| high | 4 | G2-1, G2-2, G5-1（已标）, G5-10, G1-2 |
| medium | 12 | G1-3, G1-4, G1-6, G2-3, G3-1, G3-3, G4-1, G4-3, G5-2, G5-3, G5-5, G5-6, G5-7, G5-9 |
| low | 7 | G1-5, G1-7, G2-4, G3-2, G3-4, G4-2, G4-4, G5-4, G5-8 |

（注：G5-1 已经在 EXPERIENCE.md 中标注 [ASSUMPTION]，非 gap；归入 high 仅说明它是值得 alex 在 finalize 时再次确认的关键 UX 单向决策。）

### 关键修复优先级（finalize 必修）

1. **【critical · 必修】G1-1**：NFR-2 资源层（下载 URL 签名 / 短时效）UX 端兑现。
2. **【critical · 必修】G5-5**：DESIGN.md 与 EXPERIENCE.md breakpoint 数字不一致——**内部不一致是 spine 致命缺陷**。
3. **【high · 强烈建议修】G2-1**：voice / 微文案对 brief 核心情绪（"丢失焦虑 → 安心"）的承接显式化。
4. **【high · 强烈建议修】G5-6**：暗色模式作为 V1 单向新增决策——明示 [ASSUMPTION] 让 alex 决定是否砍。
5. **【high · 强烈建议修】G5-10**：4 列上限硬约束加 [ASSUMPTION]。
6. **【high · 建议修】G1-2**：归档时间戳不可编辑在 More Menu / Inline Title Editor 行显式承接。

### finalize 阶段建议处理顺序

- **必修**（critical）：G1-1 + G5-5
- **强烈建议修**（high）：G1-2, G2-1, G2-2, G5-6, G5-10
- **可选补充**（medium / low）：其余项视 finalize 时长决定是否一并处理

---

*以上 gap 全部基于 hobby / 单用户校准——若是商业产品，G1-1 / NFR-2 资源层应升级到 P0，G3-2 认证机制候选承接应升级到 high。*
