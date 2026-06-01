import type { Entry, SortDirection } from "@/lib/entry/types";

interface Props {
  entries: Entry[];
  sort: SortDirection;
}

/**
 * 占位空壳（Server Component）。
 * 卡片网格 + 月份分组 + sticky header 在 Story 3.1 / 3.2 接入。
 * 平移自原型 Timeline（剔除 'use client' 与原型的客户端持久化 hook 依赖）。
 */
export function Timeline({ entries, sort }: Props) {
  return (
    <section data-sort={sort} aria-label="时间线">
      {/* TODO(Story 3.1/3.2): <MonthDivider /> + <EntryCard /> 网格 */}
      {entries.length} 条 Entry
    </section>
  );
}
