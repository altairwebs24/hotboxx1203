import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminSaveSetting } from "@/lib/admin.functions";
import { MENU_BUCKET } from "@/lib/item-photos";
import { fetchSiteImages, SITE_IMAGES, SITE_IMAGE_DEFAULTS, SITE_IMAGE_PREFIX, type SiteImageKey } from "@/lib/site-images";

export function SiteImagesEditor() {
  const qc = useQueryClient();
  const saveSetting = useServerFn(adminSaveSetting);
  const [busyKey, setBusyKey] = useState<SiteImageKey | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const images = useQuery({ queryKey: ["site-images"], queryFn: fetchSiteImages });

  const refresh = () => qc.invalidateQueries({ queryKey: ["site-images"] });

  const upload = async (key: SiteImageKey, file: File) => {
    setBusyKey(key);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `site/${key}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(MENU_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      await saveSetting({ data: { key: `${SITE_IMAGE_PREFIX}${key}`, value: path } });
      toast.success("Image updated");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusyKey(null);
      const el = inputs.current[key];
      if (el) el.value = "";
    }
  };

  const reset = async (key: SiteImageKey) => {
    setBusyKey(key);
    try {
      await saveSetting({ data: { key: `${SITE_IMAGE_PREFIX}${key}`, value: "" } });
      toast.success("Reset to the default image");
      refresh();
    } catch {
      toast.error("Could not reset image");
    } finally {
      setBusyKey(null);
    }
  };

  const map = images.data ?? SITE_IMAGE_DEFAULTS;

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {SITE_IMAGES.map((img) => (
        <div key={img.key} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
          <img
            src={map[img.key]}
            alt={img.label}
            className="size-24 shrink-0 rounded-xl border border-border object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{img.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{img.hint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="file"
                accept="image/*"
                hidden
                ref={(el) => {
                  inputs.current[img.key] = el;
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(img.key, file);
                }}
              />
              <button
                disabled={busyKey === img.key}
                onClick={() => inputs.current[img.key]?.click()}
                className="inline-flex items-center gap-1.5 rounded-full flame-bg px-3.5 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
              >
                {busyKey === img.key ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="size-3.5" />
                )}
                Change
              </button>
              <button
                disabled={busyKey === img.key}
                onClick={() => void reset(img.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold disabled:opacity-60"
              >
                <RotateCcw className="size-3.5" /> Default
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
