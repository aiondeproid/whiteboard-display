"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
      読み込み中...
    </div>
  ),
});

type PdfViewerLoaderProps = {
  fileUrl: string;
};

export default function PdfViewerLoader({ fileUrl }: PdfViewerLoaderProps) {
  return <PdfViewer fileUrl={fileUrl} />;
}
