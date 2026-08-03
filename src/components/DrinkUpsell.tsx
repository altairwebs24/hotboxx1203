import { useQuery } from "@tanstack/react-query";
import { CupSoda, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { ZAR } from "@/lib/format";

type Drink = { id: string; name: string; price: number };

export function DrinkUpsell() {
  const { lines, add } = useCart();

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: async (): Promise<Drink[]> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, sort_order, categories!inner(slug)")
        .eq("categories.slug", "drinks")
        .eq("available", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []).map((d) => ({ id: d.id, name: d.name, price: Number(d.price) }));
    },
  });

  if (!drinks?.length) return null;
  const drinkIds = new Set(drinks.map((d) => d.id));
  const hasDrink = lines.some((l) => drinkIds.has(l.id));
  if (hasDrink || lines.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 p-5">
      <div className="flex items-center gap-2">
        <CupSoda className="size-5 text-accent" />
        <h2 className="text-lg leading-none">ADD A DRINK?</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Your order has no drink yet. With the current special you get any drink for just R10 with a
        kota, burger or sandwich.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {drinks.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              add({ id: d.id, name: d.name, price: d.price });
              toast.success(`${d.name} added — ${ZAR(d.price)}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold hover:border-accent"
          >
            <Plus className="size-3.5 text-accent" />
            {d.name} · {ZAR(d.price)}
          </button>
        ))}
      </div>
    </div>
  );
}
