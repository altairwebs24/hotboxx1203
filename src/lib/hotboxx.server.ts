// Server-only helpers for Hotboxx ordering + admin.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { placeOrderSchema, type PlaceOrderInput } from "./order-schemas";

export type OrderRecord = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  fulfillment: string;
  address: string;
  note: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; unit_price: number; quantity: number; note: string }[];
};

export async function createOrder(raw: PlaceOrderInput, userId: string | null) {
  const data = placeOrderSchema.parse(raw);

  const ids = data.items.map((i) => i.id);
  const { data: menu, error: menuError } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, available")
    .in("id", ids);
  if (menuError) throw new Error(menuError.message);
  if (!menu || menu.length === 0) throw new Error("No valid items in the order");

  const lines = data.items
    .map((line) => {
      const item = menu.find((m) => m.id === line.id);
      if (!item || !item.available) return null;
      return {
        menu_item_id: item.id,
        name: item.name,
        unit_price: Number(item.price),
        quantity: line.quantity,
        note: line.note ?? "",
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) throw new Error("The items in your cart are no longer available");

  const { data: feeRow } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "delivery_fee")
    .maybeSingle();

  const subtotal = lines.reduce((n, l) => n + l.unit_price * l.quantity, 0);
  const deliveryFee = data.fulfillment === "delivery" ? Number(feeRow?.value ?? 30) : 0;
  const total = subtotal + deliveryFee;

  const { data: store, error: storeError } = await supabaseAdmin
    .from("stores")
    .select("id, name, area")
    .eq("id", data.storeId)
    .eq("active", true)
    .maybeSingle();
  if (storeError) throw new Error(storeError.message);
  if (!store) throw new Error("Please choose a store to order from");

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      store_id: store.id,
      user_id: userId,
      customer_name: data.customerName,
      phone: data.phone,
      fulfillment: data.fulfillment,
      address: data.fulfillment === "delivery" ? data.address : "",
      note: data.note ?? "",
      subtotal,
      delivery_fee: deliveryFee,
      total,
    })
    .select("id, order_number, subtotal, delivery_fee, total, status, created_at")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Could not create order");

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));
  if (itemsError) throw new Error(itemsError.message);

  return {
    orderNumber: order.order_number,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    status: order.status as string,
    items: lines.map((l) => ({ name: l.name, quantity: l.quantity, unit_price: l.unit_price, note: l.note })),
  };
}

export type OrderStatusResult = {
  order_number: string;
  status: string;
  created_at: string;
};

/** Public lookup: returns ONLY the order number, status and time — no customer details. */
export async function findOrderStatus(orderNumber: string): Promise<OrderStatusResult | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("order_number, status, created_at")
    .ilike("order_number", orderNumber.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { order_number: data.order_number, status: data.status as string, created_at: data.created_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shapeOrder(row: any): OrderRecord {
  return {
    id: row.id,
    order_number: row.order_number,
    customer_name: row.customer_name,
    phone: row.phone,
    fulfillment: row.fulfillment,
    address: row.address,
    note: row.note,
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    created_at: row.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.order_items ?? []).map((i: any) => ({
      name: i.name,
      unit_price: Number(i.unit_price),
      quantity: i.quantity,
      note: i.note,
    })),
  };
}

/** Returns true if the user is an admin, promoting them if their email is on the admin list. */
export async function ensureAdmin(userId: string, email: string | null): Promise<boolean> {
  const { data: roleRow } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleRow) return true;

  if (!email) return false;
  const { data: allowed } = await supabaseAdmin
    .from("admin_emails")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!allowed) return false;

  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
  return true;
}

export async function requireAdmin(userId: string, email: string | null) {
  const ok = await ensureAdmin(userId, email);
  if (!ok) throw new Error("Forbidden: admins only");
}

export async function listAllOrders() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, customer_name, phone, fulfillment, address, note, subtotal, delivery_fee, total, status, created_at, order_items(name, unit_price, quantity, note)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []).map(shapeOrder);
}

export async function listOrdersForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, customer_name, phone, fulfillment, address, note, subtotal, delivery_fee, total, status, created_at, order_items(name, unit_price, quantity, note)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map(shapeOrder);
}
