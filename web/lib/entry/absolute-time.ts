/**
 * 绝对时间格式：2026 年 4 月 18 日。
 * 平移自 prototype/pwa-explore/lib/mock-entries.ts —— 行为不变。
 */
export function absoluteTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}
