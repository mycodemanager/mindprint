/**
 * 从 HTML 内容抽取 <title>；为空 / 缺失时 fallback 到去扩展名的文件名。
 * 抽取后解码常见 HTML 实体（&amp; / &lt; / 数字实体等），使标题为人类可读文本。
 * 纯函数（无 DOM API），服务端 / 客户端均可调用。承接 FR-2「自动捕获标题」。
 *
 * 注：原型不存在此函数，本 Story 新建（Epic 2 Story 2.2 的归档链路假设其已就位）。
 */
export function extractTitle(htmlContent: string, filename: string): string {
  const match = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const raw = match?.[1]?.replace(/\s+/g, " ").trim();
  if (raw) return decodeHtmlEntities(raw);
  return stripHtmlExtension(filename);
}

/** 去掉 .html / .htm 扩展名（大小写不敏感）。 */
function stripHtmlExtension(filename: string): string {
  return filename.replace(/\.html?$/i, "");
}

/**
 * 解码常见 HTML 实体（命名 + 十进制 + 十六进制）。标题作为纯文本显示（非 HTML 注入），
 * 故无需完整实体表。`&amp;` 放最后解码，避免把 `&amp;lt;` 误解成 `<`。
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** 防御非法码点（越界 → 返回空串而非抛错）。 */
function safeFromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}
