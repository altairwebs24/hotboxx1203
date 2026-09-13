import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { confirmCardPayment } from "@/lib/payments.functions";
import { ZAR, WHATSAPP_NUMBER } from "@/lib/format";

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
            confirmed. Keep this order number to track your order.
          </p>
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
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Hotboxx!%20Order%20${order}`}
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
