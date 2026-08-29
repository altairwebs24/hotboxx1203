import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, CupSoda } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { itemImage } from "@/lib/menu-images";
import { ZAR } from "@/lib/format";


export const Route = createFileRoute("/menu/")({
  head: () => ({
    meta: [
      { title: "Menu | Hotboxx Kotas, Burgers, Sandwiches & Combos" },
      {
        name: "description",
        content:
          "Browse the full Hotboxx menu: kotas from R20, burgers, sandwiches, wings and nugget combos. Add to cart and order online.",
      },
      { property: "og:title", content: "Menu | Hotboxx" },
      { property: "og:description", content: "Kotas, burgers, sandwiches, wings and nugget combos." },
    ],
  }),
  component: MenuPage,
});

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  sort_order: number;
};
type Category = { id: string; name: string; slug: string; sort_order: number; menu_items: Item[] };

function MenuPage() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["menu"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, sort_order, menu_items(id, name, description, price, available, sort_order)")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []).map((c) => ({
        ...c,
        menu_items: [...(c.menu_items ?? [])]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((i) => ({ ...i, price: Number(i.price) })),
      })) as Category[];
    },
  });


  const categories = data ?? [];
  const term = q.trim().toLowerCase();
  const visible = categories
    .filter((c) => active === "all" || c.id === active)
    .map((c) => ({
      ...c,
      menu_items: c.menu_items.filter(
        (i) => i.available && (!term || i.name.toLowerCase().includes(term) || (i.description ?? "").toLowerCase().includes(term)),
      ),
    }))
    .filter((c) => c.menu_items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl">THE <span className="flame-text">MENU</span></h1>
      <p className="mt-2 text-sm text-muted-foreground">Tap add to build your cart, then checkout for your order number.</p>

      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search kotas, burgers, combos…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[{ id: "all", name: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                active === c.id ? "flame-bg text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading the menu…</p>}
      {error && <p className="mt-10 text-sm text-destructive">Could not load the menu. Please refresh.</p>}

      <div className="mt-8 space-y-12">
        {visible.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-2xl">{cat.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {cat.menu_items.map((item) => {
                const img = itemImage(cat.slug, item.sort_order);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent/60"
                  >
                    <Link
                      to="/menu/$id"
                      params={{ id: item.id }}
                      className="flex flex-1 flex-col"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={`${item.name} from the Hotboxx menu`}
                          loading="lazy"
                          className="h-28 w-full bg-black object-contain sm:h-36"
                        />
                      ) : (
                        <div className="grid h-28 w-full place-items-center bg-secondary sm:h-36">
                          <CupSoda className="size-10 text-accent" />
                        </div>
                      )}
                      <div className="min-w-0 p-3 pb-0 sm:p-4 sm:pb-0">
                        <h3 className="text-base leading-tight sm:text-lg">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">

                        <span className="font-display text-lg text-accent sm:text-xl">{ZAR(item.price)}</span>
                        <button
                          onClick={() => {
                            add({ id: item.id, name: item.name, price: item.price });
                            toast.success(`${item.name} added to cart`);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full flame-bg px-3 py-1.5 text-xs font-bold text-primary-foreground sm:px-4 sm:py-2"
                        >
                          <Plus className="size-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
