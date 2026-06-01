"use client";

interface Props {
  file: File;
  onConfirm: (title: string, htmlContent: string) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * 占位空壳（'use client'）。
 * 缩略占位 + 标题 Input（预填 extractTitle）+ 200 字符上限 + 归档中状态在 Story 2.2 接入。
 */
export function ArchiveModal({ file, onConfirm, onCancel }: Props) {
  return (
    <div role="dialog" aria-label="归档" data-filename={file.name}>
      {/* TODO(Story 2.2): Upload Preview Form */}
      <button type="button" onClick={onCancel}>
        取消
      </button>
      <button type="button" onClick={() => onConfirm("", "")}>
        确认归档
      </button>
    </div>
  );
}
