import { supabase } from "@/integrations/supabase/client";

export const MENU_BUCKET = "menu-images";

/** Rows store either a full https URL (legacy) or a storage path in the public menu-images bucket. */
export async function resolvePhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const p of paths) {
    if (/^https?:\/\//.test(p)) out[p] = p;
    else out[p] = supabase.storage.from(MENU_BUCKET).getPublicUrl(p).data.publicUrl;
  }
  return out;
}

export type ItemPhotoRow = { id: string; menu_item_id: string; url: string; sort_order: number };

export async function fetchItemPhotos(menuItemId: string): Promise<{ id: string; src: string; path: string }[]> {
  const { data, error } = await supabase
    .from("menu_item_images")
    .select("id, menu_item_id, url, sort_order")
    .eq("menu_item_id", menuItemId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ItemPhotoRow[];
  const map = await resolvePhotoUrls(rows.map((r) => r.url));
  return rows
    .map((r) => ({ id: r.id, src: map[r.url] ?? "", path: r.url }))
    .filter((r) => r.src !== "");
}
