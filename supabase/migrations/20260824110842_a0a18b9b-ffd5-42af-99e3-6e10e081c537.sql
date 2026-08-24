CREATE TABLE public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  area text not null default '',
  address text not null default '',
  phone text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.stores TO anon;
GRANT SELECT ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores public read" ON public.stores FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.stores (name, slug, area, sort_order) VALUES
  ('Days', 'days', 'Matsulu C', 1),
  ('Boxer Complex', 'boxer-complex', 'Boxer Complex', 2),
  ('eRingin', 'eringin', 'Matsulu B', 3);

ALTER TABLE public.orders ADD COLUMN store_id uuid REFERENCES public.stores(id);