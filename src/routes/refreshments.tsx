import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CupSoda, Plus, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useSiteImages } from "@/lib/site-images";
import { useStores } from "@/lib/stores";
import { storeLocation, directionsUrl } from "@/lib/store-locations";
import { ZAR, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/format";

export const Route = createFileRoute("/refreshments")({
  head: () => ({
    meta: [
      { title: "Refreshments | Hotboxx Fizzy Drinks & Thick Milkshakes" },
      {
        name: "description",
        content:
          "Browse Hotboxx refreshments — ice cold fizzy drinks and thick chocolate, bubblegum, lime and strawberry milkshakes. Add them to any kota, burger or sandwich order.",
      },
      { property: "og:title", content: "Refreshments | Hotboxx" },
      {
        property: "og:description",
        content: "Fizzy drinks and thick milkshakes to go with your Hotboxx order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Refreshments,
});

type Drink = { id: string; name: string; description: string | null; price: number };

function Refreshments() {
  const { add } = useCart();
  const siteImages = useSiteImages();
  const { stores } = useStores();

  const { data, isLoading } = useQuery({
    queryKey: ["refreshments"],
    queryFn: async (): Promise<Drink[]> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, sort_order, categories!inner(slug)")
        .eq("categories.slug", "drinks")
        .eq("available", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      const seen = new Set<string>();
      return (data ?? [])
        .map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          price: Number(d.price),
        }))
        .filter((d) => {
          const key = d.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    },
  });

  const drinks = data ?? [];
  const shakes = drinks.filter((d) => d.name.toLowerCase().includes("milkshake"));
  const fizzy = drinks.filter((d) => !d.name.toLowerCase().includes("milkshake"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl">
        REFRESH<span className="flame-text">MENTS</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ice cold fizzy drinks and thick milkshakes — add one to any kota, burger or sandwich.
      </p>

      <img
        src={siteImages.drinks}
        alt="Hotboxx ice cold fizzy drinks"
        className="mt-6 h-52 w-full rounded-3xl border border-border object-cover sm:h-72"
      />

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading refreshments…</p>}

      {[
        { title: "Fizzy drinks", items: fizzy },
        { title: "Thick milkshakes", items: shakes },
      ]
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <section key={group.title} className="mt-10">
            <h2 className="text-2xl">{group.title}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {group.items.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/60"
                >
                  <CupSoda className="size-6 text-accent" />
                  <h3 className="mt-3 text-base leading-tight">{d.name}</h3>
                  {d.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="font-display text-lg text-accent">{ZAR(d.price)}</span>
                    <button
                      onClick={() => {
                        add({ id: d.id, name: d.name, price: d.price });
                        toast.success(`${d.name} added to cart`);
                      }}
                      className="inline-flex items-center gap-1 rounded-full flame-bg px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      <Plus className="size-3.5" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

      <section className="mt-14">
        <h2 className="text-2xl">FIND <span className="flame-text">US</span></h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap a store to open turn-by-turn GPS navigation.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {stores.map((s) => {
            const loc = storeLocation(s.slug);
            if (!loc) return null;
            return (
              <a
                key={s.id}
                href={directionsUrl(loc)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-accent/60"
              >
                <Navigation className="size-5 shrink-0 text-accent" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{s.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.area}</span>
                </span>
              </a>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Questions? WhatsApp or call{" "}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-accent"
          >
            {WHATSAPP_DISPLAY}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
