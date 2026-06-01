import type { Entry } from "@/lib/entry/types";

interface Props {
  entry: Entry;
}

/**
 * 占位空壳（Server Component）。
 * 缩略预览（ThumbnailIframe）+ 标题 + 相对时间 + hover 视觉在 Story 3.2 接入。
 */
export function EntryCard({ entry }: Props) {
  return <article data-entry-id={entry.id}>{entry.title}</article>;
}
