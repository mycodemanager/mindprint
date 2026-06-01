import type { SortDirection } from "./types";

/**
 * 按 ISO 时间排序：desc = 倒序（最新在前），asc = 正序（最早在前）。
 * 平移自 prototype/pwa-explore/lib/mock-entries.ts —— 行为不变。
 */
export function sortEntries<T extends { archivedAt: string }>(
  entries: T[],
  direction: SortDirection,
): T[] {
  return [...entries].sort((a, b) => {
    const ta = new Date(a.archivedAt).getTime();
    const tb = new Date(b.archivedAt).getTime();
    return direction === "desc" ? tb - ta : ta - tb;
  });
}
