## Document Summary

- **Purpose:** PRD,服务 alex(PM 自审)+ BMAD 下游(UX / 架构 / Epic / Dev)
- **Audience:** alex(PM + 唯一用户 + builder)+ 下游 BMAD workflows
- **Reader type:** humans(BMAD 下游 LLM 也会读,但 PRD 写给 alex 优先)
- **Structure model:** Strategic/Context (Pyramid)
- **Current length:** ~35,400 字符 / ~452 行 / ~2,275 词。目标长度约 2 页(hobby 项目)。**显著超出目标(估算 3-4x)**
- **Style guide:** BMAD PRD 范式 + Strategic/Context Pyramid + 下游可承接性优先

---

## Recommendations

> *按"对 word count 削减 + 对下游可承接性影响"双维度排序。所有建议遵守 CONTENT IS SACROSANCT——仅触动"如何表达",不动"说了什么"。Downstream-load-bearing 项(FR consequences、Glossary、ID continuity、Assumptions Index、cross-reference)显式 PRESERVE。*

### 1. CONDENSE — §4 各 FR 的"描述"段落 prose 化叙述

**Rationale:** 每个 §4.x Feature 开头的"描述"段落含义重要,但当前以叙事 prose 展开("alex 通过把外部 .html 文件**纳入 MindPrint 管理**这一动作产生 Entry。归档动作包含三个连贯环节——上传 → 元数据捕获与确认 → 进入档案库..."),很多内容在下文 FR 的"测试性后果"中已具体化。可压缩到 1-2 句锚定 FR 与 UJ 即可,叙事 prose 删掉。**§4.2 时间线**的描述段落尤其长(含"画廊式翻看"隐喻段、"§1 thesis 边界说明"侧栏、UJ realizes 标注),完全可压成 2-3 句。

**Impact:** ~600-800 字符(主要在 §4.1、§4.2、§4.3、§4.4 各开头共约 4 段)

**Comprehension note:** thesis 隐喻("画廊式翻看")已在 brief 中表达,PRD 仅需引用,不需复述。

---

### 2. CONDENSE — §4.2 FR-4 "卡片内容"嵌套子项 + 缩略预览 (a)(b)(c) 可验收条件

**Rationale:** FR-4 的"卡片内容"使用了三层嵌套(`-` → `-` → `-` (a)(b)(c)),其中:
- "**显示标题**(主,多行截断)"、"归档时间(次,相对格式...)"可合并为单条
- 缩略预览的 (a)(b)(c) 三条可验收条件 + "fallback 占位 + 必须触发 PM 回顾"约束,可压缩到 1 条加 1 个"静默降级禁止"约束(脚注/引用 OQ-8)
- "缩略预览的沙箱化"独立子项与 NFR-1 重复——只需说"同 §4.3 共享 NFR-1"即可,无需展开

**Impact:** ~400-500 字符

**Comprehension note:** (a)(b)(c) 可验收条件是 downstream-load-bearing(QA 阶段会用),保留语义但可大幅紧凑化。

---

### 3. CUT — §0 "rigor 范围"段 + §4 顶部 Notes 折语

**Rationale:** §0 中的"rigor 范围:本 PRD 按 *hobby / 个人项目* 校准,目标长度约 2 页..."属于元层 self-commentary,文档自己说"我是 hobby 校准"对下游无用——UX/架构会自己读到 §6 / §8 的非目标定义和 SM 反向指标推断校准强度。同理 §4.1 末尾"*(§4.1 范围内未解决的开放问题已统一收入 §9 Open Questions)*"等"meta-talk"可全数删除——OQ 章节自己承担说明职责。

**Impact:** ~200-300 字符

**Comprehension note:** 删除后下游不会迷失——结构本身已暗示这些。

---

### 4. CONDENSE — §8.1 SM 描述的"计量方法"段

**Rationale:** SM-1 ~ SM-6 每条都含"计量方法:..."独立行,大多重复"alex 自我估算/自我评估"。SM-2 / SM-3 / SM-6 三条的计量方法都是 alex 主观自评,可合并到一句通用说明("除 SM-1 外,所有 SM 为 alex 自评");SM-1 的"30 分钟内重复访问算同一次"是 downstream-load-bearing,保留。SM-4 / SM-5 的计量方法也可简化。

**Impact:** ~250-350 字符

**Comprehension note:** "计量方法"作为 PRESERVE 候选先考虑——但当前文字明显冗余,精简后并不损失。

---

### 5. CUT — §6.2 各条的"关联 OQ-X"标注 + §9 各 OQ 的"关联"行

**Rationale:** §6.2 "V1 暂不做"每条末尾的"(**关联 OQ-X**)"标注,与 §9 OQ 中的"关联:§6.2"形成双向冗余引用。**保留一个方向即可**——建议仅在 §9 OQ 中标注"关联 §6.2 第 X 条",删除 §6.2 中的反向标注。同时 §9 OQ 内部多条的"关联"行(如 OQ-1 "§3 Glossary"、OQ-3 "FR-1 `[NOTE FOR PM]`")已在 OQ 描述正文中自然提到,可删除显式标注行。

**Impact:** ~300-400 字符

**Comprehension note:** ID continuity 仍然完整——单向引用不破坏可追溯性。

---

### 6. CONDENSE — §1 愿景的第二、三段(thesis 复述 + 五年视角)

**Rationale:** §1 共三段:
- 段 1 直接破题(MindPrint = 个人 HTML 思维档案库)——保留
- 段 2 是 brief 中"问题陈述"和"价值"的复述("回看自己旧产物已经是日常行为...被文件散落侵蚀...已经发生过实际丢失...MindPrint 让这件已经在做的事变得可持续。它同时承担...第一个真实项目"),整段属于 brief 已固化内容的复述。可压成 1 句"承接 brief §问题 / §价值 / §差异化(builder 视角)"
- 段 3"五年视角"段也是 brief"长期愿景"复述,可一句承接

**Impact:** ~400-500 字符

**Comprehension note:** §0 已说"brief 已确定的内容在 PRD 中承接、细化,不再重复争论",§1 此处恰是违反此约定的实例。

---

### 7. CONDENSE — §2.1 JTBD "情绪性/认知性/元层"三类

**Rationale:** "功能性/情绪性/认知性/元层"四个 JTBD 分类对单一用户 hobby 项目过度形式化。可合并为:**功能性**(3 条)+ **非功能性**(消除焦虑感 + 观察思维变化 + builder 实战)。元层那条已经在原文标注"*此条不驱动 §4 任何 FR——它仅承接到 §8.2*",可改为脚注或直接搬到 §8.2 入口。

**Impact:** ~150-200 字符

**Comprehension note:** JTBD 分类对单用户 hobby 项目存在 overhead;但若 alex 觉得分类本身在 PM 实践层面有价值(SM-4 BMAD 跑通的练手目标),可降级为 QUESTION。

---

### 8. CONDENSE — NFR-1 / NFR-2 子弹列表的并列嵌套

**Rationale:** NFR-1 "凭据隔离"下含 3 个子项(Cookie / 同源存储 / 应用 API),"行为隔离"下含 2 个子项(DOM/top.location / postMessage),"机制开放"独立 1 行,"被引用于"独立 1 行。这套结构对 hobby 项目偏重——可压成:
- 凭据隔离(列举 cookie/storage/API,单段)
- 行为隔离(列举 DOM/postMessage,单段)
- 机制由架构阶段决定(单行,引用 addendum.md §2.1)

NFR-2 同理——"三层隔离"已经是 brief V1 的关键工程对应,值得保留结构;但"机制开放"和"被引用于"两行可合并为单行尾注。

**Impact:** ~300-400 字符

**Comprehension note:** 沙箱化的具体边界对架构阶段是 load-bearing,保留语义只压表达。

---

### 9. CUT — §0 文档目的中的"结构约定"细节列表

**Rationale:** §0 "结构约定"段列出 5 条 PRD 内部约定(术语先立 / FR 全局编号 / NFR / 假设 inline / NOTE FOR PM)。这 5 条都在文档实际使用时自明——下游 UX/架构读到 §3 自然懂"必须用 Glossary",读到 FR-1 看到编号自然懂全局编号策略。整段是 self-explaining 元说明,可全删,或压到 1 句"文档遵循 ID 全局编号 + Glossary 术语严格统一 + 假设内联标注 + §10 索引"。

**Impact:** ~250-300 字符

**Comprehension note:** Pyramid 模型不需要"读前导读";此段属于 burying critical info under metadata。

---

### 10. CUT — §8.4 业务里程碑承接段的"承接 brief..."引文段

**Rationale:** §8.4 开头的 `> *承接 brief 明确强调的"按范式文档要求,里程碑是业务里程碑而非功能交付里程碑"...*` 段——这是 brief 范式说明,在 PRD 中复述属于 meta。M1/M2/M3 各条本身已经清晰承担说明,blockquote 整段可删。

**Impact:** ~150-200 字符

**Comprehension note:** brief 范式约束的复述对下游无新增信息。

---

### 11. CONDENSE — §9 OQ-7 / OQ-8 的"重要提醒"/"优先级建议"/"立场张力"附加段

**Rationale:** OQ-7 含"优先级建议:OQ 中最高..."和"立场张力 `[NOTE FOR PM]`...",OQ-8 含"重要提醒:FR-4 已显式要求..."。这些附加段:
- "优先级建议:OQ 中最高"——单句保留即可,无需独立段
- "立场张力"——已在 §6.2 该条下"与 brief §差异化..."表达,此处重复
- OQ-8 的"重要提醒"——已在 FR-4 可验收条件 (c) 中表达"必须触发 PM 回顾",此处属于重述。可删

**Impact:** ~250-300 字符

**Comprehension note:** ID 引用关系不变;读者已读过 FR-4 不需要在 OQ-8 再被提醒。

---

### 12. QUESTION — §7.1 In Scope 与 §4 各 FR 的关系

**Rationale:** §7.1 In Scope 每条都以"**FR-1 + FR-2 + FR-3**"等编号形式承接 §4 内容,本质是 §4 的目录映射。对单用户 hobby 项目,§4 + §6 已完整定义"做什么 / 不做什么",§7.1 是否仍必要?**建议保留**——因为 SM(§8)和 OQ(§9)都依赖"V1 In Scope 边界"概念。但可压缩到 5-6 条总结行,删去括号注脚("注:正序切换是 PRD 从 UJ-3 推导出的 brief 未明示小扩展")——这类注脚属于"PRD 内部决策痕迹",下游无用。

**Impact:** ~150-200 字符(若仅压缩)/ ~400 字符(若删除整 §7.1 由 §4 单独承担)

**Comprehension note:** 删除 §7.1 会破坏 Pyramid 模型的"V1 总结视图"——建议**仅压缩**,不删整节。

---

### 13. PRESERVE — §3 Glossary

**Rationale:** Glossary 是下游 UX / 架构 / Epic 阶段的 load-bearing 锚点——FR 中所有术语都来自此表。即使每条 1-2 句,这套术语字典对 LLM 下游阅读不可压缩。**显式保留**,不要为了减字符而碰它。

**Impact:** 0(不动)

**Comprehension note:** Glossary 是 BMAD PRD 范式中最关键的 LLM-readable section。

---

### 14. PRESERVE — §10 Assumptions Index

**Rationale:** A1-A7 每条都被 §4 FR 引用,且 finalize 阶段需要 alex 显式确认或修订。这套索引是 PRD → 架构 → Dev 的关键传递契约,不可压缩。**显式保留**。

**Impact:** 0(不动)

**Comprehension note:** Assumptions Index 直接承担 BMAD finalize-autofix 的 alex 决策点。

---

### 15. PRESERVE — §4 各 FR 的"测试性后果"列表

**Rationale:** "测试性后果"是 PRD 范式定义的 testable 验收基础,所有项都将传递到 Epic/Story/QA 阶段。**逐条 PRESERVE**,即使看起来重复也不动。仅"卡片网格"等冗长嵌套可按建议 #2 压缩表达层(不动语义)。

**Impact:** 0(不动语义)/ 见建议 #2 的表达层压缩

**Comprehension note:** 测试性后果是 PRD 的 contractual core,削减会直接破坏下游可承接性。

---

### 16. PRESERVE — §8.3 Counter-metrics(SM-C1 / SM-C2 / SM-C3)

**Rationale:** 反向指标对 alex 个人项目至关重要——它直接对抗 "为达成 SM 而扭曲产品"的失败模式。SM-C2 "不通过推送 / 邮件提醒 / 红点 / 通知刺激打开"特别 load-bearing,会被架构/Dev 阶段直接消费。**显式保留**,即使每条文字偏长。

**Impact:** 0(不动)

**Comprehension note:** Counter-metrics 是 brief 立场与 PRD SM 之间的桥,删了 SM 会失去校准点。

---

## Summary

- **Total recommendations:** 16(其中 4 条 PRESERVE 用于明确保护)
- **可执行削减项:** 11 条(CUT/CONDENSE/MERGE)
- **Estimated reduction:** 约 ~3,200-4,000 字符(占当前 ~35,400 字符的 9-11%)
  - 但若**额外**全面表达紧凑化(prose 化叙述全部改写为更紧的列表/单句),实际可达 ~6,000-8,000 字符(~17-22%)
- **Meets length target:** 否(2 页目标对应约 ~6,000-8,000 字符,当前 ~35,400)。**单凭结构层削减无法达成 2 页目标**——本 PRD 的结构性内容(Glossary / FR consequences / Assumptions / SM / OQ)对下游 BMAD pipeline 不可或缺,2 页目标本身需要重新校准。
- **Comprehension trade-offs:**
  - 建议 #1 (各 FR 描述段 prose 化) 削减"画廊式翻看"等情感隐喻——alex 个人项目中这些是产品初心的载体,**若 alex 看重保留**应降级为 QUESTION 而非 CONDENSE
  - 建议 #3 (元 self-commentary)、建议 #5 (双向引用冗余)、建议 #9 (PRD 自述结构约定) 均为零成本削减——可全部接受
  - 建议 #6 (§1 愿景 brief 复述) 是降本最高项,但削减后 PRD 失去"产品初心独立陈述"——若 alex 希望 PRD 自洽不依赖 brief 阅读,应降级为 QUESTION

**最终建议执行顺序**:
1. 先执行 #3 / #5 / #9 / #10 / #11(零成本/低争议元 commentary 削减)
2. 再执行 #2 / #4 / #8(结构性表达压缩)
3. #1 / #6 / #7 (与 thesis / JTBD 隐喻有关) 由 alex 决策是否接受
4. #12 仅压缩 §7.1,不删整节
5. 全程不动 #13 / #14 / #15 / #16 显式保留项

**关于 2 页目标的提示**:本 PRD 的 downstream 契约(Glossary、FR consequences、Assumptions、SM、OQ)在 BMAD 范式中**结构性需要篇幅**。若 alex 坚持 2 页,需考虑:
- 把 §9 Open Questions / §10 Assumptions Index 独立到 sidecar 文件(`addendum.md` 已经有部分内容)
- 把 §8.3 Counter-metrics 移到 brief 或独立"Product Principles"文件
- 但这些都会增加下游阶段的多文件 navigation 成本——**保持 PRD 单文件、放弃严格 2 页目标**可能是更务实选择
