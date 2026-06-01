"use client";

import type { SortDirection } from "@/lib/entry/types";

interface Props {
  value: SortDirection;
  onChange: (next: SortDirection) => void;
}

/**
 * 占位空壳（'use client'）—— 临时 prop 契约，**勿依赖** value / onChange。
 * Story 3.3 将整体替换为 useSearchParams() + router.replace() 驱动 + aria-live 宣告。
 */
export function SortToggle({ value, onChange }: Props) {
  const next: SortDirection = value === "desc" ? "asc" : "desc";
  return (
    <button
      type="button"
      aria-pressed={value === "asc"}
      onClick={() => onChange(next)}
    >
      {value === "desc" ? "最新在前" : "最早在前"}
    </button>
  );
}
