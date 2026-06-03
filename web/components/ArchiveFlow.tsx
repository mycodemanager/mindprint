"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/Dropzone";
import { ArchiveModal } from "@/components/ArchiveModal";
import { archiveEntry } from "@/app/_actions/archive";
import { ArchiveInputSchema } from "@/lib/entry/schemas";
import { COPY } from "@/lib/voice";

const MAX_BYTES = 10 * 1024 * 1024;

interface ArchiveContextValue {
  openFilePicker: () => void;
}
const ArchiveContext = createContext<ArchiveContextValue | null>(null);

/** 空态 / 时间线的归档 CTA 用此 hook 打开文件选择器（须在 <ArchiveFlow> 子树内）。 */
export function useArchiveTrigger(): ArchiveContextValue {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchiveTrigger 必须在 <ArchiveFlow> 内使用");
  return ctx;
}

/**
 * 归档链路客户端编排器（'use client'）。
 * 持文件 / 错误态；组合全屏 Dropzone + ArchiveModal；确认 → archiveEntry → 成功跳 Full Render。
 * 经 Context 暴露 openFilePicker 给空态 CTA —— drop 与 CTA 选择走同一三层校验。
 */
export function ArchiveFlow({ children }: { children: ReactNode }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 4000);
  }, []);

  // 三层校验（drop 与文件选择共用）：单文件 / 扩展名 / 大小。
  const validateAndAccept = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (files.length > 1) return showError(COPY.archive.errMultiple);
      const f = files[0];
      if (!/\.html?$/i.test(f.name)) return showError(COPY.archive.errInvalidType);
      if (f.size > MAX_BYTES) return showError(COPY.archive.errTooLarge);
      setError(null);
      setFile(f);
    },
    [showError],
  );

  const openFilePicker = useCallback(() => inputRef.current?.click(), []);

  async function handleConfirm(title: string, htmlContent: string) {
    if (!file) return;
    const input = {
      filename: file.name,
      sizeBytes: file.size,
      htmlContent,
      titleOverride: title,
    };
    // 客户端早校验（与 server 共享同一 schema）；server 仍权威重校验。
    if (!ArchiveInputSchema.safeParse(input).success) {
      throw new Error(COPY.archive.errGeneric);
    }
    const result = await archiveEntry(input);
    if (result.ok) {
      setFile(null);
      router.push(`/entry/${result.data.id}`);
    } else {
      throw new Error(result.error.message); // 交给 ArchiveModal 显示并复位
    }
  }

  return (
    <ArchiveContext.Provider value={{ openFilePicker }}>
      {children}

      {/* 全屏拖拽监听 + overlay */}
      <Dropzone onFiles={validateAndAccept} />

      {/* CTA / drop 共用的隐藏文件选择器 */}
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm"
        hidden
        onChange={(e) => {
          validateAndAccept(e.target.files);
          e.target.value = ""; // 允许重选同一文件
        }}
      />

      {/* 拖拽校验错误横幅（~4s 自动消失） */}
      {error && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded bg-error-container px-4 py-2 font-sans text-caption text-on-error-container shadow-menu"
        >
          {error}
        </div>
      )}

      {/* 预览 + 确认 modal */}
      {file && (
        <ArchiveModal
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          onConfirm={handleConfirm}
          onCancel={() => setFile(null)}
        />
      )}
    </ArchiveContext.Provider>
  );
}
