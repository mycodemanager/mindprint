import { EmptyState } from "@/components/EmptyState";

// 首页 = 时间线主屏。当前无 Entry，故呈现空态（真正的时间线网格属 Epic 3）。
// 未登录访问 / 会被 proxy 302 到 /auth/signin（Story 1.3），此处是登录后所见。
export default function Home() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center px-margin-mobile sm:px-margin-desktop"
    >
      <EmptyState />
    </main>
  );
}
