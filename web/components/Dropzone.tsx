"use client";

import { useEffect, useState } from "react";
import { COPY } from "@/lib/voice";

interface Props {
  /** 拖入的文件交给上层统一校验（ArchiveFlow）。drop 与 CTA 选择走同一校验。 */
  onFiles: (files: FileList | null) => void;
}

/**
 * 全屏拖拽监听 + 悬停 overlay（'use client'，UX-DR12）。
 * 仅负责「拖拽 UI + 上报文件」；三层校验 / 错误横幅 / 文件选择器由 ArchiveFlow 统一持有。
 */
export function Dropzone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let depth = 0; // 子元素进出会多次触发 enter/leave，用计数判定真正离开视口
    function onEnter(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
      depth++;
      setDragging(true);
    }
    function onOver(e: DragEvent) {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault(); // 必须，否则 drop 不触发
    }
    function onLeave(e: DragEvent) {
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      onFiles(e.dataTransfer?.files ?? null);
    }
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFiles]);

  if (!dragging) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-40 flex items-center justify-center border-2 border-primary bg-surface-container-high/90"
    >
      <p className="font-serif text-headline-md text-on-surface">
        {COPY.archive.dropOverlay}
      </p>
    </div>
  );
}
