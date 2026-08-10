"use client";

import dynamic from "next/dynamic";

const PdfThumbnail = dynamic(() => import("./PdfThumbnail"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[3/4] w-full animate-pulse rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800" />
  ),
});

type PdfThumbnailLoaderProps = {
  fileUrl: string;
};

export default function PdfThumbnailLoader({ fileUrl }: PdfThumbnailLoaderProps) {
  return <PdfThumbnail fileUrl={fileUrl} />;
}
