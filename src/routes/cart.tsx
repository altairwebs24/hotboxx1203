import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { ZAR } from "@/lib/format";
import { DrinkUpsell } from "@/components/DrinkUpsell";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | Hotboxx" },
      { name: "description", content: "Review your Hotboxx order before checkout." },
      { property: "og:title", content: "Your Cart | Hotboxx" },
      { property: "og:description", content: "Review your Hotboxx order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQuantity, setNote, remove } = useCart();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">YOUR <span className="flame-text">CART</span></h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link to="/menu" className="mt-5 inline-block rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground">
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {lines.map((l) => (
              <div key={l.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg leading-tight">{l.name}</h2>
                    <p className="text-sm text-muted-foreground">{ZAR(l.price)} each</p>
                  </div>
                  <span className="font-display text-xl text-accent">{ZAR(l.price * l.quantity)}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                    <button aria-label="Decrease" onClick={() => setQuantity(l.id, l.quantity - 1)} className="p-1">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{l.quantity}</span>
                    <button aria-label="Increase" onClick={() => setQuantity(l.id, l.quantity + 1)} className="p-1">
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" /> Remove
                  </button>
                </div>
                <input
                  value={l.note}
                  maxLength={200}
                  onChange={(e) => setNote(l.id, e.target.value)}
                  placeholder="Item note (e.g. no chilli, extra sauce)"
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>

          <DrinkUpsell />

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">{ZAR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Delivery around Matsulu adds R30 — choose collection or delivery at checkout.
            </p>
            <Link
              to="/checkout"
              className="mt-4 block rounded-full flame-bg py-3 text-center text-sm font-bold text-primary-foreground"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
