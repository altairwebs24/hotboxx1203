import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { ZAR, WHATSAPP_NUMBER } from "@/lib/format";
import { placeOrder } from "@/lib/orders.functions";
import { placeOrderAsUser } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Hotboxx" },
      {
        name: "description",
        content: "Complete your Hotboxx order, get your order number and pay on WhatsApp.",
      },
      { property: "og:title", content: "Checkout | Hotboxx" },
      { property: "og:description", content: "Get your Hotboxx order number and pay on WhatsApp." },
    ],
  }),
  component: Checkout,
});

const DELIVERY_FEE = 30;

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const submitGuest = useServerFn(placeOrder);
  const submitUser = useServerFn(placeOrderAsUser);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"collection" | "delivery">("collection");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string; total: number } | null>(null);

  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    if (name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (fulfillment === "delivery" && address.trim().length < 5) {
      toast.error("Please enter your delivery address");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        customerName: name.trim(),
        phone: phone.trim(),
        fulfillment,
        address: address.trim(),
        note: note.trim(),
        items: lines.map((l) => ({ id: l.id, quantity: l.quantity, note: l.note })),
      };
      const order = session
        ? await submitUser({ data: payload })
        : await submitGuest({ data: payload });

      clear();
      setResult({ orderNumber: order.orderNumber, total: order.total });

      const summary = order.items
        .map((i) => `${i.quantity}x ${i.name}${i.note ? ` (${i.note})` : ""}`)
        .join("%0A");
      const message = `Hi Hotboxx! Order *${order.orderNumber}*%0A${summary}%0A${
        fulfillment === "delivery" ? `Delivery to: ${address.trim()}` : "Collection"
      }%0ATotal: R${order.total}%0AName: ${name.trim()}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place your order");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">Order placed</p>
        <h1 className="mt-3 font-display text-5xl flame-text">{result.orderNumber}</h1>
        <p className="mt-4 text-muted-foreground">
          Keep this order number. Complete payment on WhatsApp ({ZAR(result.total)}) and we'll start
          preparing your food.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full flame-bg py-3 text-sm font-bold text-primary-foreground"
          >
            Pay on WhatsApp
          </a>
          <button
            onClick={() => navigate({ to: "/track" })}
            className="rounded-full border border-border py-3 text-sm font-bold"
          >
            Track this order
          </button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl">Nothing to checkout</h1>
        <Link to="/menu" className="mt-5 inline-block rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground">
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">CHECK<span className="flame-text">OUT</span></h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <Field label="Your name">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputCls} placeholder="Full name" />
          </Field>
          <Field label="Phone number">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className={inputCls} placeholder="079 000 0000" />
          </Field>
          <Field label="Collection or delivery">
            <div className="flex gap-2">
              {(["collection", "delivery"] as const).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFulfillment(f)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold capitalize ${
                    fulfillment === f ? "flame-bg text-primary-foreground" : "border border-border"
                  }`}
                >
                  {f === "delivery" ? "Delivery (R30)" : "Collection"}
                </button>
              ))}
            </div>
          </Field>
          {fulfillment === "delivery" && (
            <Field label="Delivery address (around Matsulu)">
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} rows={2} className={inputCls} placeholder="Street, section, landmark" />
            </Field>
          )}
          <Field label="Order notes (optional)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className={inputCls} placeholder="e.g. Special Option 2 with a Lime Milkshake" />
          </Field>
        </div>

        <div className="h-fit rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl">Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {l.quantity}× {l.name}
                </span>
                <span>{ZAR(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={ZAR(subtotal)} />
            <Row label="Delivery" value={deliveryFee ? ZAR(deliveryFee) : "—"} />
            <div className="flex justify-between pt-2 font-display text-2xl">
              <span>Total</span>
              <span className="text-accent">{ZAR(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-full flame-bg py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Placing order…" : "Place order"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Payment is completed on WhatsApp after you get your order number.
          </p>
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
