# Deferred Work

延后项登记表 —— 记录 code-review / 开发过程中识别、但有意推迟到后续 Story 处理的事项。

## Deferred from: code review of 1-2-数据层基础drizzle-5-表-schema-typed-env (2026-06-01)

- **neon-http 无事务支持**：`db.transaction()` 运行时直接抛错（已核 `drizzle-orm/neon-http` 源码）。归档链路（R2→DB 回滚）须用 `db.batch()` 或应用层补偿，不可用 `.transaction()`。属架构锁定 neon-http 的固有约束。 → **Story 2.2 / 2.3**。`web/lib/db/client.ts`
- **可选环境变量接受空串**：`z.string().optional()` 放行 `""`，而 `.env.example` 出厂即 `""`；「未设置」与「设为空」无法区分。各变量收紧为必需时应改 `.min(1)` 或把空串归一化为 `undefined`。 → **Story 1.3 / 1.5 / Epic 2 / 4.5**（各自收紧时）。`web/lib/env.ts`
- **env.ts 模块加载 throw 的构建/Edge 风险**：模块级 `throw` 的 fail-fast 是有意为之；接入 Server 路由后需留意 `next build` 预渲染 / Edge runtime 下 `process.env` 未填充时导致整体构建失败。 → **Story 1.3+**（接入路由时）。`web/lib/env.ts`

## Deferred from: code review of 1-3-认证基线authjs-magic-link-middleware-三个-auth-页面 (Codex, 2026-06-01)

- **proxy 非真鉴权边界（F3）**：`web/proxy.ts` 只做乐观 cookie 存在性校验（cookie 可伪造），不是安全边界。本 Story 无私有页面故不泄露数据；但第一个渲染私有数据的页面**必须**置于调用 `requireAlex()` 的受保护 layout 之下（server 层权威校验），不可依赖 proxy。 → **Epic 2**（首个私有页落地时引入受保护 layout）。`web/proxy.ts` / 新建 `web/app/(app)/layout.tsx` 之类
- **trustHost + 未固定 canonical URL → Magic Link host 投毒（F4）**：已加「设了 `AUTH_URL` 才校验 magic-link origin」的防御，但硬切换未做。部署时须把 `AUTH_URL` 收紧为**必需** + 关闭 `trustHost`，使 origin 校验始终生效（trustHost 信任请求 Host，否则可被诱导发出含恶意域名的登录链接）。 → **Story 1.5**（首次部署）。`web/lib/env.ts` / `web/lib/auth/config.ts`

## Deferred from: dev of 1-4-视觉系统tailwind-tokens-字体加载-暗色模式-empty-state (2026-06-01)

- **CJK 衬线非 Mac 兜底未自托管（偏差 2「遗留」）**：当前 `Noto_Serif_SC` / `Noto_Sans_SC` 走 `next/font/google` + `preload:false`，仅作非 Mac 网络兜底；alex 的 Mac 由系统 Songti SC / PingFang SC 渲染衬线（V1 验收点）。若日后要在非 Mac 上稳定呈现编辑衬线 CJK 且不发数 MB —— 改用 `next/font/local` 自托管**子集化** `.woff2`（pyftsubset 取常用汉字集 + `unicode-range`），变量名沿用 `--font-noto-serif-sc` / `--font-noto-sans-sc` 即可零改 `globals.css`。 → **Epic 3+ / 优化阶段**。`web/app/layout.tsx`
- **构建期依赖 fonts.gstatic.com（next/font CJK 下载脆弱）**：`next/font/google` 在 `next build` 时下载并自托管字体；CJK 变体字体有数十个 unicode-range 分块，本机构建实测对 gstatic 连接抖动敏感（需重试数次才全绿）。Vercel 构建网络可靠故不阻塞；但 **GitHub Actions CI（Story 4.4）若网络受限可能偶发失败**。自托管子集（见上一条）可彻底消除此构建期网络依赖。 → **Story 4.4**（CI 落地时评估）。`web/app/layout.tsx`
