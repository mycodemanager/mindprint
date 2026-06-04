import Link from "next/link";
import type { Entry, SortDirection } from "@/lib/entry/types";
import { groupByMonth } from "@/lib/entry/group-by-month";
import { sortEntries } from "@/lib/entry/sort-entries";
import { EntryCard } from "@/components/EntryCard";
import { MonthDivider } from "@/components/MonthDivider";

interface Props {
  entries: Entry[];
  sort: SortDirection;
}

/**
 * 时间线主屏（Server Component）。sticky header（3.1）+ 按月分组的卡片网格（3.2）。
 *
 * groupByMonth(sortEntries(entries, sort))：getEntries 已 DB 排序，这里纯函数驱动分组
 * （组序 + 组内序都跟随 sort；架构数据流既定的两段式）。
 * Story 3.3 把右侧占位换真 <SortToggle>（router ?sort）+ 归档按钮（useArchiveTrigger）。
 * Story 3.5：4 断点响应式精调 + 移动端退化。
 */
export function Timeline({ entries, sort }: Props) {
  const groups = groupByMonth(sortEntries(entries, sort));

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-margin-mobile py-5 sm:px-margin-desktop">
          {/* wordmark：单击回时间线（IA）；<Link href="/"> 不带 query → 自然回默认 desc。*/}
          <Link
            href="/"
            className="font-serif text-headline-md text-on-surface"
          >
            MindPrint
          </Link>

          {/* 占位（静态、aria-hidden）：真 SortToggle + 归档按钮属 Story 3.3。*/}
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
        {groups.map((group) => (
          // 月份间距在 section（pt-editorial-gap first:pt-0：首月不顶空，后续月份隔 64px）。
          // 不给 section 加 aria-label —— 由 MonthDivider 的 h2（含 sr-only 计数）单次宣告，避免重复。
          <section key={group.yearMonth} className="pt-editorial-gap first:pt-0">
            <MonthDivider label={group.label} count={group.entries.length} />
            <div className="grid grid-cols-1 gap-card-gap md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
