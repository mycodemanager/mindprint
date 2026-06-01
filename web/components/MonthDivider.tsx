interface Props {
  label: string; // "2026 年 5 月"
  count: number; // 该月份的 Entry 数
}

/**
 * 占位空壳（Server Component）。
 * display-lg 衬线大字 + 1px dust 横线 + sr-only 计数在 Story 3.2 接入。
 */
export function MonthDivider({ label, count }: Props) {
  return <h2 aria-label={`${label}，${count} 份 Entry`}>{label}</h2>;
}
