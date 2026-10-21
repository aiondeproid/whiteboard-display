"use client";

import dynamic from "next/dynamic";

const Slideshow = dynamic(() => import("./Slideshow"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-zinc-500">
      読み込み中...
    </div>
  ),
});

export default function SlideshowLoader() {
  return <Slideshow />;
}
