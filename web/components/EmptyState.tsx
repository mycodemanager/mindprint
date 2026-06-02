import { COPY } from "@/lib/voice";

/**
 * 空态（Server Component）。时间线无 Entry 时的首页主屏，也用于 Full Render 渲染失败兜底。
 *
 * 视觉规格（DESIGN.md Empty State + Don'ts）：居中纵向 —— mono 小标签 → 衬线大标题
 * → 衬线描述 → primary 按钮。**禁止 icon / 插图 / emoji / 渐变**：文字本身承担情绪。
 *
 * 按钮本 story 仅视觉态：归档链路（dropzone / modal）属 Epic 2，此处不接 handler。
 * 外层 <main id="main"> 由 page 提供（无需在此再包 landmark）。
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
      <button
        type="button"
        // TODO(Epic 2)：接入归档 dropzone / modal。本 story 仅视觉态。
        className="mt-2 rounded bg-primary px-5 py-2 font-sans text-label-caps uppercase text-on-primary shadow-card-rest transition hover:brightness-95"
      >
        {COPY.timeline.empty.cta}
      </button>
    </div>
  );
}
