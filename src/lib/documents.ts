import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DOCUMENT_COLUMNS, todayInTokyo } from "@/lib/display";
import type { Department, DepartmentWithDocuments, Document } from "@/lib/types";

const BOARD_ID = process.env.DISPLAY_BOARD_ID;

// 表示中の資料を部署ごとにまとめて返す（資料の無い部署は除く）。一覧とスライドショーで共通。
export async function getDepartmentsWithDocuments(): Promise<{
  boardName: string;
  departments: DepartmentWithDocuments[];
}> {
  if (!BOARD_ID) {
    throw new Error("Missing DISPLAY_BOARD_ID env var");
  }

  // service role は RLS をバイパスするので、viewer 向け RLS と同じ条件（表示中・期間内）をここで絞り込む。
  const today = todayInTokyo();

  const [{ data: board, error: boardError }, { data: departments, error: departmentsError }, { data: documents, error: documentsError }] =
    await Promise.all([
      supabaseAdmin.from("boards").select("name").eq("id", BOARD_ID).single(),
      supabaseAdmin
        .from("departments")
        .select("id, slug, name, sort_order")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("display_documents")
        .select(DOCUMENT_COLUMNS)
        .eq("board_id", BOARD_ID)
        .eq("visible", true)
        .or(`display_start.is.null,display_start.lte.${today}`)
        .or(`display_end.is.null,display_end.gte.${today}`)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<Document[]>(),
    ]);

  if (boardError) throw boardError;
  if (departmentsError) throw departmentsError;
  if (documentsError) throw documentsError;

  const documentsByDepartment = new Map<string, Document[]>();
  for (const doc of documents ?? []) {
    const list = documentsByDepartment.get(doc.department_id) ?? [];
    list.push(doc);
    documentsByDepartment.set(doc.department_id, list);
  }

  const grouped = ((departments ?? []) as Department[])
    .map((department) => ({
      ...department,
      documents: documentsByDepartment.get(department.id) ?? [],
    }))
    .filter((department) => department.documents.length > 0);

  return { boardName: board?.name ?? "掲示板", departments: grouped };
}
