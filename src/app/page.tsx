import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PdfThumbnailLoader from "@/components/PdfThumbnailLoader";
import type { Department, DepartmentWithDocuments, Document } from "@/lib/types";

export const dynamic = "force-dynamic";

const BOARD_ID = process.env.DISPLAY_BOARD_ID;
const SIGNED_URL_EXPIRES_IN_SECONDS = 300;

async function getThumbnailUrls(
  documents: Document[]
): Promise<Map<string, string>> {
  if (documents.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrls(
      documents.map((doc) => doc.storage_path),
      SIGNED_URL_EXPIRES_IN_SECONDS
    );

  if (error || !data) return new Map();

  const urlsByPath = new Map<string, string>();
  for (const entry of data) {
    if (entry.signedUrl && !entry.error) {
      urlsByPath.set(entry.path ?? "", entry.signedUrl);
    }
  }

  const urlsByDocId = new Map<string, string>();
  for (const doc of documents) {
    const url = urlsByPath.get(doc.storage_path);
    if (url) urlsByDocId.set(doc.id, url);
  }
  return urlsByDocId;
}

async function getDepartmentsWithDocuments(): Promise<{
  boardName: string;
  departments: DepartmentWithDocuments[];
  thumbnailUrls: Map<string, string>;
}> {
  if (!BOARD_ID) {
    throw new Error("Missing DISPLAY_BOARD_ID env var");
  }

  const [{ data: board, error: boardError }, { data: departments, error: departmentsError }, { data: documents, error: documentsError }] =
    await Promise.all([
      supabaseAdmin.from("boards").select("name").eq("id", BOARD_ID).single(),
      supabaseAdmin
        .from("departments")
        .select("id, slug, name, sort_order")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("documents")
        .select("id, board_id, department_id, title, storage_path, visible, created_at, updated_at")
        .eq("board_id", BOARD_ID)
        .eq("visible", true)
        .order("created_at", { ascending: false }),
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

  const thumbnailUrls = await getThumbnailUrls(documents ?? []);

  return { boardName: board?.name ?? "掲示板", departments: grouped, thumbnailUrls };
}

export default async function Home() {
  const { boardName, departments, thumbnailUrls } = await getDepartmentsWithDocuments();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {boardName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          共有されている資料一覧
        </p>

        {departments.length === 0 ? (
          <p className="mt-10 text-zinc-500 dark:text-zinc-400">
            表示できる資料がまだありません。
          </p>
        ) : (
          <div className="mt-10 space-y-10">
            {departments.map((department) => (
              <section key={department.id}>
                <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  {department.name}
                </h2>
                <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {department.documents.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="flex flex-col rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-400 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                      >
                        {thumbnailUrls.has(doc.id) ? (
                          <PdfThumbnailLoader fileUrl={thumbnailUrls.get(doc.id)!} />
                        ) : (
                          <div className="aspect-[3/4] w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800" />
                        )}
                        <p className="mt-2 truncate font-medium text-zinc-900 dark:text-zinc-50">
                          {doc.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(doc.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
