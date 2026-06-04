import { requireAlex } from "@/lib/auth/require-alex";
import { getEntries } from "@/lib/db/queries";
import { ArchiveFlow } from "@/components/ArchiveFlow";
import { EmptyState } from "@/components/EmptyState";
import { Timeline } from "@/components/Timeline";
import type { SortDirection } from "@/lib/entry/types";

// 首页 = 时间线主屏（async Server Component）。
// · 第一行 requireAlex()：home 首次渲染私有数据（Entry 列表），须服务端权威鉴权（NFR-2 / deferred F3），
//   不依赖 proxy 的乐观 cookie 校验。读 cookie → 页面自动 dynamic（无需 export const dynamic）。
// · searchParams 在 Next 16 是 Promise → await；?sort 仅 'asc' 取 asc，其余一律 desc（不持久化由 URL 表达）。
// · <ArchiveFlow>（client）包住两分支：拖拽归档在 Empty / Timeline 两态都生效；归档按钮（3.3）经其 context 触发。
//   skip-link 目标 <main id="main"> 在两分支各自存在（Empty 分支此处；Timeline 分支由其内部提供）。
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAlex();

  const { sort: sortParam } = await searchParams;
  const sort: SortDirection = sortParam === "asc" ? "asc" : "desc";
  const allEntries = await getEntries(sort);

  return (
    <ArchiveFlow>
      {allEntries.length === 0 ? (
        <main
          id="main"
          className="flex flex-1 flex-col items-center justify-center px-margin-mobile sm:px-margin-desktop"
        >
          <EmptyState />
        </main>
      ) : (
        <Timeline entries={allEntries} sort={sort} />
      )}
    </ArchiveFlow>
  );
}
