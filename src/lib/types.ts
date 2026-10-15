export type Department = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type DocumentCategory = "urgent" | "notice" | "routine";

// display_documents ビュー（編集アプリ側のマイグレーションで定義）の1行。
export type Document = {
  id: string;
  board_id: string;
  department_id: string;
  title: string;
  storage_path: string;
  visible: boolean;
  display_start: string | null;
  display_end: string | null;
  pinned: boolean;
  category: DocumentCategory | null;
  created_at: string;
  updated_at: string;
  is_new: boolean;
  serial_no: number;
};

export type DepartmentWithDocuments = Department & {
  documents: Document[];
};
