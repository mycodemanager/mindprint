// MindPrint Voice 字典 —— 全站 microcopy 单一来源。
// ≥12 条逐字取自 EXPERIENCE.md「Voice and Tone」，不在此处增删字、改标点；
// 另含少量 surface CTA（如空态「归档第一份」）取自 epic/story 规格，已标注。
//
// Voice 铁律（EXPERIENCE.md）：
//   · 陈述、克制，把 alex 当主角；不寒暄、不煽情、不预测下一步。
//   · 句号收束，**无 emoji / 无感叹号**；数字优先；不堆副词。
//   · 例外（safety affordance）：删除相关文案必须含「无法恢复」明示。
//
// 后续 story（归档 / 删除 / 渲染 / 加载）从此字典取词，禁止内联硬编码文案。

export const COPY = {
  timeline: {
    empty: {
      headline: "还没有 Entry。",
      desc: "从这里开始。",
      cta: "归档第一份", // 空态主按钮（epic/story 规格；归档逻辑属 Epic 2）
    },
  },
  archive: {
    uploading: "上传中……",
    failed: "上传失败。请重试。",
    success: "已归档。",
    successDetail: "已归档。原文件在档案库中。",
    // Story 2.2 增补（归档链路 UI）。遵守 voice 铁律：陈述、句号收束、无 emoji / 无感叹号。
    dropOverlay: "放下以归档。",
    modalTitle: "归档新 Entry",
    titleLabel: "标题",
    confirmCta: "确认归档",
    retry: "重试",
    errInvalidType: "只支持 .html 或 .htm 文件。",
    errTooLarge: "文件超过 10MB。",
    errMultiple: "一次归档一个文件。",
    errTitle: "标题需 1 到 200 字符。",
    errRead: "读取文件失败。请重试。",
    errGeneric: "归档失败。请重试。",
  },
  delete: {
    confirmTitle: "确认删除？",
    confirmBody: "删除后无法恢复。", // safety affordance：必须含「无法恢复」
    done: "已删除。原始 .html 已不在档案库中。",
  },
  render: {
    failed: "渲染未能完成。",
  },
  loading: "正在加载……",
  ui: {
    cancel: "取消",
    confirm: "确认",
    archive: "归档",
  },
} as const;
