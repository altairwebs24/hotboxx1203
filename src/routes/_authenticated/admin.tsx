import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  adminAddAdminEmail,
  adminListAdminEmails,
  adminListOrders,
  adminRemoveAdminEmail,
  adminSaveMenuItem,
  adminUpdateOrderStatus,
  getAdminStatus,
} from "@/lib/admin.functions";
import { STATUS_LABEL, STATUS_ORDER, ZAR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const status = useServerFn(getAdminStatus);
  const listOrders = useServerFn(adminListOrders);
  const setStatus = useServerFn(adminUpdateOrderStatus);
  const saveItem = useServerFn(adminSaveMenuItem);
  const listAdmins = useServerFn(adminListAdminEmails);
  const addAdmin = useServerFn(adminAddAdminEmail);
  const removeAdmin = useServerFn(adminRemoveAdminEmail);
  const [tab, setTab] = useState<"orders" | "menu" | "admins">("orders");
  const [newAdmin, setNewAdmin] = useState("");

  const admin = useQuery({ queryKey: ["admin-status"], queryFn: () => status({}) });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listOrders({}),
    enabled: admin.data?.isAdmin === true,
    refetchInterval: 20000,
  });
  const menu = useQuery({
    queryKey: ["admin-menu"],
    enabled: admin.data?.isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, available, category_id, description, categories(name)")
        .order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const admins = useQuery({
    queryKey: ["admin-emails"],
    queryFn: () => listAdmins({}),
    enabled: admin.data?.isAdmin === true,
  });

  if (admin.isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;

  if (!admin.data?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl">No admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {admin.data?.email} is not on the admin list. Ask an existing admin to add you.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="mt-6 rounded-full border border-border px-6 py-2.5 text-sm font-bold"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">ADMIN <span className="flame-text">PANEL</span></h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="rounded-full border border-border px-4 py-2 text-xs font-bold"
        >
          Sign out
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        {(["orders", "menu", "admins"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${
              tab === t ? "flame-bg text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          {(orders.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
          {(orders.data ?? []).map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl">{o.order_number}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-ZA")} • {o.customer_name} • {o.phone}
                  </p>
                </div>
                <select
                  value={o.status}
                  onChange={async (e) => {
                    try {
                      await setStatus({ data: { orderId: o.id, status: e.target.value as (typeof STATUS_ORDER)[number] } });
                      toast.success("Status updated");
                      qc.invalidateQueries({ queryKey: ["admin-orders"] });
                    } catch {
                      toast.error("Could not update status");
                    }
                  }}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm capitalize text-muted-foreground">
                {o.fulfillment}
                {o.address ? ` — ${o.address}` : ""}
                {o.note ? ` • Note: ${o.note}` : ""}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {i.quantity}× {i.name}
                      {i.note ? ` (${i.note})` : ""}
                    </span>
                    <span>{ZAR(i.unit_price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-border pt-2 font-display text-xl">
                <span>Total {o.delivery_fee ? `(incl. ${ZAR(o.delivery_fee)} delivery)` : ""}</span>
                <span className="text-accent">{ZAR(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "menu" && (
        <div className="mt-6 space-y-2">
          {(menu.data ?? []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.categories as { name: string } | null)?.name}
                </p>
              </div>
              <input
                type="number"
                defaultValue={Number(item.price)}
                min={0}
                step="1"
                onBlur={async (e) => {
                  const price = Number(e.target.value);
                  if (Number.isNaN(price) || price === Number(item.price)) return;
                  try {
                    await saveItem({
                      data: {
                        id: item.id,
                        categoryId: item.category_id,
                        name: item.name,
                        description: item.description ?? "",
                        price,
                        available: item.available,
                      },
                    });
                    toast.success(`${item.name} price updated`);
                    qc.invalidateQueries({ queryKey: ["admin-menu"] });
                  } catch {
                    toast.error("Could not update price");
                  }
                }}
                className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    await saveItem({
                      data: {
                        id: item.id,
                        categoryId: item.category_id,
                        name: item.name,
                        description: item.description ?? "",
                        price: Number(item.price),
                        available: !item.available,
                      },
                    });
                    qc.invalidateQueries({ queryKey: ["admin-menu"] });
                  } catch {
                    toast.error("Could not update item");
                  }
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  item.available ? "border border-border" : "flame-bg text-primary-foreground"
                }`}
              >
                {item.available ? "Available" : "Sold out"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "admins" && (
        <div className="mt-6 max-w-xl space-y-3">
          <div className="flex gap-2">
            <input
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="new.admin@email.com"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
            <button
              onClick={async () => {
                try {
                  await addAdmin({ data: { email: newAdmin } });
                  setNewAdmin("");
                  toast.success("Admin added");
                  qc.invalidateQueries({ queryKey: ["admin-emails"] });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not add admin");
                }
              }}
              className="rounded-full flame-bg px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Add
            </button>
          </div>
          {(admins.data ?? []).map((a) => (
            <div key={a.email} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm">
              <span>{a.email}</span>
              <button
                onClick={async () => {
                  try {
                    await removeAdmin({ data: { email: a.email } });
                    qc.invalidateQueries({ queryKey: ["admin-emails"] });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not remove admin");
                  }
                }}
                className="text-xs font-bold text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
