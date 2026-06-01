# Starter Template Evaluation

## Primary Technology Domain

全栈 web 应用（Next.js 16 + React 19 + Postgres + 对象存储 + Magic Link 认证）。前端层已由原型 `prototype/pwa-explore/` 验证基础栈可行；本阶段确定**项目初始化基线**，具体 Auth / DB / Storage / ORM 模块的接入在 step-04 决策。

## User Technical Preferences（gating 答复 · 2026-05-28）

| 维度 | 选定 |
|---|---|
| **Starter 风格** | Minimal · 自己装配（从 create-next-app 起步，逐步加模块） |
| **存储拓扑** | 分离 · 托管 DB + alex 自有 S3/R2 桶（承接 addendum §2.2 数据所有权立场） |
| **认证机制** | Magic Link · 邮箱无密码（30 天会话，多设备友好） |
| **ORM 层** | Drizzle · 轻量类型化 SQL（2026 Next.js + Postgres 主流推荐） |

## Starter Options Considered

| Starter | 评估 |
|---|---|
| **`create-next-app` 裸基线** | ✅ **选定**——与"Minimal · 自己装配"立场完全契合 |
| **`create-t3-app`** | ❌ tRPC + Prisma 默认与已选择的 Drizzle + REST 风格冲突 |
| **Supabase Next.js 模板** | ❌ 与"自有 S3/R2"数据所有权立场冲突（Supabase Storage 迁出门槛高） |
| **`postgres-drizzle` Vercel 模板** | ⚠️ 部分契合——但预设 Vercel Postgres 不便迁出；保持中立基线更利长期 |

## Selected Starter: `create-next-app@latest`（裸基线）

**Rationale for Selection:**

- 与 alex 偏好 100% 契合（Minimal · 自己装配）
- 保留 SM-4/SM-5 元层目标的学习信号——后续 Auth / DB / Storage / ORM 由 alex 在 step-04 决策后逐项接入
- 中立基线最大化未来迁移自由度（避免 starter 自带的 vendor 偏好绑死）
- 与原型代码栈（Next.js 16 + React 19 + Tailwind 4 + TypeScript）一致，便于平移已验证组件

**V1 代码库位置：**`{project-root}/web/`（与 `prototype/` 同级；prototype 保留作为参考归档）

**Initialization Command:**

```bash
cd {project-root}

npx create-next-app@latest web \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm
```

`--no-src-dir` 与原型一致（`components/` / `lib/` / `app/` 平铺根级），便于平移已验证代码。包管理器默认 npm（与原型一致；若 alex 倾向 pnpm/yarn/bun 在 step-04 可统一调整）。

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.x，`strict: true`
- React 19（latest）、Next.js 16（latest，App Router 生产稳定 + Turbopack 默认稳定 @ 2026）

**Styling Solution:**
- Tailwind CSS 4（PostCSS 配置）
- 全局 CSS 入口 `app/globals.css`
- 与 DESIGN.md tokens 对齐的工作放在 step-04 / 实现阶段（不在 starter 范围）

**Build Tooling:**
- **Turbopack**（`next dev` + `next build` 默认，2026 已稳定，声称 2-5× 生产构建 + 10× Fast Refresh 提速）
- ESLint with `eslint-config-next`

**Testing Framework:**
- starter 不预置测试框架——hobby 项目按需在实现阶段加（Vitest / Playwright 候选，留到测试策略章节决策）

**Code Organization:**
- App Router（`app/` 目录，server components 默认）
- `app/layout.tsx` + `app/page.tsx` 入口
- 根级目录布局（`components/` / `lib/` 等手动新建，与原型对齐）
- Import alias：`@/*` → 项目根

**Development Experience:**
- Turbopack Fast Refresh
- TypeScript 严格模式
- ESLint 实时检查
- `next dev` 默认端口 3000

**Note:** Project initialization using this command should be the first implementation story（建议命名为 *Story 0 · 项目初始化 + 原型代码平移*——后者把原型的类型 + 纯函数 + iframe 组件等可平移资产搬到 `web/` 下）。

## Out of Scope for This Step（留给 step-04 决策）

- **数据库**：Neon / Turso / Supabase Postgres / 其他（"分离 · 托管 DB + 自有 S3/R2 桶"立场下的 DB 厂商选型）
- **对象存储**：AWS S3 / Cloudflare R2 / Backblaze B2 等具体桶选型
- **认证库**：Auth.js / Lucia / 自实现（Magic Link 立场下的 lib 选型）
- **邮件 provider**：Resend / Loops / Nodemailer + SMTP（Magic Link 链路的发件渠道）
- **ORM 版本与配置**：Drizzle ORM 安装与 schema 设计（具体在 step-04 数据层决策）
- **部署平台**：Vercel / Netlify / Cloudflare Pages 三者具体选定
- **测试框架**：Vitest / Playwright 是否引入（建议留到测试策略章节）
- **CI/CD**：GitHub Actions / Vercel 自动部署集成
