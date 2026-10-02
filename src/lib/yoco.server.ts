// Server-only Yoco payment helpers.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const YOCO_API = "https://payments.yoco.com/api/checkouts";

function secretKey(): string {
  const key = process.env["YOCO_SECRET_KEY"];
  if (!key) throw new Error("Card payments are not configured yet");
  return key;
}

type YocoCheckout = {
  id: string;
  redirectUrl: string;
  status?: string;
};

/** Creates a hosted Yoco checkout for an existing order and returns the URL to send the customer to. */
export async function createYocoCheckout(orderNumber: string, origin: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, total, payment_status")
    .ilike("order_number", orderNumber.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found");
  if (order.payment_status === "paid") return { alreadyPaid: true, redirectUrl: null as string | null };

  const amountInCents = Math.round(Number(order.total) * 100);
  const returnUrl = `${origin}/payment-return?order=${encodeURIComponent(order.order_number)}`;

  const res = await fetch(YOCO_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInCents,
      currency: "ZAR",
      successUrl: returnUrl,
      cancelUrl: `${origin}/payment-return?order=${encodeURIComponent(order.order_number)}&cancelled=1`,
      failureUrl: `${origin}/payment-return?order=${encodeURIComponent(order.order_number)}&failed=1`,
      metadata: { orderNumber: order.order_number },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[yoco] create checkout failed [${res.status}]: ${body}`);
    throw new Error("Could not start the card payment. Please try again or pay on WhatsApp.");
  }

  const checkout = (await res.json()) as YocoCheckout;

  await supabaseAdmin
    .from("orders")
    .update({
      payment_method: "card",
      payment_status: "pending",
      payment_reference: checkout.id,
    })
    .eq("id", order.id);

  return { alreadyPaid: false, redirectUrl: checkout.redirectUrl };
}

/** Asks Yoco whether the order's checkout was completed and records the result. */
export async function confirmYocoPayment(orderNumber: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, total, status, payment_status, payment_reference")
    .ilike("order_number", orderNumber.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found");

  if (order.payment_status === "paid") {
    return { orderNumber: order.order_number, paid: true, total: Number(order.total), summary: await paidOrderSummary(order.order_number) };
  }
  if (!order.payment_reference) {
    return { orderNumber: order.order_number, paid: false, total: Number(order.total), summary: null };
  }

  const res = await fetch(`${YOCO_API}/${order.payment_reference}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[yoco] status check failed [${res.status}]: ${body}`);
    throw new Error("Could not confirm your payment yet. Please try again in a moment.");
  }

  const checkout = (await res.json()) as YocoCheckout;
  const paid = checkout.status === "completed" || checkout.status === "succeeded";

  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: paid ? "paid" : "unpaid",
      ...(paid && order.status === "pending" ? { status: "confirmed" } : {}),
    })
    .eq("id", order.id);

  if (paid) {
    const { data: withStore } = await supabaseAdmin
      .from("orders")
      .select("stores(name, area)")
      .eq("id", order.id)
      .maybeSingle();
    const store = withStore?.stores as { name: string; area: string } | null | undefined;
    const { notifyAdminsOfPaidOrder } = await import("./push.server");
    await notifyAdminsOfPaidOrder({
      orderNumber: order.order_number,
      total: Number(order.total),
      storeName: store ? `${store.name} (${store.area})` : null,
    });
  }

  return {
    orderNumber: order.order_number,
    paid,
    total: Number(order.total),
    summary: paid ? await paidOrderSummary(order.order_number) : null,
  };
}

/** Details used to build the customer's WhatsApp receipt message (paid orders only). */
export async function paidOrderSummary(orderNumber: string) {
  const { data } = await supabaseAdmin
    .from("orders")
    .select(
      "order_number, customer_name, fulfillment, address, total, payment_status, payment_reference, stores(name, area, slug), order_items(name, quantity, note)",
    )
    .ilike("order_number", orderNumber.trim())
    .maybeSingle();
  if (!data || data.payment_status !== "paid") return null;
  const store = data.stores as { name: string; area: string } | null;
  return {
    orderNumber: data.order_number,
    customerName: data.customer_name,
    fulfillment: data.fulfillment as string,
    address: data.address as string | null,
    total: Number(data.total),
    paymentId: data.payment_reference as string | null,
    storeName: store ? `${store.name} (${store.area})` : null,
    storeSlug: (data.stores as { slug?: string } | null)?.slug ?? null,
    items: ((data.order_items ?? []) as { name: string; quantity: number; note: string }[]).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      note: i.note,
    })),
  };
}
