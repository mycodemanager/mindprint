import type { SortDirection } from "./types";
import { sortEntries } from "./sort-entries";

/** 在给定 entries 中按 id 查找（纯函数 helper）。平移自 prototype —— 行为不变。 */
export function findEntryById<T extends { id: string }>(
  entries: T[],
  id: string,
): T | undefined {
  return entries.find((e) => e.id === id);
}

/**
 * 计算上一条 / 下一条（基于给定排序方向）。
 * 平移自 prototype/pwa-explore/lib/mock-entries.ts —— 行为不变。
 */
export function getAdjacentEntries<
  T extends { id: string; archivedAt: string },
>(
  entries: T[],
  id: string,
  direction: SortDirection,
): { prev?: T; next?: T } {
  const sorted = sortEntries(entries, direction);
  const idx = sorted.findIndex((e) => e.id === id);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? sorted[idx - 1] : undefined,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : undefined,
  };
}
