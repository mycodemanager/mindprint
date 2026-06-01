// 应用层门卫（NFR-2 应用层重定向）。
//
// ⚠️ 文件名说明：故事原文写 `middleware.ts`。但本项目是 Next.js 16，middleware 已被重命名为
//    `proxy`（且 proxy 固定 Node.js runtime，不再是 Edge）——见 node_modules/next/dist/docs 的
//    upgrading/version-16「middleware to proxy」。AGENTS.md 要求遵循 Next 16 文档并采纳弃用提示，
//    故落地为 proxy.ts。这也使故事「头号护栏」（Edge bundle 不能含 DB 驱动）不再适用。
//
// 鉴权策略（Next 16 官方 auth 指南 + 故事「方案 A」）：proxy 在每个请求（含 prefetch）上运行，
//    因此这里只做「乐观校验」——只看 Auth.js 的 database-session cookie 是否存在，不查 DB。
//    真正的鉴权（校验 session 有效性 + 白名单）由 Node 层的 requireAlex() / route handler 兜底
//    （NFR-2 API 层 + 资源层）。门卫语义：无 session cookie 且访问非 /auth 路径 → 跳登录页。
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth.js v5 session cookie 名：dev(http) = `authjs.session-token`，
// 生产(https) = `__Secure-authjs.session-token`。
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

export function proxy(req: NextRequest) {
  const hasSessionCookie = SESSION_COOKIES.some((name) => req.cookies.has(name));

  if (!hasSessionCookie && !req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
  }

  return NextResponse.next();
}

// matcher 排除 /api/auth（认证端点必须可达）、/auth（登录相关页）、Next 静态资源、favicon。
export const config = {
  matcher: ['/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)'],
};
