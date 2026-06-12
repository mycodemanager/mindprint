// HTML 内容代理 Route Handler（FR-5 / NFR-1 服务端代理）。
// 喂 Full Render iframe 的 src；服务端从 R2 流式取回 HTML，避免签名/凭据进 DOM。
//
// 鉴权（NFR-2 资源层）：requireAlex() catch → 401 空 body（**非 404**，不泄露 Entry 是否存在）。
// proxy.ts 对无 cookie 的 /api/* 已乐观回 401；此处 requireAlex() 是权威校验（present-but-invalid
// cookie 能过 proxy 乐观校验，在此被挡）。
import { requireAlex } from '@/lib/auth/require-alex';
import { getEntryById } from '@/lib/db/queries';
import { fetchEntryHtml } from '@/lib/r2/fetch';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1) Auth —— 401 空 body（非 404，NFR-2 资源层不泄露）。
  try {
    await requireAlex();
  } catch {
    return new Response(null, { status: 401 });
  }

  // 2) Next 16 async params。
  const { id } = await params;

  // 3) 查 DB（getEntryById 内含非法 UUID 守卫）。
  const entry = await getEntryById(id);
  if (!entry) return new Response(null, { status: 404 });

  // 4) 从 R2 流式取回（key 不存在抛 NoSuchKey → catch 404）。
  try {
    const r2Response = await fetchEntryHtml(entry.r2ObjectKey);
    if (!r2Response.ok || !r2Response.body) {
      return new Response(null, { status: 404 });
    }
    return new Response(r2Response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // NFR-1 防御纵深（Codex review P1）：iframe 的 sandbox 只在「被嵌入」时生效；
        // 若认证态直接导航 / 新标签打开本 URL，归档 HTML 会作为同源顶层文档渲染、脚本可带
        // alex 会话执行（存储型 XSS）。CSP `sandbox allow-scripts`（无 allow-same-origin token）让响应
        // 文档自身被沙箱化 —— opaque origin（脚本可执行但碰不到 alex 会话/cookie/storage），
        // 无论 iframe 嵌入还是直接导航都生效（Story 3.6：放开脚本渲染 JS 原型，opaque 仍隔离会话）。
        'Content-Security-Policy': 'sandbox allow-scripts',
      },
    });
  } catch (err) {
    console.error('[entry-html] R2 fetch failed', err);
    return new Response(null, { status: 404 });
  }
}
