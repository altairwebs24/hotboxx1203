import { supabase } from "@/integrations/supabase/client";
import { aiPhotos } from "./ai-images";
import { itemImage } from "./menu-images";
import { fetchItemPhotos } from "./item-photos";

export type GalleryPhoto = {
  /** Stable identifier used to remember which photo is the cover. */
  token: string;
  src: string;
  kind: "upload" | "built-in";
  label: string;
  /** Row id, for uploaded photos only. */
  imageId?: string;
};

export type ItemPrefs = { cover: string | null; showBuiltIn: boolean };

export const ITEM_PREFS_PREFIX = "item_photos.";
export const DEFAULT_PREFS: ItemPrefs = { cover: null, showBuiltIn: true };

export function parsePrefs(value?: string | null): ItemPrefs {
  if (!value) return DEFAULT_PREFS;
  try {
    const raw = JSON.parse(value) as Partial<ItemPrefs>;
    return {
      cover: typeof raw.cover === "string" ? raw.cover : null,
      showBuiltIn: raw.showBuiltIn !== false,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function fetchItemPrefs(itemId: string): Promise<ItemPrefs> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", `${ITEM_PREFS_PREFIX}${itemId}`)
    .maybeSingle();
  return parsePrefs(data?.value);
}

/** Bundled studio + flyer photos available for an item, before any admin choices. */
export function builtInPhotos(slug?: string | null, sortOrder?: number | null): GalleryPhoto[] {
  const out: GalleryPhoto[] = [];
  const ai = aiPhotos(slug, sortOrder);
  if (ai) {
    out.push({ token: "ai_cover", src: ai.cover, kind: "built-in", label: "Studio photo" });
    out.push({ token: "ai_exploded", src: ai.exploded, kind: "built-in", label: "Exploded view" });
  }
  const flyer = itemImage(slug, sortOrder);
  if (flyer) out.push({ token: "flyer", src: flyer, kind: "built-in", label: "Menu flyer" });
  return out;
}

/** Full gallery the customer sees: uploads first, built-ins only while the admin keeps them on. */
export function buildGallery(
  uploads: { id: string; src: string }[],
  builtIn: GalleryPhoto[],
  prefs: ItemPrefs,
): GalleryPhoto[] {
  const uploaded: GalleryPhoto[] = uploads.map((u, i) => ({
    token: `up:${u.id}`,
    src: u.src,
    kind: "upload",
    label: `Uploaded photo ${i + 1}`,
    imageId: u.id,
  }));
  const showBuiltIn = uploaded.length === 0 || prefs.showBuiltIn;
  const all = showBuiltIn ? [...uploaded, ...builtIn] : uploaded;
  if (!prefs.cover) return all;
  const idx = all.findIndex((p) => p.token === prefs.cover);
  if (idx <= 0) return all;
  return [all[idx]!, ...all.slice(0, idx), ...all.slice(idx + 1)];
}

/** Single cover image for menu cards and the home page. */
export async function fetchItemGallery(
  itemId: string,
  slug?: string | null,
  sortOrder?: number | null,
): Promise<GalleryPhoto[]> {
  const [uploads, prefs] = await Promise.all([fetchItemPhotos(itemId), fetchItemPrefs(itemId)]);
  return buildGallery(uploads, builtInPhotos(slug, sortOrder), prefs);
}

export type CoverInfo = { uploadSrc?: string; cover: string | null };

/** One batched lookup of covers for every item (uploads + saved admin choices). */
export async function fetchCoverMap(): Promise<Record<string, CoverInfo>> {
  const [imgs, prefs] = await Promise.all([
    supabase.from("menu_item_images").select("id, menu_item_id, url, sort_order").order("sort_order"),
    supabase.from("settings").select("key, value").like("key", `${ITEM_PREFS_PREFIX}%`),
  ]);
  const rows = imgs.data ?? [];
  const { resolvePhotoUrls } = await import("./item-photos");
  const urls = rows.length > 0 ? await resolvePhotoUrls(rows.map((r) => r.url)) : {};

  const out: Record<string, CoverInfo> = {};
  for (const p of prefs.data ?? []) {
    out[p.key.slice(ITEM_PREFS_PREFIX.length)] = { cover: parsePrefs(p.value).cover };
  }
  for (const r of rows) {
    const src = urls[r.url];
    if (!src) continue;
    const info = (out[r.menu_item_id] ??= { cover: null });
    if (info.cover === `up:${r.id}` || (!info.uploadSrc && !info.cover)) info.uploadSrc = src;
  }
  return out;
}

/** Resolves the single image to show on a menu card. */
export function coverSrc(
  info: CoverInfo | undefined,
  slug?: string | null,
  sortOrder?: number | null,
): string | null {
  const builtIn = builtInPhotos(slug, sortOrder);
  if (info?.cover) {
    const picked = builtIn.find((b) => b.token === info.cover);
    if (picked) return picked.src;
  }
  return info?.uploadSrc ?? builtIn[0]?.src ?? null;
}
