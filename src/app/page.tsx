import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PdfThumbnailLoader from "@/components/PdfThumbnailLoader";
import { CATEGORIES } from "@/lib/display";
import { getDepartmentsWithDocuments } from "@/lib/documents";
import type { Document } from "@/lib/types";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  const { boardName, departments } = await getDepartmentsWithDocuments();
  const thumbnailUrls = await getThumbnailUrls(
    departments.flatMap((department) => department.documents)
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {boardName}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              共有されている資料一覧
            </p>
          </div>
          {departments.length > 0 && (
            <Link
              href="/slideshow"
              className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              ▶ スライドショー開始
            </Link>
          )}
        </div>

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
                        className={`relative flex flex-col rounded-lg border bg-white p-3 shadow-sm transition hover:shadow dark:bg-zinc-900 ${
                          doc.pinned
                            ? "border-amber-400 hover:border-amber-500 dark:border-amber-600 dark:hover:border-amber-500"
                            : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                        }`}
                      >
                        {doc.pinned && (
                          <span className="absolute right-2 top-2 z-10 text-base" aria-label="ピン留め">
                            📌
                          </span>
                        )}
                        {thumbnailUrls.has(doc.id) ? (
                          <PdfThumbnailLoader fileUrl={thumbnailUrls.get(doc.id)!} />
                        ) : (
                          <div className="aspect-[3/4] w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800" />
                        )}
                        {(doc.category || doc.is_new) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doc.category && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORIES[doc.category].className}`}
                              >
                                {CATEGORIES[doc.category].label}
                              </span>
                            )}
                            {doc.is_new && (
                              <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">
                                NEW
                              </span>
                            )}
                          </div>
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
