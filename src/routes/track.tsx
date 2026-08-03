import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { trackOrder } from "@/lib/orders.functions";
import { STATUS_LABEL, ZAR } from "@/lib/format";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order | Hotboxx" },
      {
        name: "description",
        content: "Enter your Hotboxx order number and phone number to see the live status of your order.",
      },
      { property: "og:title", content: "Track Your Order | Hotboxx" },
      { property: "og:description", content: "Live status for your Hotboxx order." },
    ],
  }),
  component: Track,
});

type Order = Awaited<ReturnType<typeof trackOrder>>;

function Track() {
  const run = useServerFn(trackOrder);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const found = await run({ data: { orderNumber, phone } });
      if (!found) toast.error("No order found with that number and phone");
      setOrder(found);
    } catch {
      toast.error("Could not look up that order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl">TRACK YOUR <span className="flame-text">ORDER</span></h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number (e.g. HB-1001)"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number used on the order"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={busy}
          className="w-full rounded-full flame-bg py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check status"}
        </button>
      </form>

      {order && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{order.order_number}</h2>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {order.fulfillment} • {new Date(order.created_at).toLocaleString("en-ZA")}
          </p>
          <ul className="mt-4 space-y-1 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-muted-foreground">
                  {i.quantity}× {i.name}
                </span>
                <span>{ZAR(i.unit_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-xl">
            <span>Total</span>
            <span className="text-accent">{ZAR(order.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
