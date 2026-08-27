CREATE TABLE public.menu_item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_item_images TO anon;
GRANT SELECT ON public.menu_item_images TO authenticated;
GRANT ALL ON public.menu_item_images TO service_role;

ALTER TABLE public.menu_item_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu item images public read"
  ON public.menu_item_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX menu_item_images_item_idx ON public.menu_item_images (menu_item_id, sort_order);

CREATE POLICY "admins upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "public read menu images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-images');