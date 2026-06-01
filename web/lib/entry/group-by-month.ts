import type { EntryGroup } from "./types";

/**
 * 按月份分组 — 用于月份分隔条。
 * 平移自 prototype/pwa-explore/lib/mock-entries.ts —— 行为不变。
 */
export function groupByMonth<T extends { archivedAt: string }>(
  entries: T[],
): EntryGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const e of entries) {
    const d = new Date(e.archivedAt);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(ym)) groups.set(ym, []);
    groups.get(ym)!.push(e);
  }
  return Array.from(groups.entries()).map(([yearMonth, groupEntries]) => {
    const [y, m] = yearMonth.split("-");
    return {
      yearMonth,
      label: `${y} 年 ${parseInt(m, 10)} 月`,
      entries: groupEntries,
    };
  });
}
