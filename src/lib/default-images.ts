import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolvePhotoUrls } from "@/lib/item-photos";

/** Settings key prefix marking a menu item whose printed-flyer default photo is hidden. */
export const NO_DEFAULT_PREFIX = "no_default_image.";

export async function fetchHiddenDefaults(): Promise<string[]> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .like("key", `${NO_DEFAULT_PREFIX}%`);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((r) => r.value === "1")
    .map((r) => r.key.slice(NO_DEFAULT_PREFIX.length));
}

export function useHiddenDefaults(): Set<string> {
  const q = useQuery({ queryKey: ["hidden-default-images"], queryFn: fetchHiddenDefaults });
  return new Set(q.data ?? []);
}

/** First (cover) uploaded photo for every menu item, keyed by menu item id. */
export async function fetchCovers(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("menu_item_images")
    .select("menu_item_id, url, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  const firsts: Record<string, string> = {};
  for (const row of data ?? []) {
    if (!firsts[row.menu_item_id]) firsts[row.menu_item_id] = row.url;
  }
  const urls = await resolvePhotoUrls(Object.values(firsts));
  const out: Record<string, string> = {};
  for (const [id, path] of Object.entries(firsts)) {
    const src = urls[path];
    if (src) out[id] = src;
  }
  return out;
}

export function useCovers(): Record<string, string> {
  const q = useQuery({ queryKey: ["menu-covers"], queryFn: fetchCovers });
  return q.data ?? {};
}
