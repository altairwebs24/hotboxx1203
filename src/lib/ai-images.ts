import k1c from "@/assets/ai/kota-1-cover.jpg";
import k1e from "@/assets/ai/kota-1-exploded.jpg";
import k2c from "@/assets/ai/kota-2-cover.jpg";
import k2e from "@/assets/ai/kota-2-exploded.jpg";
import k3c from "@/assets/ai/kota-3-cover.jpg";
import k3e from "@/assets/ai/kota-3-exploded.jpg";
import k4c from "@/assets/ai/kota-4-cover.jpg";
import k4e from "@/assets/ai/kota-4-exploded.jpg";
import k5c from "@/assets/ai/kota-5-cover.jpg";
import k5e from "@/assets/ai/kota-5-exploded.jpg";
import k6c from "@/assets/ai/kota-6-cover.jpg";
import k6e from "@/assets/ai/kota-6-exploded.jpg";
import k7c from "@/assets/ai/kota-7-cover.jpg";
import k7e from "@/assets/ai/kota-7-exploded.jpg";
import k8c from "@/assets/ai/kota-8-cover.jpg";
import k8e from "@/assets/ai/kota-8-exploded.jpg";
import k9c from "@/assets/ai/kota-9-cover.jpg";
import k9e from "@/assets/ai/kota-9-exploded.jpg";

/** Studio (white background) product shots: a cover photo and an exploded ingredient view. */
export const AI_PHOTOS: Record<string, { cover: string; exploded: string }> = {
  "kota-1": { cover: k1c, exploded: k1e },
  "kota-2": { cover: k2c, exploded: k2e },
  "kota-3": { cover: k3c, exploded: k3e },
  "kota-4": { cover: k4c, exploded: k4e },
  "kota-5": { cover: k5c, exploded: k5e },
  "kota-6": { cover: k6c, exploded: k6e },
  "kota-7": { cover: k7c, exploded: k7e },
  "kota-8": { cover: k8c, exploded: k8e },
  "kota-9": { cover: k9c, exploded: k9e },
};

export function aiPhotos(slug?: string | null, sortOrder?: number | null) {
  if (!slug || !sortOrder) return null;
  return AI_PHOTOS[`${slug}-${sortOrder}`] ?? null;
}
