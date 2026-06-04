interface Props {
  label: string; // "2026 年 5 月"
  count: number; // 该月份的 Entry 数
}

/**
 * MonthDivider（Server Component）—— 月份分隔条，时间线的"目录骨架"。
 *
 * - 左对齐月份大字（headline-md）+ 延伸到右边缘的 1px dust 横线。
 * - count 收进 h2 内 sr-only 后缀（视觉不显示数字）：h2 单次宣告「{月份}，{N} 份 Entry」，
 *   不与外层 section 重复命名（Codex review P3）。
 * - 不可交互、不可折叠（PRD D11）。
 * - 上下 editorial-gap 由 Timeline 的 <section>（pt-editorial-gap first:pt-0）控制，本组件只留 pb-6
 *   作分隔条→网格的间距（Codex review P2：first:pt-0 不能放本组件，否则每月都是 section 首子 → 全部 pt-0）。
 */
export function MonthDivider({ label, count }: Props) {
  return (
    <div className="flex items-baseline gap-6 pb-6">
      <h2 className="flex-none font-serif text-headline-md text-on-surface">
        {label}
        <span className="sr-only">，{count} 份 Entry</span>
      </h2>
      <div className="h-px flex-1 bg-outline-variant" aria-hidden="true" />
    </div>
  );
}
