"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// PowerPoint のスライドショーのような全画面表示。
// 表示中は要素をウィンドウいっぱいに広げ（呼び出し側で fixed inset-0 などを当てる）、
// さらにブラウザの本当の全画面も要求する。要求が拒否される環境（iPhone の Safari、
// ユーザー操作以外からの呼び出し、キオスクのポリシーなど）でもウィンドウいっぱいの表示は効く。
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Esc などでブラウザの全画面が解除されたら、こちらの表示も戻す。
    const handleChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    // ブラウザの全画面にならなかった場合の Esc。
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const enter = useCallback(() => {
    setIsFullscreen(true);
    if (document.fullscreenEnabled) {
      ref.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  const exit = useCallback(() => {
    setIsFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  return { ref, isFullscreen, enter, exit };
}
