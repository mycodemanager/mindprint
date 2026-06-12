"use client";

import { useEffect, useRef, useState } from "react";
import type { Entry } from "@/lib/entry/types";
import { absoluteTime } from "@/lib/entry/absolute-time";

// 仅接收缩略必需字段（Client Component props 会进 RSC flight payload → 浏览器）。
// 收窄到 id/title/archivedAt，避免把 r2ObjectKey（含 userId/entryId 路径）、originalFilename 等
// 服务端/非缩略元数据泄漏到客户端（Codex review P2）。
type Props = Pick<Entry, "id" | "title" | "archivedAt">;

/**
 * 缩略预览 iframe（'use client' —— IntersectionObserver 是浏览器 API）。
 *
 * - 视口外：surface-container 占位（不挂载 iframe）；进入视口（rootMargin 200px）→ 一次性 disconnect。
 * - **探活 gate**：iframe 无法观测 HTTP 状态（sandbox opaque + 404/401 空响应不触发 onError），
 *   故进入视口后先 fetch 一次读响应头（取到即 cancel body，不下载完整 HTML）：res.ok 才挂 iframe，
 *   否则退化兜底（Codex review P2 —— 否则 404/401 时只见空缩略区）。
 * - iframe 用 **src=/api/entry/[id]/html（非 srcDoc）**：仅可见卡发请求，首屏 payload 不含 Entry HTML。
 *   sandbox="allow-scripts"（opaque，无 allow-same-origin → 隔离宿主；允许脚本以渲染 JS 原型，Story 3.6）；
 *   同源 src/探活请求自动带会话 cookie → route requireAlex 通过。
 * - 失败 → 退化「标题 + 时间」占位（**禁文本摘要**，FR-4）。每卡独立实例 → 失败隔离（NFR-3）。
 */
export function ThumbnailIframe({ id, title, archivedAt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [status, setStatus] = useState<"pending" | "ok" | "failed">("pending");

  // 视口懒挂载：进入视口（200px）→ inView，命中即 disconnect（一次性，不重复观测）。
  useEffect(() => {
    if (inView) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  // 进入视口后探活：读状态决定挂 iframe 还是兜底。读到响应头即 cancel body（不下载完整 HTML）。
  // 权衡：OK 时多一次轻量请求（探活 + iframe 各一），V1 ≤ 50 卡 + 懒挂载可接受，换取兜底真实可达。
  useEffect(() => {
    if (!inView) return;
    let alive = true;
    const controller = new AbortController();
    fetch(`/api/entry/${id}/html`, { signal: controller.signal })
      .then((res) => {
        res.body?.cancel();
        if (alive) setStatus(res.ok ? "ok" : "failed");
      })
      .catch(() => {
        if (alive) setStatus("failed");
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [inView, id]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-surface-container">
      {status === "failed" ? (
        // 缩略失败兜底：标题 + 绝对时间（确定性，无 Date.now → 无水合隐患）。禁退化到文本摘要。
        <div className="flex h-full flex-col justify-end gap-1 p-card-padding">
          <h4 className="font-serif text-headline-sm text-on-surface line-clamp-2">
            {title}
          </h4>
          <span className="font-mono text-mono-metadata text-on-surface-variant">
            {absoluteTime(archivedAt)}
          </span>
        </div>
      ) : inView && status === "ok" ? (
        <iframe
          src={`/api/entry/${id}/html`}
          sandbox="allow-scripts"
          loading="lazy"
          title={`${title} 内容缩略`}
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setStatus("failed")}
          className="pointer-events-none absolute inset-0 origin-top-left"
          style={{
            width: "250%",
            height: "250%",
            transform: "scale(0.4)",
            border: "none",
          }}
        />
      ) : null}
    </div>
  );
}
