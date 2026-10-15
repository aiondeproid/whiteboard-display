import type { DocumentCategory } from "@/lib/types";

// display_documents ビューの列。削除済み（deleted_at あり）はビュー側で除外済み。
export const DOCUMENT_COLUMNS =
  "id, board_id, department_id, title, storage_path, visible, display_start, display_end, pinned, category, created_at, updated_at, is_new, serial_no";

// 日本時間の今日を YYYY-MM-DD で返す（編集アプリ・viewer 向け RLS と同じ基準）。
export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date()
  );
}

// 重要度ラベル。値は documents.category の CHECK 制約、表示名・色は編集アプリと揃える。
export const CATEGORIES: Record<
  DocumentCategory,
  { label: string; className: string }
> = {
  urgent: {
    label: "緊急",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  notice: {
    label: "周知",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  routine: {
    label: "定期",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};
