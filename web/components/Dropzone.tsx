"use client";

interface Props {
  onFile: (file: File) => void;
}

/**
 * 占位空壳（'use client'，原型无此组件，本 Story 新建）。
 * 全屏 window drag listener + 拖拽 overlay + 文件类型/大小三层校验在 Story 2.2 接入；
 * 移动端退化为系统文件选择器在 Story 3.5 接入。当前仅保留隐藏 file input 接口。
 */
export function Dropzone({ onFile }: Props) {
  return (
    <input
      type="file"
      accept=".html,.htm"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
      }}
    />
  );
}
