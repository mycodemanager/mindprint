import Link from "next/link";
import type { Entry, SortDirection } from "@/lib/entry/types";

interface Props {
  entries: Entry[];
  sort: SortDirection;
}

/**
 * 时间线主屏壳（Server Component）。结构平移自 prototype Timeline 的 header，裸值全换 token class。
 *
 * 本 story（3.1）：sticky header（wordmark + SortToggle/归档占位）+ 月份分组容器空壳。
 * Story 3.2：在 <main> 内填 groupByMonth(sortEntries(entries, sort)) → <MonthDivider> + <EntryCard> 网格。
 * Story 3.3：右侧占位换真 <SortToggle>（router.replace('?sort=')）+ 归档按钮（useArchiveTrigger）。
 * Story 3.5：4 断点响应式精调（margin / 列数 / 移动端 floating action）。
 */
export function Timeline({ entries, sort }: Props) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-margin-mobile py-5 sm:px-margin-desktop">
          {/* wordmark：单击回时间线（IA）；<Link href="/"> 不带 query → 自然回默认 desc（与 3.3 约定一致）。*/}
          <Link
            href="/"
            className="font-serif text-headline-md text-on-surface"
          >
            MindPrint
          </Link>

          {/* 占位（3.1 静态、aria-hidden）：真 SortToggle + 归档按钮属 Story 3.3。*/}
          <div className="flex items-center gap-3 md:gap-4" aria-hidden="true">
            <span className="font-sans text-label-caps uppercase text-on-surface-variant">
              {sort === "desc" ? "最新在前" : "最早在前"}
            </span>
            <span className="rounded bg-primary px-5 py-2 font-sans text-label-caps uppercase text-on-primary opacity-60">
              归档
            </span>
          </div>
        </div>
      </header>

      <main
        id="main"
        aria-label={`时间线，${entries.length} 份 Entry`}
        className="mx-auto w-full max-w-[1600px] px-margin-mobile pb-24 sm:px-margin-desktop"
      >
        {/* TODO(Story 3.2): groupByMonth(sortEntries(entries, sort)) → 每月 <section><MonthDivider /><div grid …>{entries.map(EntryCard)}</div></section> */}
      </main>
    </>
  );
}
