# Architecture Validation Results

## Coherence Validation ✅

**Decision Compatibility:**

所有技术决策相互兼容，无冲突：

- Next.js 16 + React 19 + Tailwind 4 + TypeScript 5 —— 原生组合（原型已验证基础栈）
- Drizzle + Neon HTTP driver —— 2026 主推搭配
- Auth.js v5 + Drizzle adapter + Resend Provider —— 三方组合文档完善
- `@aws-sdk/client-s3` + Cloudflare R2 —— R2 是 S3 兼容 API
- Vercel + Neon + R2 + Resend —— 跨厂商但 R2 零 egress 化解成本焦虑
- Server Components + Server Actions + Route Handlers —— Next.js 16 App Router 惯用法

**Pattern Consistency:**

- 命名约定（snake_case DB / camelCase TS / PascalCase 组件 / kebab-case lib 文件 / SCREAMING 常量）相互一致
- Server Action 用 `ActionResult` 判别联合 vs Route Handler 用 HTTP status——两套契约各自完备且不混淆
- iframe `sandbox=""` 强制规则覆盖所有 HTML 渲染场景（缩略 + Full Render）
- `requireAlex()` 强制规则覆盖所有服务端入口

**Structure Alignment:**

- `web/` 目录布局完全匹配 Next.js 16 App Router 规范
- `_bmad/` / `_bmad-output/` / `prototype/` 通过 Vercel root directory 设置隔离
- 一组件一文件 + `lib/<domain>/` 按领域分组——便于 AI agent 修改边界清晰
- 14 个组件已与 EXPERIENCE.md 行为契约对齐

## Requirements Coverage Validation ✅

**Functional Requirements Coverage：7/7 完整**

| FR | 状态 |
|---|---|
| FR-1 上传 .html | ✅ Dropzone + ArchiveModal + archiveEntry + R2 + 事务回滚 |
| FR-2 元数据 + 标题编辑 | ✅ extract-title + Zod + ArchiveModal |
| FR-3 归档后跳完整渲染 | ✅ router.push + revalidatePath + error.tsx |
| FR-4 时间线卡片网格 | ✅ RSC + groupByMonth + SortToggle + IntersectionObserver |
| FR-5 完整渲染 | ✅ 动态路由 + HTML 代理 + iframe sandbox + 键盘 + get-adjacent |
| FR-6 私有访问控制 | ✅ Auth.js + Resend + 邮箱白名单 + middleware + requireAlex |
| FR-7 事后管理 | ✅ InlineTitleEditor + download Route + ConfirmDeleteDialog + R2 cleanup |

**Non-Functional Requirements Coverage：3/3 完整**

- **NFR-1 沙箱化**：锁定 `srcDoc + sandbox=""` 模式；opaque origin + sandbox 空属性双重隔离；服务端 HTML 代理避免签名 URL 入 DOM
- **NFR-2 三层隔离**：应用层 middleware + API 层 requireAlex（401 空 body）+ 资源层 R2 私有 + 300s presigned URL
- **NFR-3 基本可靠性**（含 hard requirement）：错误隔离 = error.tsx + iframe onError；**数据持久 = Neon PITR + R2 11-9 + 周期跨服务备份**；现代浏览器;性能软目标有监测

**User Journeys Coverage：3/3 完整**

- UJ-1（找回旧 Entry）：时间线主屏 → 卡片单击 → Full Render
- UJ-2（归档新 Entry）：拖入 → 预览编辑 → 自动跳 Full Render
- UJ-3（思维演进回看）：时间线排序切换 → 卡片单击 → Full Render ←/→ 顺序导航

**Assumptions Coverage：7/7 全部处理**

- A1 `<title>` 抽取 → `lib/entry/extract-title.ts` ✓
- A2 10MB → Zod + Dropzone 双层校验 ✓
- A3 200 字符 → Zod ✓
- A4 全量加载 → `getEntries(sort)` 不分页 ✓
- A5 缩略机制 → **现锁定为方案 a**（OQ-8 关闭）✓
- A6 30 天 session → Auth.js `maxAge` ✓
- A7 响应感软目标 → loading.tsx + lazy + Vercel Analytics ✓

**Open Questions Status：1/8 关闭，6/8 显式延后，1/8 部分承接**

- ✅ OQ-8 缩略预览机制 → **关闭**（锁定方案 a）
- 🟡 OQ-7 全量数据导出 → **部分承接**（备份脚本生成完整 db dump + R2 inventory + alex Mac 周期同步 = 事实上的迁出兜底）
- ⏸ OQ-1, 2, 3, 4, 5, 6 → 显式延后到 M3 retro，架构不为这些功能预留脚手架（符合 PRD §6.2 立场）

## Implementation Readiness Validation ✅

**Decision Completeness:**

- 所有 critical 决策有版本（Next.js 16 / React 19 / Tailwind 4 / Drizzle 0.x / Auth.js v5 / @aws-sdk/client-s3 latest / Zod latest）
- 所有候选方案的取舍理由已记录
- 强制规则有正反代码示例

**Structure Completeness:**

- 完整目录树（含配置文件 / GitHub workflows / scripts / drizzle migrations）
- 14 个 React 组件已分类（Server vs Client）并定位
- 集成点 6 个服务全部命名 + 11 个环境变量清单

**Pattern Completeness:**

- 9 条 "All AI Agents MUST" 强制规则
- 6 大领域命名约定齐全（DB / TS 文件 / TS 标识符 / URL / Server Action / Route Handler）
- 错误处理分层（5 类来源）+ 日志格式 + 加载态 + 验证时机均有约定

## Gap Analysis Results

**Critical Gaps（阻塞实现）：无**

**Important Gaps（重要但不阻塞 V1）：**

1. **Magic Link 邮件服务降级路径未定义**——Resend 故障时 alex 无法登录。**缓解**：本地 Mac 周期同步备份包含完整数据快照，alex 即便登录暂时失败也无数据损失风险。**M3 retro 评估**：是否加备用 provider（Postmark / SMTP fallback）。
2. **性能预算未对原型实测**（A4 / A7 软目标）——50/100 条规模下方案 a 实际性能。**实现路径**：Story 4 实现完成后做一次 50 条种子数据的实测；若不达 NFR-3 软目标，按 FR-4 可验收条件触发 PM 回顾。
3. **Tailwind tokens 与 DESIGN.md 桥接细节**——已注明在 Story 7 实现阶段处理。`tailwind.config.ts` 的 `theme.extend` 与 DESIGN.md frontmatter 字段的映射规则需在 Story 7 起手时给出。

**Nice-to-Have Gaps（可未来加）：**

1. Sentry / 类似错误追踪——hobby 单用户暂不必（用 Vercel 日志面板）
2. R2 IAM 最小权限进一步拆分——当前生产 / 备份双 key 已足
3. migration 测试 / DB 演化预演——Story 9 上线准备时加 dry-run

## Validation Issues Addressed

无 critical 问题。3 条 important gaps 均已给出**缓解路径**或**实现期触发条件**，不影响 V1 实现就绪状态。

## Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

**16/16 checked. 无 Critical Gaps。**

## Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **High** —— 基于以下证据：
- 所有 PRD 7 FRs + 3 NFRs + 3 UJs 完整覆盖
- 7/7 Assumptions 均有架构处理
- OQ-8（架构阶段唯一需关闭的 OQ）已显式锁定
- 原型代码已验证基础栈（Next.js 16 / React 19 / Tailwind 4 / iframe sandbox 模式）
- 决策链路完整（每个选择都有候选 + 理由 + 取舍）
- 强制规则有代码示例 + 反例

**Key Strengths:**

1. **NFR-1 沙箱化机制 defense-in-depth**——同源 srcDoc opaque origin + sandbox 空属性双重隔离，与原型已验证模式一致
2. **数据所有权立场可执行**——R2 在 alex 自己 CF 账号 + 周期跨服务备份 → S3 兼容 API 意味着随时可迁
3. **原型→V1 资产迁移路径清晰**——明确"应平移 / 不进入 / 待 step-04 决策"三类，避免 AI agents 在迁移时摇摆
4. **AI agent 一致性强制规则**：9 条 MUST 规则覆盖最易出错的点（认证 / 沙箱 / 签名 URL / revalidate / Zod 双层 / 错误格式 / 日志 / glossary / 平移净化）
5. **YAGNI 立场内置**：schema 不预留未来 OQ 字段；架构不为 V1 暂不做的功能搭脚手架——与 PRD §6.2 立场一致
6. **Decision Impact Analysis 给出 10 个 Story 实现顺序**——下游 epics/stories 阶段有直接可用的起点

**Areas for Future Enhancement (M3 retro 关注点):**

1. Magic Link 邮件服务故障的兜底机制（OQ 触发条件未在 PRD，自然观察）
2. 缩略预览方案 a 在 50/100 条规模的实测性能（FR-4 静默降级禁止条已强制触发 PM 回顾）
3. 测试框架引入（Vitest / Playwright）—— 留给独立的测试策略章节
4. OQ-7 全量数据导出 UI（当前通过备份脚本部分承接）
5. Sentry 错误追踪等运维增强

## Implementation Handoff

**AI Agent Guidelines:**

1. **遵守 9 条强制规则**（见 Implementation Patterns § Enforcement Guidelines）—— 这是不可商议的边界，违反视为安全漏洞或一致性破坏
2. **PRD §3 Glossary 术语严格沿用**——Entry / 归档 / 时间线 / 完整渲染等术语在代码 / 注释 / UI 文案中**不使用同义词**
3. **从 prototype 平移代码时遵循"平移即净化"**——保留类型 + 纯函数 + iframe 模式；剔除 IndexedDB / Serwist PWA / mock entries；不要"先放着等以后删"
4. **每个变更动作完成必须 `revalidatePath()`**——无客户端缓存兜底
5. **遇到 PRD 与本架构文档冲突时**：架构文档作为下游实现的权威来源；任何与 PRD 立场矛盾的架构选择需先回 PRD 阶段修订

**First Implementation Priority（Story 0）:**

```bash
cd /Users/alex/Developer/个人项目/实验/my-bmad-app

npx create-next-app@latest web \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm
```

**完成后立即跟进的 Story 0 第二部分**：从 `prototype/pwa-explore/` 平移以下文件到 `web/`：

- `lib/mock-entries.ts` → 拆分 → `web/lib/entry/{types.ts, group-by-month.ts, sort-entries.ts, relative-time.ts, absolute-time.ts, get-adjacent.ts, extract-title.ts}`（剔除 `MOCK_ENTRIES` 数组）
- `components/EntryCard.tsx`、`Timeline.tsx`、`MonthDivider.tsx`、`FullRender.tsx`、`ArchiveModal.tsx`、`SortToggle.tsx`、`EntryDetailLoader.tsx`（**剔除 IndexedDB 调用 + mock entry 分支**，留待 Story 1-6 接 Server Component / Server Action 数据源）

**完整 Story 实现顺序**见 Core Architectural Decisions § Decision Impact Analysis（10 个 Story）。
