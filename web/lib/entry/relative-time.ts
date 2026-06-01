/**
 * 相对时间格式：刚刚 / 3 分钟前 / 2 天前 / 2 周前 / 2 个月前。
 * 平移自 prototype/pwa-explore/lib/mock-entries.ts —— 行为不变。
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "刚刚";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} 天前`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400 / 7)} 周前`;
  if (diffSec < 86400 * 365) return `${Math.floor(diffSec / 86400 / 30)} 个月前`;
  return `${Math.floor(diffSec / 86400 / 365)} 年前`;
}
