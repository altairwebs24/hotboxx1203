export type StoreLocation = { lat: number; lng: number; label: string };

/** GPS coordinates for each Hotboxx store, keyed by store slug. */
export const STORE_LOCATIONS: Record<string, StoreLocation> = {
  eringin: { lat: -25.504389, lng: 31.33175, label: "eRingin — Matsulu B" },
  days: { lat: -25.502528, lng: 31.350944, label: "Days — Matsulu C" },
  "boxer-complex": { lat: -25.520432, lng: 31.334384, label: "Boxer Complex" },
};

export function storeLocation(slug?: string | null): StoreLocation | null {
  if (!slug) return null;
  return STORE_LOCATIONS[slug] ?? null;
}

/** Turn-by-turn navigation link (opens Google Maps / default nav app). */
export function directionsUrl(loc: StoreLocation) {
  return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}&travelmode=driving`;
}

export function coordsLabel(loc: StoreLocation) {
  return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
}
