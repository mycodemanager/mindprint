"use client";

import { useEffect } from "react";
import Link from "next/link";
import { COPY } from "@/lib/voice";

/**
 * Full Render 局部错误边界（'use client' —— Next 强制 error 边界为 Client Component）。
 *
 * 捕获 page / FullRender 等 Server Component 渲染期抛错（如 getEntryById 的 DB 抛错、
 * page 的 requireAlex 抛 UNAUTHORIZED）。**不**捕获 iframe 内容加载失败（opaque iframe，
 * 宿主无 onError 可观测 —— 未来 client onError 兜底）。
 *
 * 文案全走 voice.ts。「下载原文件」为 disabled 占位（Epic 4 接入下载）。
 */
export default function FullRenderError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[entry-error]", error);
  }, [error]);

  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile text-center sm:px-margin-desktop"
    >
      <h1 className="font-serif text-headline-md text-on-surface">
        {COPY.render.failed}
      </h1>
      <p className="font-serif text-body-lg text-on-surface-variant">
        {COPY.render.stillArchived}
      </p>
      <div className="mt-2 flex items-center gap-5">
        <Link
          href="/"
          className="font-sans text-caption text-primary transition-opacity hover:opacity-80"
        >
          {COPY.fullRender.backToTimeline}
        </Link>
        {/* 下载原文件 —— Epic 4 接入；本 story disabled 占位 */}
        <span
          aria-disabled="true"
          className="font-sans text-caption text-on-surface-variant opacity-40"
        >
          {COPY.fullRender.downloadOriginal}
        </span>
      </div>
    </main>
  );
}
