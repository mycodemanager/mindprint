# MindPrint 部署 Runbook（首次云部署 · Vercel + vercel.app 子域）

> 来源：Story 1.5。本文件是 **alex 的逐步操作手册**（`[ops·alex]` 任务 Task 6–7）。
> dev agent 已完成代码侧加固（`env.ts` 的 `AUTH_URL` 生产必需、`auth.config.ts` 的 `trustHost` 决策、
> `.env.example` 注释）；**以下控制台操作需 alex 手动执行**，dev 无法代点。
> 完成后把「最终 deployment URL + 多设备验收结果」回报给 dev 收尾 Task 8。

---

## 0. 总览与依赖顺序（务必按序）

```
Neon(建 production branch + push 5 表)
   └─▶ Resend(取 API key + 确认账号邮箱)
          └─▶ Vercel(建项目 Root=web/ + 配三套 env)
                 └─▶ 首次部署(拿到稳定子域 <project>.vercel.app)
                        └─▶ 回填 AUTH_URL=该子域 + redeploy
                               └─▶ 验收(macOS Chrome + iPhone Safari 同时登录, FR-6)
```

> **鸡生蛋说明**：`AUTH_URL` 必须等于稳定生产子域，但子域要先建好 Vercel 项目才知道。
> 所以先建项目 + 配其余 env → 首次部署拿到 `https://<project>.vercel.app` → 回填 `AUTH_URL` → 再 redeploy。

**前置确认（关键，否则生产收不到登录邮件）**：
- ✅ 你的**登录邮箱**（将填入 `ALLOWED_EMAIL`）**必须 = 你注册 Resend 账号的那个邮箱**。
  原因：V1 不配 DNS，发件人用 Resend 测试地址 `onboarding@resend.dev`，它**只能发往账号自身邮箱**。
  （alex 已于 2026-06-02 确认满足。验证自有发信域名以发往任意邮箱 → 留 Story 4.4。）

---

## ① Neon —— 生产 branch + schema 就位（AC3）

1. Neon 控制台 → `mindprint` 项目 → 确认或创建 **`production` branch**。
2. 复制 production branch 的连接串（**务必含 `?sslmode=require`**）。
3. 本地用该串把 5 张表推到 production branch（迁移策略 generate+migrate 切换留 Story 4.5，本 story 用 `push`）：

   ```bash
   cd web
   DATABASE_URL='<production 连接串>' npx drizzle-kit push
   ```

4. 验证 5 表（`users` / `accounts` / `sessions` / `verification_tokens` / `entries`）已创建：

   ```bash
   DATABASE_URL='<production 连接串>' npx drizzle-kit studio   # 浏览器看空表即可
   ```

---

## ② Resend —— API key + 账号邮箱（AC4）

5. Resend 控制台 → 取 **API key**（即将填入的 `AUTH_RESEND_KEY`）。
6. **再次确认**：Resend 账号注册邮箱 = 计划填入的 `ALLOWED_EMAIL`（见上「前置确认」）。

---

## ③ Vercel —— 建项目 + 三套环境变量（AC1, AC2）

7. Vercel → **New Project** → Import GitHub repo `mycodemanager/mindprint`。
8. 项目设置（关键）：
   - **Root Directory = `web/`** ← 最易漏，必须设（仓库根是 monorepo，Next app 在 `web/`）。
   - Framework Preset：**Next.js**（自动识别）。
   - Build Command：`npm run build`　Install Command：`npm install`。
   - Node.js Version：**20.x**（22.x 亦可）。
9. Git 集成（默认即满足，确认即可）：`main` → **Production**，其他分支 → **Preview**。

### 环境变量（Settings → Environment Variables）

先把 **Production** 配全；Preview / Development 可复用相同值或留占位（本 story 不强制）。

| 变量 | Production 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | Neon **production** 连接串（含 `?sslmode=require`） | AC2 |
| `AUTH_SECRET` | `openssl rand -base64 33` 的输出 | ⚠️ **一旦设定不要再改**（改会令所有已签发 session 失效，AC16） |
| `AUTH_RESEND_KEY` | Resend API key | 来自 ② |
| `ALLOWED_EMAIL` | alex 邮箱（**= Resend 账号邮箱**） | 单用户白名单 + 发信前提 |
| `AUTH_URL` | **首次部署后回填** `https://<project>.vercel.app` | 见 ④ 步骤 12 |
| `R2_ACCOUNT_ID` | 留空 | Epic 2 填 |
| `R2_ACCESS_KEY_ID` | 留空 | Epic 2 填 |
| `R2_SECRET_ACCESS_KEY` | 留空 | Epic 2 填 |
| `R2_BUCKET_NAME` | 留空 | Epic 2 填 |
| `R2_BACKUP_BUCKET_NAME` | 留空 | Story 4.5 填 |
| `DATABASE_URL_READONLY` | 留空 | Story 4.5 填 |

> 生成 `AUTH_SECRET`：
> ```bash
> openssl rand -base64 33
> ```
> 留空的 `R2_*` / 备份变量在 `lib/env.ts` 是 `.optional()`，**不会触发** 构建期 fail-fast；
> 必需变量（`DATABASE_URL` / `AUTH_SECRET` / `AUTH_RESEND_KEY` / `ALLOWED_EMAIL` / 生产的 `AUTH_URL`）
> 必须齐全，否则 `next build` 在 Vercel 构建期就会因 `env.ts` 校验失败而 fail。

---

## ④ 首次部署 + 回填 AUTH_URL（AC5）

10. 触发首次 Production 构建：
    ```bash
    git push origin main      # 或在 Vercel Dashboard 点 Deploy
    ```
    > 此时 `AUTH_URL` 还没填 → 生产构建会因 `env.ts` 的生产必需校验**预期失败**。两种做法择一：
    > - **推荐**：先在 Vercel 临时把 `AUTH_URL` 填一个占位（如 `https://placeholder.vercel.app`）让首次 build 过，
    >   拿到真实子域后改成真值再 redeploy；
    > - 或先建项目让 Vercel 分配子域（不部署），直接把真实子域填进 `AUTH_URL` 再首次部署。
11. 构建绿后，记录 Vercel 分配的**稳定生产子域**：`https://<project>.vercel.app`。
12. 回到 Settings → Environment Variables，把 **Production 的 `AUTH_URL`** 改成该真实子域。
13. **Redeploy**（Deployments → 最近一次 → Redeploy）让 `AUTH_URL` 生效。

---

## ⑤ 验收 —— FR-6 多设备同时登录（AC6, AC7, AC9）

14. **macOS Chrome** 访问 `https://<project>.vercel.app`：
    - 未登录 → `proxy.ts` 重定向到 `/auth/signin`；
    - 输入白名单邮箱 → 收到 Magic Link → 点击 → 建立 30 天 database session → 回到 `/`；
    - 看到 DESIGN 调性的 **Empty State**（Story 1.4 视觉）。
15. **iPhone Safari** 访问同一 URL：
    - 可**同时登录**（database session 多行，不顶掉 Mac 端）；
    - 移动端视觉响应式正确；暗色模式跟随手机系统设置。
16. Vercel → **Logs（Runtime）**：无 unexpected error；登录流程可见 `[auth]` 前缀日志（如 `magic link sent to …`）。

---

## ⑥ 常见坑（Troubleshooting）

- **「页面显示已发送，但邮箱收不到 Magic Link」**
  → `ALLOWED_EMAIL` 不是 Resend 账号注册邮箱。V1 下 `onboarding@resend.dev` 只能发往账号自身邮箱。
  改 `ALLOWED_EMAIL` 为 Resend 账号邮箱，或验证自有发信域名（留 Story 4.4）。Resend 发信失败会在
  Vercel Logs 抛 `[auth] Resend error: …`。

- **构建报环境变量校验失败 `❌ 环境变量校验失败…AUTH_URL…`**
  → 生产 `AUTH_URL` 未填。按 ④ 回填稳定子域后 redeploy。

- **登录报 `UntrustedHost`**
  → 不要关闭 `trustHost`。本项目 `auth.config.ts` 保留 `trustHost: true`（Vercel 后必需）；
  防 Host 投毒由 `AUTH_URL` + `config.ts` 的 origin 断言达成，与关闭 trustHost 无关。

- **Magic link origin 不一致被拒发**（Logs 见 `magic link origin mismatch`）
  → `AUTH_URL` 与实际访问域名 origin 不一致。确保用 `https://<project>.vercel.app` 这一 canonical 子域访问，
  且 `AUTH_URL` 填的就是它。

- ⚠️ **不要改 `AUTH_SECRET`**：变更会令所有已签发 session 立即失效（需全部重新登录）。

---

## ⑦ 本 Story 范围边界（AC10 —— 明确「不做」）

- ❌ 自定义域名、GitHub Actions CI、Vercel Web Analytics → **Story 4.4**。
- ❌ R2 真凭据 → **Epic 2**（本 story `R2_*` 留空占位）。
- ❌ 迁移策略 `generate + migrate` 切换、备份脚本 → **Story 4.5**（本 story 用 `drizzle-kit push`）。
- ❌ 验证自有发信域名 / 改 `noreply@<域名>` → **Story 4.4**（本 story 保持 `onboarding@resend.dev`）。
