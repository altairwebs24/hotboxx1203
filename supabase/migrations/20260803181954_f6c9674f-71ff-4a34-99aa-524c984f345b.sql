INSERT INTO public.categories (name, slug, sort_order) VALUES ('Drinks', 'drinks', 12)
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (category_id, name, description, price, sort_order)
SELECT c.id, v.name, v.description, v.price, v.sort_order
FROM public.categories c,
(VALUES
  ('Fizzy Drink', 'Ice cold fizzy drink — R10 with any kota, burger or sandwich (special price)', 10, 1),
  ('Chocolate Milkshake', 'R10 with any kota, burger or sandwich (special price)', 10, 2),
  ('Bubblegum Milkshake', 'R10 with any kota, burger or sandwich (special price)', 10, 3),
  ('Lime Milkshake', 'R10 with any kota, burger or sandwich (special price)', 10, 4),
  ('Strawberry Milkshake', 'R10 with any kota, burger or sandwich (special price)', 10, 5)
) AS v(name, description, price, sort_order)
WHERE c.slug = 'drinks'
AND NOT EXISTS (SELECT 1 FROM public.menu_items m WHERE m.category_id = c.id);