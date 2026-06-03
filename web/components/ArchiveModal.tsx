"use client";

import { useEffect, useRef, useState } from "react";
import { extractTitle } from "@/lib/entry/extract-title";
import { COPY } from "@/lib/voice";

interface Props {
  file: File;
  onConfirm: (title: string, htmlContent: string) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * ArchiveModal · 归档预览 + 编辑标题 + 确认（FR-2 / FR-3）。
 * - file.text()（UTF-8）读内容 + extractTitle 预填标题（初始也夹到 200）；200 字符上限 + 实时计数。
 * - Esc 关闭、Enter 确认、点遮罩关闭（归档中禁用）。
 * - 提交经 onConfirm(promise)；pending → 按钮 disabled + 「上传中……」（无 spinner，AC7）；
 *   失败 → 显示错误 + 按钮变「重试」（AC9）。
 * 文案全取自 lib/voice.ts（voice 铁律：禁内联硬编码）。
 */
export function ArchiveModal({ file, onConfirm, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [reading, setReading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 读文件内容 + 预填标题。ignore 旗标：换文件时旧 promise 迟到回写不会串档（Codex P2）。
  useEffect(() => {
    let ignore = false;
    file
      .text()
      .then((text) => {
        if (ignore) return;
        setHtmlContent(text);
        setTitle(extractTitle(text, file.name).slice(0, 200)); // 初始标题夹到 200，避免超限仍可提交
        setReading(false);
      })
      .catch(() => {
        if (ignore) return;
        setError(COPY.archive.errRead);
        setReading(false);
      });
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [file]);

  // Esc 关闭（归档中禁用）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, submitting]);

  async function handleConfirm() {
    const trimmed = title.trim();
    // 读取中 / 提交中阻断；允许空 HTML（0 字节文件可归档，不静默卡死）。
    if (!trimmed || reading || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed, htmlContent);
      // 成功路径由上层 setFile(null) 卸载本组件 + 路由跳转；此处保持 submitting 直至卸载。
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.archive.errGeneric);
      setSubmitting(false);
    }
  }

  const confirmLabel = submitting
    ? COPY.archive.uploading
    : error
      ? COPY.archive.retry
      : COPY.archive.confirmCta;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-high shadow-menu">
        <div className="px-6 pb-4 pt-6">
          <h2
            id="archive-modal-title"
            className="font-serif text-headline-sm text-on-surface"
          >
            {COPY.archive.modalTitle}
          </h2>
        </div>

        <div className="space-y-5 px-6 pb-4">
          <div>
            <label
              htmlFor="entry-title"
              className="mb-2 block font-sans text-label-caps uppercase text-on-surface-variant"
            >
              {COPY.archive.titleLabel}
            </label>
            <input
              ref={inputRef}
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              disabled={submitting}
              className="w-full border-b border-outline-variant bg-transparent py-2 font-serif text-body-lg text-on-surface focus:border-primary focus:outline-none"
            />
            <div className="mt-1.5 font-mono text-mono-metadata text-on-surface-variant">
              {title.length} / 200
            </div>
          </div>

          {/* 文件元数据（只读）。归档时间由服务端写入，不在此显示客户端时间。 */}
          <div className="space-y-1 border-t border-outline-variant pt-3 font-mono text-mono-metadata text-on-surface-variant">
            <div>
              <span className="text-on-surface-variant/60">file:</span> {file.name}
            </div>
            <div>
              <span className="text-on-surface-variant/60">size:</span>{" "}
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded bg-error-container px-3 py-2 font-sans text-caption text-on-error-container"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-outline-variant px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 font-sans text-caption text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
          >
            {COPY.ui.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!title.trim() || reading || submitting}
            className="rounded bg-primary px-6 py-2 font-sans text-label-caps uppercase text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
