import { notFound } from "next/navigation";
import { requireAlex } from "@/lib/auth/require-alex";
import { getEntryById } from "@/lib/db/queries";
import { FullRender } from "@/components/FullRender";

/**
 * Full Render 视图 · 动态路由（Server Component · FR-5）。
 * - requireAlex() 首行：防御纵深（NFR-2）。未登录通常已被 proxy 302 到 signin；
 *   present-but-invalid cookie 过 proxy 乐观校验后在此抛 UNAUTHORIZED → error.tsx（无数据泄露）。
 * - getEntryById null（含非法 UUID）→ notFound()。
 */
export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAlex();

  const { id } = await params;
  const entry = await getEntryById(id);
  if (!entry) notFound();

  return <FullRender entry={entry} />;
}
