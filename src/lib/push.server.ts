// Server-only push notifications to admin devices via Firebase Cloud Messaging.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

/** Sends an alert to every registered admin device. Never throws — alerts must not break an order. */
export async function notifyAdminsOfPaidOrder(input: {
  orderNumber: string;
  total: number;
  storeName?: string | null;
}) {
  try {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (!lovableKey || !connectionKey) {
      console.warn("[push] messaging is not configured; skipping admin alert");
      return;
    }

    const { data: tokens, error } = await supabaseAdmin
      .from("admin_push_tokens")
      .select("id, token");
    if (error) throw new Error(error.message);
    if (!tokens || tokens.length === 0) return;

    const body = `${input.storeName ? `${input.storeName} — ` : ""}R${input.total.toFixed(2)} paid`;

    for (const row of tokens) {
      const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": connectionKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title: `New paid order ${input.orderNumber}`, body },
            data: { path: "/admin", orderNumber: input.orderNumber },
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[push] send failed [${res.status}]: ${text}`);
        if (res.status === 404 || res.status === 400) {
          await supabaseAdmin.from("admin_push_tokens").delete().eq("id", row.id);
        }
      }
    }
  } catch (err) {
    console.error("[push] admin alert failed", err);
  }
}
