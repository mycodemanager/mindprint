import type { Entry } from "@/lib/entry/types";
import { FullRenderTopChrome } from "@/components/FullRenderTopChrome";
import { COPY } from "@/lib/voice";

interface Props {
  entry: Entry;
}

/**
 * FullRender · 完整渲染单一 Entry（Server Component · FR-5 主壳）。
 * 平移自原型 FullRender，砍到基础：去 'use client' / 上一·下一 / ⋯ 菜单 / 删除 / 键盘
 * （→ Story 3.4 / Epic 4）。
 *
 * 🔒 iframe 用 `src`（指向 Route Handler /api/entry/[id]/html）而非 srcDoc：
 *    Full Render 单文件可达 10MB，srcDoc 会把整份 HTML 内联进 RSC payload；src 走 2.1
 *    fetchEntryHtml 的流式 Response。缩略图（ThumbnailIframe）同样走该 route-handler `src`
 *    （共享同一沙箱模型，非 srcDoc）。
 * 🔒 sandbox="allow-scripts"（仅此一个 token）：iframe 获 opaque origin（无 allow-same-origin →
 *    隔离宿主 cookie/localStorage/DOM/parent），但允许脚本执行以渲染 JS 驱动原型（FR-5 原貌等同，
 *    经 NFR-1 沙箱修订 2026-06-04 / Story 3.6）。**严禁**叠加 allow-same-origin（+scripts 即逃逸沙箱）。
 */
export function FullRender({ entry }: Props) {
  return (
    <div className="flex h-dvh flex-col">
      <FullRenderTopChrome entry={entry} />

      {/* 主渲染区 · 沙箱化 iframe（NFR-1）。<main id="main"> 承接 layout skip-link。 */}
      <main id="main" className="min-h-0 flex-1 bg-surface-container-lowest">
        <iframe
          key={entry.id}
          src={`/api/entry/${entry.id}/html`}
          sandbox="allow-scripts"
          title={`${entry.title} 完整渲染`}
          className="block h-full w-full border-0"
        />
      </main>

      {/* 底部提示 · Esc 键盘行为属 Story 3.4，本 story 仅静态提示文字 */}
      <footer
        role="contentinfo"
        className="flex-none border-t border-outline-variant bg-surface py-2 text-center"
      >
        <p className="font-mono text-mono-metadata uppercase tracking-widest text-on-surface-variant">
          {COPY.fullRender.footerHint}
        </p>
      </footer>
    </div>
  );
}
