import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ImageOff, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminAddItemImage, adminDeleteItemImage, adminSaveMenuItem, adminSaveSetting } from "@/lib/admin.functions";
import { NO_DEFAULT_PREFIX, fetchHiddenDefaults } from "@/lib/default-images";
import { fetchItemPhotos, MENU_BUCKET } from "@/lib/item-photos";

export type EditableItem = {
  id?: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category_id: string;
};

export function MenuItemEditor({
  item,
  categories,
  onClose,
}: {
  item: EditableItem;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(adminSaveMenuItem);
  const addImage = useServerFn(adminAddItemImage);
  const deleteImage = useServerFn(adminDeleteItemImage);
  const saveSetting = useServerFn(adminSaveSetting);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EditableItem>(item);
  const [itemId, setItemId] = useState<string | undefined>(item.id);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hidden = useQuery({ queryKey: ["hidden-default-images"], queryFn: fetchHiddenDefaults });
  const defaultHidden = Boolean(itemId && (hidden.data ?? []).includes(itemId));

  const toggleDefault = async () => {
    if (!itemId) {
      toast.error("Save the item first");
      return;
    }
    try {
      await saveSetting({
        data: { key: `${NO_DEFAULT_PREFIX}${itemId}`, value: defaultHidden ? "0" : "1" },
      });
      qc.invalidateQueries({ queryKey: ["hidden-default-images"] });
      toast.success(defaultHidden ? "Default photo restored" : "Default photo removed");
    } catch {
      toast.error("Could not update the default photo");
    }
  };

  const photos = useQuery({
    queryKey: ["admin-item-photos", itemId],
    enabled: Boolean(itemId),
    queryFn: () => fetchItemPhotos(itemId as string),
  });

  const saveItem = async () => {
    if (!form.name.trim() || !form.category_id) {
      toast.error("Name and category are required");
      return null;
    }
    setBusy(true);
    try {
      const res = await save({
        data: {
          ...(itemId ? { id: itemId } : {}),
          categoryId: form.category_id,
          name: form.name.trim(),
          description: form.description,
          price: Number(form.price),
          available: form.available,
        },
      });
      setItemId(res.id);
      qc.invalidateQueries({ queryKey: ["admin-menu"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Saved");
      return res.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save item");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const upload = async (files: FileList) => {
    let id = itemId;
    if (!id) {
      id = (await saveItem()) ?? undefined;
      if (!id) return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(MENU_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        await addImage({ data: { menuItemId: id, path } });
      }
      toast.success("Photos uploaded");
      qc.invalidateQueries({ queryKey: ["admin-item-photos", id] });
      qc.invalidateQueries({ queryKey: ["menu-item-photos", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-3 space-y-4 rounded-2xl border border-accent/40 bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">{itemId ? "Edit item" : "New item"}</h3>
        <button onClick={onClose} aria-label="Close editor" className="text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Full House Kota"
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal normal-case text-foreground"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Category
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal normal-case text-foreground"
          >
            <option value="">Choose category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Price (R)
          <input
            type="number"
            min={0}
            step="1"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal normal-case text-foreground"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Availability
          <select
            value={form.available ? "yes" : "no"}
            onChange={(e) => setForm({ ...form, available: e.target.value === "yes" })}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal normal-case text-foreground"
          >
            <option value="yes">Available</option>
            <option value="no">Sold out</option>
          </select>
        </label>
      </div>

      <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        What's on it (description)
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Chips, polony, russian, cheese, egg, atchar…"
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal normal-case text-foreground"
        />
      </label>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Photos</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {(photos.data ?? []).map((p) => (
            <div key={p.id} className="relative size-24 overflow-hidden rounded-xl border border-border">
              <img src={p.src} alt="Menu item" className="size-full bg-black object-contain" />
              <button
                aria-label="Delete photo"
                onClick={async () => {
                  try {
                    await deleteImage({ data: { id: p.id } });
                    qc.invalidateQueries({ queryKey: ["admin-item-photos", itemId] });
                    qc.invalidateQueries({ queryKey: ["menu-item-photos", itemId] });
                  } catch {
                    toast.error("Could not delete photo");
                  }
                }}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="grid size-24 place-items-center rounded-xl border border-dashed border-border text-muted-foreground"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && e.target.files.length > 0 && upload(e.target.files)}
        />
        <button
          onClick={toggleDefault}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold"
        >
          <ImageOff className="size-3.5" />
          {defaultHidden ? "Restore default menu photo" : "Remove default menu photo"}
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Upload one or more photos (max 10MB each). The first photo shows on the item page. The
          default photo is the crop from the printed menu flyer.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={saveItem}
          disabled={busy}
          className="rounded-full flame-bg px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save item"}
        </button>
        <button onClick={onClose} className="rounded-full border border-border px-6 py-2.5 text-sm font-bold">
          Done
        </button>
      </div>
    </div>
  );
}
