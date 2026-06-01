## Document Summary

- **Purpose:** PRD 主文档之外、对下游（架构 / UX / 实现）有价值的技术倾向、机制选项、未入 PRD 的细节
- **Audience:** 架构师 / dev / 未来 PM（次级读者，技术倾向更强）
- **Reader type:** humans（技术读者）
- **Structure model:** Reference/Database —— 各条目随机访问，下游按需翻阅
- **Current length:** ~860 字 / 49 行 / 7 个标题段（§1.1 + §2.1–2.5 + §3）
- **Calibration:** Hobby 项目支撑文档，**terse > warm**。每节必须为架构师真实带来 PRD 未覆盖的价值才能保留。

---

## Recommendations

### 1. [CUT] §3 "待入 Glossary 但暂未确定术语的候选项"

**Rationale:** 该节讨论"删除 / 撤销 / 丢弃"的术语之争已被 PRD §9 OQ-2 完整承接（"OQ-2：删除前的'取回本地'打包动作"已经明确 V1 立场是硬删除，并把"Unarchive"语义留作未决）。addendum §3 仅复述 OQ-2 的术语侧切片，且 PRD 已在 OQ-2 关联引用了 `addendum.md` §3——形成循环引用却无新增信息。

**Impact:** ~50 字（含标题与引导句）
**Comprehension note:** 移除后 PRD OQ-2 的关联引用需同步把 `addendum.md §3` 摘掉（属 PRD 侧修正，不在本次结构 review 输出范围）。

---

### 2. [CONDENSE] §2.5 "上传时的 HTML 完整性"

**Rationale:** 该节内容已被 PRD §9 OQ-4（"HTML 资源完整性"）完整承接——当前立场（V1 不内联化）+ 未决问题（是否需要资源内联化）+ 触发条件（"打开旧 Entry 发现样式塌了"频次）均已在 OQ-4 写明。addendum §2.5 几乎是 OQ-4 的逐字重述，仅多出"AI 生成的单页 .html"这一观察角度（边际价值低，PRD 阶段已知）。建议压缩到 1 行交叉引用，例如：
> "上传时的 HTML 完整性议题（外链 CDN / 图床离线后样式塌）—— V1 不处理，触发与决策见 PRD §9 OQ-4。"

**Impact:** ~50 字（4 行压成 1 行）
**Comprehension note:** 架构师在 PRD 阶段已能从 OQ-4 直接得到全部决策信息；addendum 此节的存在并未带来新选项空间。

---

### 3. [CONDENSE] §1.1 Next.js 技术倾向

**Rationale:** "PRD 视角判断"4 行约 80 字阐述 Next.js 与部署约束 / alex 背景的匹配——属于 PRD 阶段判断后的**结论**，但展开论证（"App Router + Route Handlers 能在单一代码库内承载上传 API、时间线 SSR、渲染页面"）超出 addendum"留给架构阶段评估"的定位。架构师只需知道**alex 提出过 Next.js 候选 + PRD 不锁定**这两点即可。建议压缩为 2 行：

> - **Next.js**（alex 于 2026-05-28 提出）：与 brief 部署约束 + alex 前端背景匹配。
> - **不锁定**：若架构阶段评估出更轻方案（例如纯静态 + edge function）应优先采用。

**Impact:** ~70 字
**Comprehension note:** 不削弱架构师的判断空间——"匹配性"细节由架构师自行评估，addendum 不需替架构师做半个评估。

---

### 4. [CONDENSE] §2.3 "单用户认证机制选择"

**Rationale:** 三段中前两段（"PRD 立场" + "架构阶段候选"）实际等价于 PRD §5 NFR-2 + §9 FR-6 已表达的内容。"候选方案列表"是有价值的部分（magic link / 单密码 / passkey / IP 白名单 + 共享密码）——但需要的只是这个列表本身，无需重复 PRD 立场。建议压缩到：

> 认证机制由架构阶段决定（PRD 不指定）。候选：magic link（任意设备首次访问邮箱接链）、单一长密码（每设备首次输入并记住）、passkey、IP 白名单 + 共享密码。

**Impact:** ~40 字
**Comprehension note:** 保留候选列表本身——这是 addendum 唯一独有的内容。

---

### 5. [PRESERVE] §2.1 "HTML 渲染的沙箱化"

**Rationale:** 候选方案列表（iframe `sandbox` / 独立子域名 / CSP 策略）是 PRD §5 NFR-1 显式委托给本节的"机制候选"——架构阶段需要这个完整的选项空间做权衡。PRD NFR-1 仅说"机制开放"但未列候选；addendum §2.1 提供唯一的候选清单。**结构良好、密度合适，prima facie 可保留。**

**Impact:** +0 字（建议明确保留）
**Comprehension note:** 此节是 addendum"为架构阶段服务"定位最直接的兑现——CUT 会让 NFR-1 失去候选空间锚点。

---

### 6. [PRESERVE] §2.4 "卡片网格的 HTML 缩略预览机制"

**Rationale:** 三方案对比 + 推荐分析是 PRD OQ-8 显式引用的核心决策依据（OQ-8："addendum.md §2.4 已对三个候选方案做出推荐分析"）。**架构师阶段决策方案 a/b/c 选型的唯一来源**。条目长但所有内容均为决策必要——优缺点对比无冗余。

**Impact:** +0 字（建议明确保留）
**Comprehension note:** 这是 addendum 价值密度最高的一节，CUT 或 CONDENSE 都会折损架构决策质量。

---

### 7. [PRESERVE] §2.2 "数据所有权"与"无自有服务器"的张力

**Rationale:** 该节呈现了 PRD §6.2 "全量导出"未做 + brief §差异化"数据所有权"立场之间的**深层架构权衡**（供应商锁定 / 迁出门槛 / 标准格式）。PRD OQ-7 触发条件已记，但未展开"为什么这是张力"——addendum §2.2 是架构师在挑选对象存储 / DB 时唯一的判断框架。3 行简洁，已属最低必要密度。

**Impact:** +0 字（建议明确保留）
**Comprehension note:** 此节内容若 CUT，架构师选型时可能无意识地选择"集成最简单"的方案而牺牲迁出能力——这正是 PRD §10 OQ-7 标为"OQ 中最高优先级"想要警惕的失败模式。

---

## Summary

- **Total recommendations:** 7（3 项 CONDENSE + 1 项 CUT + 3 项 PRESERVE）
- **Estimated reduction:** ~210 字（约 25%），从 ~860 字 → ~650 字
- **Meets length target:** No target specified（addendum is already "shorter than PRD by design"——目标是密度而非长度）
- **Comprehension trade-offs:** 无关键损失。所有 CUT/CONDENSE 项均已在 PRD 主文档承接，addendum 仅是冗余。所有 PRESERVE 项是 PRD 显式委托给 addendum 的"选项空间锚点"。
- **Net effect:** addendum 从"PRD 重述 + 选项空间"变为"纯选项空间"——更贴合其"留给架构阶段评估"的定位。
