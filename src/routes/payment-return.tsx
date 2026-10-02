import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { confirmCardPayment } from "@/lib/payments.functions";
import { ZAR, whatsappFor } from "@/lib/format";

type Search = {
  order: string | undefined;
  cancelled: string | undefined;
  failed: string | undefined;
};

export const Route = createFileRoute("/payment-return")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: typeof search["order"] === "string" ? search["order"] : undefined,
    cancelled: typeof search["cancelled"] === "string" ? search["cancelled"] : undefined,
    failed: typeof search["failed"] === "string" ? search["failed"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment result | Hotboxx" },
      { name: "description", content: "See whether your Hotboxx card payment went through." },
      { property: "og:title", content: "Payment result | Hotboxx" },
      { property: "og:description", content: "Your Hotboxx card payment result and order number." },
    ],
  }),
  component: PaymentReturn,
});

function PaymentReturn() {
  const { order, cancelled, failed } = Route.useSearch();
  const navigate = useNavigate();
  const confirm = useServerFn(confirmCardPayment);
  const [state, setState] = useState<"checking" | "paid" | "unpaid" | "error">("checking");
  const [total, setTotal] = useState<number | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    if (!order) {
      setState("error");
      return;
    }
    if (cancelled || failed) {
      setState("unpaid");
      return;
    }
    let live = true;
    confirm({ data: { orderNumber: order } })
      .then((r) => {
        if (!live) return;
        setTotal(r.total);
        setState(r.paid ? "paid" : "unpaid");
        if (r.paid) {
          const s = r.summary;
          const lines = [
            `Hi Hotboxx! I've paid for my order.`,
            `Order number: *${r.orderNumber}*`,
            s?.paymentId ? `Payment ID: ${s.paymentId}` : null,
            s?.storeName ? `Store: ${s.storeName}` : null,
            ...(s?.items ?? []).map((i) => `${i.quantity}x ${i.name}${i.note ? ` (${i.note})` : ""}`),
            s ? (s.fulfillment === "delivery" ? `Delivery to: ${s.address ?? ""}` : "Collection") : null,
            `Total paid: R${r.total}`,
            s?.customerName ? `Name: ${s.customerName}` : null,
          ].filter(Boolean);
          const link = `https://wa.me/${whatsappFor(s?.storeSlug)}?text=${encodeURIComponent(lines.join("\n"))}`;
          setWaLink(link);
          const key = `wa-sent-${r.orderNumber}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            setTimeout(() => {
              window.location.href = link;
            }, 1500);
          }
        }
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [order, cancelled, failed, confirm]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {state === "checking" && <p className="text-muted-foreground">Confirming your payment…</p>}

      {state === "paid" && (
        <>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Payment received</p>
          <h1 className="mt-3 font-display text-5xl flame-text">{order}</h1>
          <p className="mt-4 text-muted-foreground">
            Thank you! We've received {total !== null ? ZAR(total) : "your payment"} and your order is
            confirmed. Taking you to WhatsApp to send us your order details…
          </p>
          {waLink && (
            <a
              href={waLink}
              className="mt-6 inline-block rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              Send order on WhatsApp
            </a>
          )}
        </>
      )}

      {state === "unpaid" && (
        <>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Payment not completed
          </p>
          <h1 className="mt-3 font-display text-5xl flame-text">{order}</h1>
          <p className="mt-4 text-muted-foreground">
            Your order is saved but not paid yet. You can pay on WhatsApp instead, or try the card
            payment again from your order number.
          </p>
          <a
            href={`https://wa.me/${whatsappFor(slug)}?text=Hi%20Hotboxx!%20Order%20${order}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Pay on WhatsApp
          </a>
        </>
      )}

      {state === "error" && (
        <p className="text-muted-foreground">
          We couldn't check this payment. Please contact us on WhatsApp with your order number.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={() => navigate({ to: "/track" })}
          className="rounded-full border border-border py-3 text-sm font-bold"
        >
          Track this order
        </button>
        <Link to="/menu" className="rounded-full border border-border py-3 text-sm font-bold">
          Back to menu
        </Link>
      </div>
    </div>
  );
}
