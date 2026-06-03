import { COPY } from "@/lib/voice";

/**
 * Full Render 加载态（Server Component · Suspense fallback · UX-DR24）。
 * surface-container-low 占位 + caption 文案；**不显示** spinner 圈 / 百分比（克制原则）。
 */
export default function Loading() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center bg-surface-container-low"
    >
      <p className="font-sans text-caption text-on-surface-variant">
        {COPY.loading}
      </p>
    </main>
  );
}
