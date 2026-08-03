import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailOf = (claims: Record<string, unknown>) =>
  typeof claims["email"] === "string" ? (claims["email"] as string) : null;

export const getAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureAdmin } = await import("./hotboxx.server");
    const isAdmin = await ensureAdmin(context.userId, emailOf(context.claims));
    return { isAdmin, email: emailOf(context.claims) };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin, listAllOrders } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    return listAllOrders();
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "out_for_delivery",
          "completed",
          "cancelled",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        categoryId: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(400).default(""),
        price: z.number().min(0).max(100000),
        available: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price,
      available: data.available,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await supabaseAdmin.from("menu_items").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("menu_items").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ key: z.string().trim().min(1).max(60), value: z.string().max(2000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListAdminEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_emails")
      .select("email, created_at")
      .order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminAddAdminEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().trim().email().max(200) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_emails")
      .upsert({ email: data.email.toLowerCase() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRemoveAdminEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().trim().email().max(200) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./hotboxx.server");
    await requireAdmin(context.userId, emailOf(context.claims));
    const email = data.email.toLowerCase();
    const self = (emailOf(context.claims) ?? "").toLowerCase();
    if (email === self) throw new Error("You cannot remove your own admin access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_emails").delete().eq("email", email);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listOrdersForUser } = await import("./hotboxx.server");
    return listOrdersForUser(context.userId);
  });

export const placeOrderAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => data)
  .handler(async ({ data, context }) => {
    const { createOrder } = await import("./hotboxx.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createOrder(data as any, context.userId);
  });
