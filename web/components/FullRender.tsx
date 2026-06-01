import type { Entry } from "@/lib/entry/types";

interface Props {
  entry: Entry;
}

/**
 * 占位空壳（Server Component）。
 * 平移自原型 FullRender（剔除 'use client' / allEntries / onDeleteUserEntry）。
 * sandboxed iframe（sandbox=""）+ Top Chrome 在 Story 2.3 接入；上一/下一导航在 Story 3.4。
 */
export function FullRender({ entry }: Props) {
  return (
    <main data-entry-id={entry.id} aria-label={`${entry.title} 完整渲染`}>
      {/* TODO(Story 2.3): <FullRenderTopChrome /> + <iframe sandbox="" /> */}
    </main>
  );
}
