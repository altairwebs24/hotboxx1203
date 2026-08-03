import images from "@/assets/images.json";

const map = images as Record<string, string>;

/** Photo cropped from the printed Hotboxx menu for a given category + item position. */
export function itemImage(slug?: string | null, sortOrder?: number | null): string | null {
  if (!slug || !sortOrder) return null;
  return map[`${slug}-${sortOrder}`] ?? null;
}

export const deco = {
  kotaNuggets: map["deco-kota-nuggets"],
  kotaWings: map["deco-kota-wings"],
  noahsArk: map["deco-noahs-ark"],
  staff: map["deco-staff"],
  menuBoard: map["deco-menuboard"],
};
