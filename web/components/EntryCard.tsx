import Link from "next/link";
import type { Entry } from "@/lib/entry/types";
import { absoluteTime } from "@/lib/entry/absolute-time";
import { relativeTime } from "@/lib/entry/relative-time";
import { ThumbnailIframe } from "@/components/ThumbnailIframe";

interface Props {
  entry: Entry;
}

/**
 * EntryCard（Server Component）—— 时间线卡片。整卡单击进 Full Render（FR-4 D14）。
 *
 * - 上半：aspect-4/3 缩略容器内放 <ThumbnailIframe>（client，视口懒渲染）。
 * - 下半：标题（headline-sm，line-clamp-3）+ 相对时间（caption；hover/title 显绝对时间）。
 * - 1px dust 边 + rounded-lg + surface-container-low；hover 微抬起 + 染棕阴影（reduced-motion 由 globals.css 全局压平）。
 * - 禁 hover overlay 按钮（管理动作集中 Full Render，DESIGN Don't）。@media(hover:hover) 门控属 Story 3.5。
 */
export function EntryCard({ entry }: Props) {
  return (
    <Link
      href={`/entry/${entry.id}`}
      aria-label={`${entry.title}，归档于 ${absoluteTime(entry.archivedAt)}`}
      className="group block overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low shadow-card-rest transition hover:-translate-y-px hover:shadow-card-hover focus-visible:shadow-card-hover"
    >
      {/* 缩略预览区（pointer-events 由 ThumbnailIframe 内 iframe 关闭，卡片整体单击走 Link） */}
      {/* 仅传缩略必需字段（收窄 client props，避免 r2ObjectKey/originalFilename 进 RSC payload）。*/}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-outline-variant">
        <ThumbnailIframe
          id={entry.id}
          title={entry.title}
          archivedAt={entry.archivedAt}
        />
      </div>

      {/* 卡片元信息 */}
      <div className="flex flex-col gap-2 p-card-padding">
        <h3
          className="font-serif text-headline-sm text-on-surface line-clamp-3"
          title={entry.title}
        >
          {entry.title}
        </h3>
        <time
          dateTime={entry.archivedAt}
          title={absoluteTime(entry.archivedAt)}
          className="font-sans text-caption text-on-surface-variant"
        >
          {relativeTime(entry.archivedAt)}
        </time>
      </div>
    </Link>
  );
}
