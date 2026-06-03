import Link from "next/link";
import type { Entry } from "@/lib/entry/types";
import { absoluteTime } from "@/lib/entry/absolute-time";
import { COPY } from "@/lib/voice";

interface Props {
  entry: Entry;
}

/**
 * Full Render 顶部条（基础版 · Server Component · DESIGN.md「Top Chrome」/ UX-DR15）。
 * 左：← 返回时间线 / 中：标题 + 归档时间 / 右：留空（上一·下一 → Story 3.4，⋯ 菜单 → Epic 4）。
 * 背景 surface + 1px dust 底边。文案走 voice.ts。
 */
export function FullRenderTopChrome({ entry }: Props) {
  return (
    <header
      role="banner"
      className="flex-none border-b border-outline-variant bg-surface"
    >
      <div className="flex items-center gap-3 px-4 py-3 md:gap-6 md:px-8">
        {/* 左 · 返回时间线 */}
        <Link
          href="/"
          aria-label={COPY.fullRender.backToTimeline}
          className="flex flex-none items-center gap-1.5 font-sans text-caption text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">{COPY.fullRender.backToTimeline}</span>
        </Link>

        {/* 中 · 标题 + 归档时间 */}
        <div className="min-w-0 flex-1">
          <h1
            title={entry.title}
            className="truncate font-serif text-headline-sm text-on-surface"
          >
            {entry.title}
          </h1>
          <time
            dateTime={entry.archivedAt}
            className="mt-0.5 block font-mono text-mono-metadata text-on-surface-variant"
          >
            {absoluteTime(entry.archivedAt)}
          </time>
        </div>

        {/* 右 · 留空（上一·下一 Story 3.4 / ⋯ 菜单 Epic 4） */}
      </div>
    </header>
  );
}
