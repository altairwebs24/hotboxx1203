import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Truck, Timer, ShieldCheck, Plus, ArrowRight, CupSoda } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { itemImage } from "@/lib/menu-images";
import { useSiteImages } from "@/lib/site-images";
import { useCovers, useHiddenDefaults } from "@/lib/default-images";
import { ZAR, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hotboxx | Order Kotas, Burgers & Combos Online" },
      {
        name: "description",
        content:
          "Hotboxx — the right choice. Order kotas, burgers, sandwiches, wings and nugget combos. Collection or R30 delivery around Matsulu.",
      },
      { property: "og:title", content: "Hotboxx | Order Kotas, Burgers & Combos Online" },
      {
        property: "og:description",
        content: "Hotboxx — the right choice. Order kotas, burgers, sandwiches, wings and nugget combos. Collection or R30 delivery around Matsulu.",
      },
    ],
  }),
  component: Home,
});

const FEATURED = [
  { slug: "kota", name: "Noah Arch" },
  { slug: "kota-wings", name: "Regular & Wings" },
  { slug: "burgers", name: "Full House Burger" },
  { slug: "sandwich-chips", name: "Ham, Cheese, Egg & Chips" },
];

type Featured = { id: string; name: string; price: number; slug: string; sort_order: number };

function Home() {
  const { add } = useCart();
  const siteImages = useSiteImages();
  const covers = useCovers();
  const hiddenDefaults = useHiddenDefaults();

  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async (): Promise<Featured[]> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, sort_order, available, categories!inner(slug)")
        .in(
          "name",
          FEATURED.map((f) => f.name),
        )
        .eq("available", true);
      if (error) throw new Error(error.message);
      const rows = (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        price: Number(r.price),
        sort_order: r.sort_order,
        slug: (r.categories as unknown as { slug: string }).slug,
      }));
      return FEATURED.map((f) => rows.find((r) => r.slug === f.slug && r.name === f.name)).filter(
        Boolean,
      ) as Featured[];
    },
  });

  const { data: milkshakes } = useQuery({
    queryKey: ["milkshakes"],
    queryFn: async (): Promise<{ id: string; name: string; price: number }[]> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, sort_order, categories!inner(slug)")
        .eq("categories.slug", "drinks")
        .eq("available", true)
        .ilike("name", "%milkshake%")
        .order("sort_order");
      if (error) throw new Error(error.message);
      const seen = new Set<string>();
      return (data ?? [])
        .map((d) => ({ id: d.id, name: d.name, price: Number(d.price) }))
        .filter((d) => {
          const key = d.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    },
  });

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--flame)_35%,transparent),transparent_60%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
              <Flame className="size-3.5" /> Right choice
            </span>
            <h1 className="mt-5 text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              LOADED KOTAS.<br />
              <span className="flame-text">SERIOUS FLAVOUR.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              From the Regular to the legendary Noah's Ark — built fresh, packed full and served
              hot. Order online, get an order number, pay on WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                Order now
              </Link>
              <Link
                to="/refreshments"
                className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-secondary"
              >
                Browse refreshments
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src={siteImages.hero}
              alt="Hotboxx Noah's Ark kota meal for two"
              className="w-full rounded-3xl border border-border object-cover shadow-2xl"
            />
            <img
              src={siteImages.hero_badge}
              alt="Hotboxx kota served with crispy wings"
              className="absolute -bottom-8 -right-4 hidden w-40 rotate-3 rounded-2xl border-2 border-background object-cover shadow-2xl md:block"
            />
            <div className="absolute -bottom-5 left-5 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl">
              <p className="font-display text-lg">NOAH'S ARK</p>
              <p className="text-xs text-muted-foreground">Meal for 2 — R120</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {[
          { icon: Timer, title: "Made to order", text: "Everything is grilled and packed fresh when you order." },
          { icon: Truck, title: "R30 delivery", text: "Delivery around Matsulu, or collect from us." },
          { icon: ShieldCheck, title: "Order number", text: "Every order gets a tracking number like HB-1001." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
            <f.icon className="size-6 text-accent" />
            <h3 className="mt-3 text-lg">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      {/* Deco strip */}
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { src: siteImages.deco_1, alt: "Hotboxx kota with golden chicken nuggets" },
            { src: siteImages.deco_2, alt: "The Noah's Ark kota, a meal for two" },
            { src: siteImages.deco_3, alt: "Hotboxx team member serving a fresh kota" },
            { src: siteImages.deco_4, alt: "A packed Hotboxx order in front of the menu board" },
          ].map((d) => (
            <img
              key={d.alt}
              src={d.src}
              alt={d.alt}
              loading="lazy"
              className="h-40 w-full rounded-2xl border border-border object-cover md:h-56"
            />
          ))}
        </div>
      </section>

      {/* Featured picks */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">FAN <span className="flame-text">FAVOURITES</span></h2>
            <p className="mt-1 text-sm text-muted-foreground">Four of the most ordered boxes.</p>
          </div>
          <Link
            to="/menu"
            className="hidden items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-secondary sm:inline-flex"
          >
            Full menu <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {(featured ?? []).map((item) => {
            const img =
              covers[item.id] ?? (hiddenDefaults.has(item.id) ? null : itemImage(item.slug, item.sort_order));
            return (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent/60"
              >
                <Link
                  to="/menu/$id"
                  params={{ id: item.id }}
                  className="flex flex-1 flex-col transition-transform active:scale-[0.98]"
                >
                  {img && (
                    <img src={img} alt={item.name} loading="lazy" className="h-32 w-full bg-black object-cover sm:h-40" />
                  )}
                  <div className="p-3 pb-0">
                    <h3 className="text-base leading-tight">{item.name}</h3>
                  </div>
                </Link>
                <div className="p-3 pt-0">
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-display text-lg text-accent">{ZAR(item.price)}</span>
                    <button
                      onClick={() => {
                        add({ id: item.id, name: item.name, price: item.price });
                        toast.success(`${item.name} added to cart`);
                      }}
                      className="inline-flex items-center gap-1 rounded-full flame-bg px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      <Plus className="size-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Link
          to="/menu"
          className="mt-6 flex items-center justify-center gap-2 rounded-full flame-bg py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25"
        >
          See the full menu <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Milkshakes */}
      {(milkshakes ?? []).length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">THICK <span className="flame-text">MILKSHAKES</span></h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Creamy shakes — only R10 with any kota, burger or sandwich on the current special.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(milkshakes ?? []).map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <CupSoda className="size-6 text-accent" />
                <h3 className="mt-3 text-base leading-tight">{m.name}</h3>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-display text-lg text-accent">{ZAR(m.price)}</span>
                  <button
                    onClick={() => {
                      add({ id: m.id, name: m.name, price: m.price });
                      toast.success(`${m.name} added to cart`);
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
      )}

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2">
          <img src={siteImages.drinks} alt="Hotboxx fizzy drinks" className="h-full w-full object-cover" />
          <div className="p-8">
            <h2 className="text-3xl">REFRESHMENTS</h2>
            <p className="mt-2 text-muted-foreground">
              R17 each — or grab one for R10 with the current special when you buy any kota, burger
              or sandwich.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/specials" className="rounded-full flame-bg px-5 py-2.5 text-sm font-bold text-primary-foreground">
                View specials
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-5 py-2.5 text-sm font-bold"
              >
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
