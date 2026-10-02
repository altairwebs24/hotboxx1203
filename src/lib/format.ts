export const ZAR = (v: number) =>
  `R${Number(v).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for collection",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_ORDER = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export const WHATSAPP_NUMBER = "27799155422";
export const WHATSAPP_DISPLAY = "079 915 5422";

/** WhatsApp number per branch, keyed by store slug. */
export const STORE_WHATSAPP: Record<string, string> = {
  days: "27799155422",
  "boxer-complex": "27606598171",
  eringin: "27660483724",
};

export function whatsappFor(slug?: string | null) {
  return (slug && STORE_WHATSAPP[slug]) || WHATSAPP_NUMBER;
}
