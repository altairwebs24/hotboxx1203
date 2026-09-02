import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolvePhotoUrls } from "./item-photos";
import { deco } from "./menu-images";
import brand from "@/assets/brand-images.json";

const heroAsset = { url: brand["hero-kota"] };
const drinksAsset = { url: brand["drinks"] };

export const SITE_IMAGE_PREFIX = "site_image.";

export type SiteImageKey =
  | "hero"
  | "hero_badge"
  | "deco_1"
  | "deco_2"
  | "deco_3"
  | "deco_4"
  | "drinks";

export const SITE_IMAGES: { key: SiteImageKey; label: string; hint: string; fallback: string }[] = [
  { key: "hero", label: "Hero image", hint: "Big image at the top of the home page", fallback: heroAsset.url },
  { key: "hero_badge", label: "Hero corner photo", hint: "Small photo overlapping the hero", fallback: deco.kotaWings ?? heroAsset.url },
  { key: "deco_1", label: "Gallery photo 1", hint: "Home page photo strip", fallback: deco.kotaNuggets ?? heroAsset.url },
  { key: "deco_2", label: "Gallery photo 2", hint: "Home page photo strip", fallback: deco.noahsArk ?? heroAsset.url },
  { key: "deco_3", label: "Gallery photo 3", hint: "Home page photo strip", fallback: deco.staff ?? heroAsset.url },
  { key: "deco_4", label: "Gallery photo 4", hint: "Home page photo strip", fallback: deco.menuBoard ?? heroAsset.url },
  { key: "drinks", label: "Drinks banner", hint: "Image next to the fizzy drinks section", fallback: drinksAsset.url },
];

export type SiteImageMap = Record<SiteImageKey, string>;

export const SITE_IMAGE_DEFAULTS = Object.fromEntries(
  SITE_IMAGES.map((i) => [i.key, i.fallback]),
) as SiteImageMap;

/** Reads admin-managed overrides from settings and resolves storage paths to usable URLs. */
export async function fetchSiteImages(): Promise<SiteImageMap> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .like("key", `${SITE_IMAGE_PREFIX}%`);
  if (error) throw new Error(error.message);

  const overrides = (data ?? []).filter((r) => r.value);
  const urls = await resolvePhotoUrls(overrides.map((r) => r.value));
  const out: SiteImageMap = { ...SITE_IMAGE_DEFAULTS };
  for (const row of overrides) {
    const key = row.key.slice(SITE_IMAGE_PREFIX.length) as SiteImageKey;
    const src = urls[row.value];
    if (src && key in out) out[key] = src;
  }
  return out;
}

export function useSiteImages() {
  const q = useQuery({ queryKey: ["site-images"], queryFn: fetchSiteImages, staleTime: 60_000 });
  return q.data ?? SITE_IMAGE_DEFAULTS;
}
