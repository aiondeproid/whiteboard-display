"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "@/lib/pdf-worker";

type PdfThumbnailProps = {
  fileUrl: string;
};

export default function PdfThumbnail({ fileUrl }: PdfThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
    >
      <Document
        file={fileUrl}
        loading={<div className="h-full w-full animate-pulse" />}
        error={
          <div className="px-2 text-center text-xs text-zinc-400">
            プレビュー不可
          </div>
        }
        noData={null}
      >
        {containerWidth ? (
          <Page
            pageNumber={1}
            width={containerWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={null}
          />
        ) : null}
      </Document>
    </div>
  );
}
