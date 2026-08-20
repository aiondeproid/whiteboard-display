import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PdfViewerLoader from "@/components/PdfViewerLoader";

const BOARD_ID = process.env.DISPLAY_BOARD_ID;
const SIGNED_URL_EXPIRES_IN_SECONDS = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;

  const { data: doc, error } = await supabaseAdmin
    .from("documents")
    .select("id, board_id, title, storage_path, visible")
    .eq("id", id)
    .single();

  if (error || !doc || doc.board_id !== BOARD_ID || !doc.visible) {
    notFound();
  }

  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (signedUrlError || !signedUrlData) {
    throw signedUrlError ?? new Error("Failed to create signed URL");
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col px-4 py-6">
        <div className="shrink-0">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← 一覧に戻る
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {doc.title}
          </h1>
        </div>
        <div className="mt-6 min-h-0 flex-1">
          <PdfViewerLoader fileUrl={signedUrlData.signedUrl} />
        </div>
      </main>
    </div>
  );
}
