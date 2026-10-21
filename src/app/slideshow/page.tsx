import SlideshowLoader from "@/components/SlideshowLoader";

export const metadata = {
  title: "スライドショー | 社内掲示板",
};

export default function SlideshowPage() {
  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-black">
      <SlideshowLoader />
    </div>
  );
}
