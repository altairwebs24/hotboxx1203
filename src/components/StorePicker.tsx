import { MapPin } from "lucide-react";
import { useStores } from "@/lib/stores";

/** Full card picker (checkout). */
export function StorePicker() {
  const { stores, storeId, setStoreId, loading } = useStores();

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Which store are you ordering from?
      </span>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading stores…</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStoreId(s.id)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm font-bold ${
                storeId === s.id ? "flame-bg text-primary-foreground" : "border border-border"
              }`}
            >
              <span className="block">{s.name}</span>
              <span
                className={`block text-[11px] font-semibold ${
                  storeId === s.id ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {s.area}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact selector for the header / banners. */
export function StoreSelect({ className = "" }: { className?: string }) {
  const { stores, storeId, setStoreId } = useStores();

  return (
    <label className={`inline-flex items-center gap-1.5 ${className}`}>
      <MapPin className="size-4 shrink-0 text-accent" />
      <select
        aria-label="Choose your Hotboxx store"
        value={storeId ?? ""}
        onChange={(e) => setStoreId(e.target.value)}
        className="max-w-[9.5rem] truncate rounded-full border border-border bg-background px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>
          Choose store
        </option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.area}
          </option>
        ))}
      </select>
    </label>
  );
}
