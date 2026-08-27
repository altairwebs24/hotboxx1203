import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CupSoda, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { itemImage } from "@/lib/menu-images";
import { fetchItemPhotos } from "@/lib/item-photos";
import { ZAR } from "@/lib/format";

export const Route = createFileRoute("/menu/$id")({
  head: () => ({
    meta: [
      { title: "Menu item | Hotboxx" },
      {
        name: "description",
        content: "See photos, ingredients and the price of this Hotboxx menu item before you order.",
      },
      { property: "og:title", content: "Menu item | Hotboxx" },
      { property: "og:description", content: "Photos, details and price for this Hotboxx meal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ItemPage,
});

type ItemRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  sort_order: number;
  categories: { name: string; slug: string } | null;
};

function ItemPage() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [shot, setShot] = useState(0);

  const item = useQuery({
    queryKey: ["menu-item", id],
    queryFn: async (): Promise<ItemRow | null> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, available, sort_order, categories(name, slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? ({ ...data, price: Number(data.price) } as ItemRow) : null;
    },
  });

  const photos = useQuery({
    queryKey: ["menu-item-photos", id],
    queryFn: () => fetchItemPhotos(id),
  });

  const data = item.data;
  const flyer = data ? itemImage(data.categories?.slug, data.sort_order) : null;
  const gallery = [...(photos.data ?? []).map((p) => p.src), ...(flyer ? [flyer] : [])];
  const active = gallery[Math.min(shot, Math.max(gallery.length - 1, 0))];

  if (item.isLoading) return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!data)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl">Item not found</h1>
        <Link to="/menu" className="mt-6 inline-block rounded-full flame-bg px-6 py-2.5 text-sm font-bold text-primary-foreground">
          Back to menu
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/menu" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <ArrowLeft className="size-4" /> Menu
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card">
        {active ? (
          <img src={active} alt={`${data.name} at Hotboxx`} className="h-64 w-full bg-black object-cover sm:h-80" />
        ) : (
          <div className="grid h-64 w-full place-items-center bg-secondary sm:h-80">
            <CupSoda className="size-14 text-accent" />
          </div>
        )}
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setShot(i)}
                className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                  i === shot ? "border-accent" : "border-border"
                }`}
              >
                <img src={src} alt={`${data.name} photo ${i + 1}`} className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent">{data.categories?.name}</p>
      <h1 className="mt-1 text-3xl">{data.name}</h1>
      <p className="mt-2 font-display text-3xl text-accent">{ZAR(data.price)}</p>
      {data.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.description}</p>}

      <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="item-note">
          Special request (optional)
        </label>
        <input
          id="item-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. no atchar, extra chilli"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
            <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-bold">{qty}</span>
            <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}>
              <Plus className="size-4" />
            </button>
          </div>
          <button
            disabled={!data.available}
            onClick={() => {
              for (let i = 0; i < qty; i++) add({ id: data.id, name: data.name, price: data.price, note });
              toast.success(`${qty}× ${data.name} added to cart`);
            }}
            className="flex-1 rounded-full flame-bg px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {data.available ? `Add to cart — ${ZAR(data.price * qty)}` : "Sold out"}
          </button>
        </div>
      </div>
    </div>
  );
}
