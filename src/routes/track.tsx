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

const STEPS = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "completed"];

function Track() {
  const run = useServerFn(trackOrder);
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderNumber.trim().length < 3) {
      toast.error("Enter your order number, e.g. HB-1001");
      return;
    }
    setBusy(true);
    try {
      const found = await run({ data: { orderNumber: orderNumber.trim() } });
      if (!found) toast.error("No order found with that number");
      setOrder(found);
      setSearched(true);
    } catch {
      toast.error("Could not look up that order");
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl">TRACK YOUR <span className="flame-text">ORDER</span></h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the order number you received at checkout (it looks like HB-1001) to see the live
        status of your food.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <label htmlFor="order-number" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Order number
          </label>
          <input
            id="order-number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="HB-1001"
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
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
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleString("en-ZA")}
          </p>

          {order.status === "cancelled" ? (
            <p className="mt-5 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
              This order was cancelled. WhatsApp us on 079 915 5422 if that looks wrong.
            </p>
          ) : (
            <ol className="mt-5 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className={`size-3 shrink-0 rounded-full ${
                      i <= stepIndex ? "flame-bg" : "bg-muted"
                    }`}
                  />
                  <span className={i <= stepIndex ? "font-bold" : "text-muted-foreground"}>
                    {STATUS_LABEL[s] ?? s}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {searched && !order && (
        <p className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          We couldn't find that order number. Double-check it and try again.
        </p>
      )}
    </div>
  );
}
