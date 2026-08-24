import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Store = {
  id: string;
  name: string;
  slug: string;
  area: string;
};

const KEY = "hotboxx.store";

type StoreContextValue = {
  stores: Store[];
  storeId: string | null;
  store: Store | null;
  setStoreId: (id: string) => void;
  loading: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreIdState] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async (): Promise<Store[]> => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, area")
        .eq("active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const stores = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    if (saved) setStoreIdState(saved);
  }, []);

  // Drop a saved store that no longer exists.
  useEffect(() => {
    if (!storeId || stores.length === 0) return;
    if (!stores.some((s) => s.id === storeId)) setStoreIdState(null);
  }, [storeId, stores]);

  function setStoreId(id: string) {
    setStoreIdState(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }

  const value: StoreContextValue = {
    stores,
    storeId,
    store: stores.find((s) => s.id === storeId) ?? null,
    setStoreId,
    loading: isLoading,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStores() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStores must be used inside StoreProvider");
  return ctx;
}
