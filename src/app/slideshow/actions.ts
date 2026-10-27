"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDepartmentsWithDocuments } from "@/lib/documents";
import type { Slide } from "@/lib/types";

// 1枚の表示時間（10分）より長くしておく。pdf.js は表示中にページ範囲を取り直すことがある。
const SIGNED_URL_EXPIRES_IN_SECONDS = 15 * 60;

// fromId の次（direction = -1 なら前）の資料を返す。末尾の次は先頭、先頭の前は末尾に回る。
// fromId が null・既に表示対象外なら、次は先頭から、前は末尾から。
// 毎回一覧を取り直すので、スライドショー中の追加・非表示・期間切れもそのまま反映される。
export async function getNextSlide(
  fromId: string | null,
  direction: 1 | -1 = 1
): Promise<Slide | null> {
  const { departments } = await getDepartmentsWithDocuments();
  const slides = departments.flatMap((department) =>
    department.documents.map((doc) => ({ doc, departmentName: department.name }))
  );
  if (slides.length === 0) return null;

  const fromIndex =
    typeof fromId === "string" ? slides.findIndex(({ doc }) => doc.id === fromId) : -1;
  const index =
    fromIndex === -1
      ? direction === 1
        ? 0
        : slides.length - 1
      : (fromIndex + direction + slides.length) % slides.length;
  const { doc, departmentName } = slides[index];

  const { data, error } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRES_IN_SECONDS);
  if (error || !data) {
    throw error ?? new Error("Failed to create signed URL");
  }

  return {
    id: doc.id,
    title: doc.title,
    departmentName,
    category: doc.category,
    is_new: doc.is_new,
    url: data.signedUrl,
    position: index + 1,
    total: slides.length,
  };
}
