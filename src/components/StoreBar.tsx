import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Check, Navigation } from "lucide-react";
import { useStores } from "@/lib/stores";
import { storeLocation, directionsUrl } from "@/lib/store-locations";

/** Slim themed strip under the header for choosing a store. */
export function StoreBar() {
  const { stores, storeId, setStoreId, loading } = useStores();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const active = stores.find((s) => s.id === storeId);

  return (
    <div className="border-b border-border/60 bg-card/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div ref={ref} className="relative flex items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-accent" />
            <span className="truncate text-xs font-semibold text-muted-foreground">
              {active ? (
                <>
                  Ordering from{" "}
                  <span className="font-bold text-foreground">{active.name}</span>
                  <span className="hidden sm:inline"> — {active.area}</span>
                </>
              ) : loading ? (
                "Loading stores…"
              ) : (
                "Pick your nearest Hotboxx store"
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/50 bg-secondary/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground"
          >
            {active ? "Change" : "Choose store"}
            <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/50">
              {stores.map((s) => {
                const selected = s.id === storeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStoreId(s.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left last:border-0 ${
                      selected ? "bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{s.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{s.area}</span>
                    </span>
                    {selected && <Check className="size-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
