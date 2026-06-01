# Deferred Work

延后项登记表 —— 记录 code-review / 开发过程中识别、但有意推迟到后续 Story 处理的事项。

## Deferred from: code review of 1-2-数据层基础drizzle-5-表-schema-typed-env (2026-06-01)

- **neon-http 无事务支持**：`db.transaction()` 运行时直接抛错（已核 `drizzle-orm/neon-http` 源码）。归档链路（R2→DB 回滚）须用 `db.batch()` 或应用层补偿，不可用 `.transaction()`。属架构锁定 neon-http 的固有约束。 → **Story 2.2 / 2.3**。`web/lib/db/client.ts`
- **可选环境变量接受空串**：`z.string().optional()` 放行 `""`，而 `.env.example` 出厂即 `""`；「未设置」与「设为空」无法区分。各变量收紧为必需时应改 `.min(1)` 或把空串归一化为 `undefined`。 → **Story 1.3 / 1.5 / Epic 2 / 4.5**（各自收紧时）。`web/lib/env.ts`
- **env.ts 模块加载 throw 的构建/Edge 风险**：模块级 `throw` 的 fail-fast 是有意为之；接入 Server 路由后需留意 `next build` 预渲染 / Edge runtime 下 `process.env` 未填充时导致整体构建失败。 → **Story 1.3+**（接入路由时）。`web/lib/env.ts`
