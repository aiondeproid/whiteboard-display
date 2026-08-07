export type Department = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type Document = {
  id: string;
  board_id: string;
  department_id: string;
  title: string;
  storage_path: string;
  visible: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentWithDocuments = Department & {
  documents: Document[];
};
