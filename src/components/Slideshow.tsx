"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import type { PageCallback } from "react-pdf/dist/shared/types.js";
import { getNextSlide } from "@/app/slideshow/actions";
import { CATEGORIES } from "@/lib/display";
import type { Slide } from "@/lib/types";
import "@/lib/pdf-worker";

// 1資料あたりの表示時間。複数ページの資料はこの時間をページ数で等分してめくる。
const SLIDE_MS = 10 * 60 * 1000;
// 資料が無い・取得に失敗したときに取り直すまでの間隔。
const RETRY_MS = 60 * 1000;
// PDF が開けなかった資料は10分待たずに次へ送る。
const PDF_ERROR_SKIP_MS = 10 * 1000;

type Status = "loading" | "ready" | "empty" | "error";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function Slideshow() {
  const [slide, setSlide] = useState<Slide | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [startedAt, setStartedAt] = useState(0);
  // この時刻を過ぎたら次の資料へ進む（失敗時は再試行の時刻）。0 なので最初の1秒後の tick で開始する。
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [numPages, setNumPages] = useState<number>();
  const [pageAspectRatio, setPageAspectRatio] = useState<number>();
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const advancingRef = useRef(false);
  // 1秒ごとの tick から最新の値を読むための ref（state と同時に更新する）。
  const deadlineRef = useRef(0);
  const slideIdRef = useRef<string | null>(null);

  const scheduleAt = useCallback((time: number) => {
    deadlineRef.current = time;
    setDeadline(time);
  }, []);

  const advance = useCallback(async (afterId: string | null) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      const next = await getNextSlide(afterId);
      const fetchedAt = Date.now();
      setNow(fetchedAt);
      slideIdRef.current = next?.id ?? null;
      if (next) {
        setSlide(next);
        setNumPages(undefined);
        setStatus("ready");
        setStartedAt(fetchedAt);
        scheduleAt(fetchedAt + SLIDE_MS);
      } else {
        setSlide(null);
        setStatus("empty");
        scheduleAt(fetchedAt + RETRY_MS);
      }
    } catch {
      // 表示中の資料があればそのまま出し続け、少し待って取り直す。
      const failedAt = Date.now();
      setNow(failedAt);
      setStatus((current) => (current === "ready" ? current : "error"));
      scheduleAt(failedAt + RETRY_MS);
    } finally {
      advancingRef.current = false;
    }
  }, [scheduleAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= deadlineRef.current) void advance(slideIdRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, [advance]);

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

  const elapsed = Math.max(0, now - startedAt);
  const pageNumber = numPages
    ? Math.min(numPages, Math.floor(elapsed / (SLIDE_MS / numPages)) + 1)
    : 1;
  const remaining = deadline - now;

  // ページ全体が画面に収まる幅（PdfViewer の scale=1 と同じ考え方）。
  const fitWidth =
    containerSize && pageAspectRatio
      ? Math.min(containerSize.width, containerSize.height * pageAspectRatio)
      : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {slide ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{slide.departmentName}</span>
                {slide.category && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORIES[slide.category].className}`}
                  >
                    {CATEGORIES[slide.category].label}
                  </span>
                )}
                {slide.is_new && (
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    NEW
                  </span>
                )}
              </div>
              <h1 className="mt-1 truncate text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {slide.title}
              </h1>
            </>
          ) : (
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              スライドショー
            </h1>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          {slide && status === "ready" && (
            <>
              <span>
                資料 {slide.position} / {slide.total}
              </span>
              {numPages && numPages > 1 && (
                <span>
                  ページ {pageNumber} / {numPages}
                </span>
              )}
              <span className="tabular-nums">次まで {formatRemaining(remaining)}</span>
              <button
                type="button"
                onClick={() => void advance(slide.id)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
              >
                次へ
              </button>
            </>
          )}
          <Link
            href="/"
            className="rounded-md bg-zinc-900 px-4 py-1.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            ■ スライドショー停止
          </Link>
        </div>
      </header>

      <div
        ref={containerRef}
        className="mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {status === "loading" && <p className="text-zinc-500">読み込み中...</p>}
        {status === "empty" && (
          <p className="text-zinc-500 dark:text-zinc-400">
            表示できる資料がありません。資料が掲示されると自動で始まります。
          </p>
        )}
        {status === "error" && (
          <p className="text-red-500">
            資料を取得できませんでした。しばらくすると再試行します。
          </p>
        )}
        {status === "ready" && slide && (
          <Document
            key={slide.id}
            file={slide.url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() =>
              scheduleAt(Math.min(deadlineRef.current, Date.now() + PDF_ERROR_SKIP_MS))
            }
            loading={<div className="p-10 text-center text-zinc-500">読み込み中...</div>}
            error={
              <div className="p-10 text-center text-red-500">
                PDFを読み込めませんでした（まもなく次の資料へ進みます）
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={fitWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={(page: PageCallback) =>
                setPageAspectRatio(page.originalWidth / page.originalHeight)
              }
            />
          </Document>
        )}
      </div>

      {status === "ready" && (
        <div className="mt-3 h-1 shrink-0 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-500 transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.min(100, (elapsed / SLIDE_MS) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
