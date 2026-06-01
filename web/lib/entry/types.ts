// V1 单一 Entry 类型 + 契约类型
// 平移自 prototype/pwa-explore/lib/mock-entries.ts —— 剔除 MockEntry/UserEntry/AnyEntry 二元性，
// 收敛为单一 Entry（服务端持久化由 Drizzle 接入，Story 1.2）。

/** 排序方向：desc = 最新在前，asc = 最早在前 */
export type SortDirection = "desc" | "asc";

/**
 * Entry · MindPrint 核心领域对象（V1 单用户）。
 *
 * 注：archivedAt / createdAt 为 ISO 8601 字符串。DB 边界（lib/db/queries.ts，Story 1.2）
 * 负责把 Drizzle 的 timestamptz(Date) 序列化为 ISO string，以保持下方纯函数与组件契约稳定。
 */
export interface Entry {
  id: string;
  title: string;
  archivedAt: string;
  originalFilename: string;
  sizeBytes: number;
  r2ObjectKey: string;
  createdAt: string;
}

/** 按月份分组结果 · 用于月份分隔条 */
export interface EntryGroup<T> {
  yearMonth: string; // "2026-05"
  label: string; // "2026 年 5 月"
  entries: T[];
}

// ===== Server Action 返回契约（逐字采用 architecture 强制约束）=====

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export interface ActionError {
  code: ActionErrorCode;
  message: string; // 用户可见的中文消息
  field?: string; // 可选：字段级错误（表单 inline 显示用）
}

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_TITLE_LENGTH"
  | "ENTRY_NOT_FOUND"
  | "UPLOAD_FAILED"
  | "DB_ERROR"
  | "EMAIL_NOT_ALLOWED"
  | "INTERNAL_ERROR";
