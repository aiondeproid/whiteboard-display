"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import type { PageCallback } from "react-pdf/dist/shared/types.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";

type PdfViewerProps = {
  fileUrl: string;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function touchDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>();
  const [pageAspectRatio, setPageAspectRatio] = useState<number>();
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(scale);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width && height) setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Two-finger pinch zoom for touch panel displays. `touch-action: pan-x
  // pan-y` on the container (below) stops the browser's own page-zoom
  // gesture from firing at the same time, so this is the only zoom path
  // for touch input.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let pinchStartDistance = 0;
    let pinchStartScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDistance = touchDistance(e.touches);
        pinchStartScale = scaleRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistance > 0) {
        e.preventDefault();
        const ratio = touchDistance(e.touches) / pinchStartDistance;
        setScale(clampScale(+(pinchStartScale * ratio).toFixed(2)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDistance = 0;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    el.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  // scale=1 fits the whole page inside the container (one page per screen);
  // the manual zoom controls then multiply on top of that fit width.
  const fitWidth =
    containerSize && pageAspectRatio
      ? Math.min(
          containerSize.width,
          containerSize.height * pageAspectRatio,
        )
      : undefined;

  return (
    <div className="flex h-full flex-col">
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        style={{ touchAction: "pan-x pan-y" }}
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
            width={fitWidth ? fitWidth * scale : undefined}
            onLoadSuccess={(page: PageCallback) =>
              setPageAspectRatio(page.originalWidth / page.originalHeight)
            }
          />
        </Document>
      </div>

      <div className="mt-4 shrink-0 flex flex-wrap items-center justify-center gap-4">
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
