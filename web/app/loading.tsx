// 时间线 cold-load skeleton（Server Component · app/page.tsx 的 Suspense fallback）。
// header 占位（wordmark + 归档按钮位）+ 4-6 张 surface-container-low 占位卡（aspect 4:3 缩略区）。
// layout（容器 max-width / margin / grid 类 / 卡片圆角）与 Timeline + 卡片网格（Story 3.2）一致 → skeleton→真实无明显抖动。
// 克制原则：不显示 spinner 圈 / 百分比（implementation-patterns#loading）。reduced-motion 下 animate-pulse 由 globals.css 全局压平。
//
// ⚠️ 漂移防护：下方 grid 类与卡片占位结构须与 Timeline（components/Timeline.tsx）+ EntryCard（Story 3.2）保持一致；
//    若 3.2 / 3.5 调整列数或断点，请同步本文件，否则 cold-load 抖动回归。

const PLACEHOLDER_CARDS = [...Array(6).keys()]; // [0,1,2,3,4,5]

export default function Loading() {
  return (
    <>
      {/* header 占位：与 Timeline header 同容器布局 */}
      <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-margin-mobile py-5 sm:px-margin-desktop">
          <span className="font-serif text-headline-md text-on-surface">
            MindPrint
          </span>
          <span className="h-9 w-20 rounded bg-surface-container-high" />
        </div>
      </header>

      {/* 卡片网格占位：grid 类与 Timeline 网格（Story 3.2）一致；fake 卡不读屏 */}
      <main
        id="main"
        className="mx-auto w-full max-w-[1600px] px-margin-mobile pb-24 pt-editorial-gap sm:px-margin-desktop"
      >
        <div
          aria-hidden="true"
          className="grid grid-cols-1 gap-card-gap md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {PLACEHOLDER_CARDS.map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low"
            >
              {/* 缩略区占位：aspect 4:3，比卡片底色深一档 */}
              <div className="aspect-[4/3] bg-surface-container" />
              {/* 标题 + 时间占位条 */}
              <div className="flex flex-col gap-2 p-card-padding">
                <div className="h-4 w-3/4 rounded-sm bg-surface-container" />
                <div className="h-3 w-1/3 rounded-sm bg-surface-container" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
