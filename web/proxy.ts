// 应用层门卫（NFR-2 应用层重定向）。
//
// ⚠️ 文件名说明：故事原文写 `middleware.ts`。但本项目是 Next.js 16，middleware 已被重命名为
//    `proxy`（且 proxy 固定 Node.js runtime，不再是 Edge）——见 node_modules/next/dist/docs 的
//    upgrading/version-16「middleware to proxy」。AGENTS.md 要求遵循 Next 16 文档并采纳弃用提示，
//    故落地为 proxy.ts。这也使故事「头号护栏」（Edge bundle 不能含 DB 驱动）不再适用。
//
// 鉴权策略（Next 16 官方 auth 指南 + 故事「方案 A」）：proxy 在每个请求（含 prefetch）上运行，
//    因此这里只做「乐观校验」——只看 Auth.js 的 database-session cookie 是否存在，不查 DB。
//    ⚠️ 这不是安全边界：cookie 可被伪造（code-review F3）。真正的鉴权（校验 session 有效性 +
//    白名单）必须由 Node 层兜底——API 走 requireAlex()（→ 401），私有页面须置于调用 requireAlex()
//    的受保护 layout 之下（Epic 2 第一个私有页落地时引入）。proxy 仅负责「无 cookie 时的 UX 重定向
//    （页面）/ 回 401（API）」。
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth.js v5 session cookie 名：dev(http) = `authjs.session-token`，
// 生产(https) = `__Secure-authjs.session-token`。
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = SESSION_COOKIES.some((name) => req.cookies.has(name));

  // Auth.js 端点是认证机制本身，永远放行。
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // 其余 API：绝不 302（会破坏 fetch 调用方）。无 session cookie → 401 空 body（NFR-2 API 层语义，
  //   code-review F5）。这只是乐观兜底，权威校验由各 handler 首行的 requireAlex() 负责。
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return hasSessionCookie ? NextResponse.next() : new NextResponse(null, { status: 401 });
  }

  // /auth 公开页（精确前缀匹配，避免 /authentic-* 之类被误放行，code-review F5）。
  if (pathname === '/auth' || pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // 其余页面路由：无 session cookie → 跳登录页。
  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
  }

  return NextResponse.next();
}

// matcher 只排除 Next 静态资源 / favicon；路径分类（/api、/api/auth、/auth）的精确判断移入函数体（见上）。
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
