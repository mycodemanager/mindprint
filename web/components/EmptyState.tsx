import { COPY } from "@/lib/voice";
import { ArchiveCtaButton } from "@/components/ArchiveCtaButton";

/**
 * 空态（Server Component）。时间线无 Entry 时的首页主屏，也用于 Full Render 渲染失败兜底。
 *
 * 视觉规格（DESIGN.md Empty State + Don'ts）：居中纵向 —— mono 小标签 → 衬线大标题
 * → 衬线描述 → primary 按钮。**禁止 icon / 插图 / emoji / 渐变**：文字本身承担情绪。
 *
 * CTA「归档第一份」经 <ArchiveCtaButton>（client）触发 ArchiveFlow 的文件选择器（Story 2.2 接入）。
 * 外层 <main id="main"> 与 <ArchiveFlow> 由 page 提供。
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-mono-metadata uppercase text-on-surface-variant">
        empty archive
      </p>
      <h1 className="font-serif text-display-lg text-on-surface">
        {COPY.timeline.empty.headline}
      </h1>
      <p className="font-serif text-body-lg text-on-surface-variant">
        {COPY.timeline.empty.desc}
      </p>
      <ArchiveCtaButton>{COPY.timeline.empty.cta}</ArchiveCtaButton>
    </div>
  );
}
