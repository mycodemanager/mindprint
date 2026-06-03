"use client";

import type { ReactNode } from "react";
import { useArchiveTrigger } from "@/components/ArchiveFlow";

/**
 * 空态「归档第一份」CTA（client）：点击 → 打开文件选择器（经 ArchiveFlow context）。
 * 视觉沿用原空态按钮类（primary 实心、label-caps 大写）。
 */
export function ArchiveCtaButton({ children }: { children: ReactNode }) {
  const { openFilePicker } = useArchiveTrigger();
  return (
    <button
      type="button"
      onClick={openFilePicker}
      className="mt-2 rounded bg-primary px-5 py-2 font-sans text-label-caps uppercase text-on-primary shadow-card-rest transition hover:brightness-95"
    >
      {children}
    </button>
  );
}
