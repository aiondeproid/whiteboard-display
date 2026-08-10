"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";

type PdfViewerProps = {
  fileUrl: string;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

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
    <div>
      <div
        ref={containerRef}
        className="max-h-[90vh] overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setPageNumber(1);
          }}
          loading={
            <div className="p-10 text-center text-zinc-500">読み込み中...</div>
          }
          error={
            <div className="p-10 text-center text-red-500">
              PDFを読み込めませんでした
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={containerWidth ? containerWidth * scale : undefined}
          />
        </Document>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))
            }
            disabled={scale <= MIN_SCALE}
            aria-label="縮小"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            −
          </button>
          <span className="w-14 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))
            }
            disabled={scale >= MAX_SCALE}
            aria-label="拡大"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            ＋
          </button>
          {scale !== 1 ? (
            <button
              type="button"
              onClick={() => setScale(1)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              リセット
            </button>
          ) : null}
        </div>

        {numPages ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
            >
              前へ
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {pageNumber} / {numPages}
            </span>
            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
            >
              次へ
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
