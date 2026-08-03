-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_emails (email) VALUES ('altairwebs24@gmail.com'), ('masekokholizwe101@gmail.com');

-- SETTINGS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.settings (key, value) VALUES
  ('whatsapp_number', '27799155422'),
  ('delivery_fee', '30'),
  ('delivery_area', 'Matsulu'),
  ('special_title', 'IT''S BACK! HOTBOXX SPECIAL'),
  ('special_dates', '03 AUG TO 31 AUG'),
  ('special_body', 'Option 1: Get 2 Burgers and Small Chips with Two Drinks for only R100
Option 2: Buy Any Kota, Burger/Sandwich and Get a Drink for only R10'),
  ('special_drinks', 'Fizzy Drink
Chocolate Milkshake
Bubblegum Milkshake
Lime Milkshake
Strawberry Milkshake'),
  ('tagline', 'While we wait for your order, Hotboxx will be ready to serve your cravings.');

-- MENU
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu items public read" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','preparing','ready','out_for_delivery','completed','cancelled');

CREATE SEQUENCE public.order_number_seq START 1001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('HB-' || nextval('public.order_number_seq')),
  user_id uuid,
  customer_name text NOT NULL,
  phone text NOT NULL,
  fulfillment text NOT NULL DEFAULT 'collection',
  address text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  note text NOT NULL DEFAULT ''
);
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- SEED MENU
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Kota', 'kota', 1),
  ('Kota & Wings Combo', 'kota-wings', 2),
  ('Kota & Nuggets Combo', 'kota-nuggets', 3),
  ('Sandwiches', 'sandwiches', 4),
  ('Sandwich & Chips', 'sandwich-chips', 5),
  ('Sandwich, Chips & Nuggets', 'sandwich-nuggets', 6),
  ('Sandwich, Chips & Wings', 'sandwich-wings', 7),
  ('Burgers', 'burgers', 8),
  ('Burger & Chips', 'burger-chips', 9),
  ('Burger, Chips & Nuggets', 'burger-nuggets', 10),
  ('Burger, Chips & Wings', 'burger-wings', 11);

INSERT INTO public.menu_items (category_id, name, description, price, sort_order)
SELECT c.id, v.name, v.description, v.price, v.sort_order FROM (VALUES
  ('kota','Regular','Polony, vienna, atcha, chips, peri peri & sauces',20,1),
  ('kota','Cheese Boy','Polony, vienna, atcha, chips, peri peri, sauces & cheese',25,2),
  ('kota','BattleHam','Polony, vienna, atcha, chips, peri peri, sauces, cheese & ham',30,3),
  ('kota','Ranger','Polony, vienna, atcha, chips, peri peri, sauces, cheese & russian',35,4),
  ('kota','Bacady','Polony, vienna, atcha, chips, peri peri, sauces, cheese & bacon',35,5),
  ('kota','Legend','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian & bacon',40,6),
  ('kota','Full House','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon, patty & egg',60,7),
  ('kota','Titanic','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon, patty & egg in half a loaf',80,8),
  ('kota','Noah Arch','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russians, patty & eggs in a loaf',120,9),

  ('kota-wings','Regular & Wings','Polony, vienna, atcha, chips, peri peri, sauces & wings',60,1),
  ('kota-wings','Cheese Boy & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese & wings',65,2),
  ('kota-wings','BattleHam & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, ham & wings',70,3),
  ('kota-wings','Ranger & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian & wings',75,4),
  ('kota-wings','Bacady & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, bacon & wings',75,5),
  ('kota-wings','Legend & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon & wings',80,6),
  ('kota-wings','Fullhouse & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon, patty, egg & wings',100,7),
  ('kota-wings','Titanic & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon, patty, egg in half a loaf & wings',120,8),
  ('kota-wings','Noah''s Arch & Wings','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russians, patty, eggs in a loaf & wings',160,9),

  ('kota-nuggets','Regular & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces & nuggets',40,1),
  ('kota-nuggets','Cheese Boy & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese & nuggets',45,2),
  ('kota-nuggets','BattleHam & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, ham & nuggets',50,3),
  ('kota-nuggets','Ranger & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian & nuggets',55,4),
  ('kota-nuggets','Bacady & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, bacon & nuggets',55,5),
  ('kota-nuggets','Legend & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon & nuggets',60,6),
  ('kota-nuggets','Fullhouse & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon, patty, egg & nuggets',80,7),
  ('kota-nuggets','Titanic & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russian, bacon, patty, egg in half a loaf & nuggets',100,8),
  ('kota-nuggets','Noah''s Arch & Nuggets','Polony, vienna, atcha, chips, peri peri, sauces, cheese, russians, patty, eggs in a loaf & nuggets',140,9),

  ('sandwiches','Cheese & Egg','3 slices, cheese & egg',25,1),
  ('sandwiches','Cheese & Tomato','3 slices, cheese & tomato',25,2),
  ('sandwiches','Ham, Cheese & Egg','3 slices, ham, cheese & egg',35,3),
  ('sandwiches','Bacon, Cheese & Egg','3 slices, bacon, cheese & egg',35,4),
  ('sandwiches','Patty, Cheese & Egg','3 slices, patty, cheese & egg',35,5),

  ('sandwich-chips','Cheese, Egg & Chips','3 slices, cheese, egg & chips',40,1),
  ('sandwich-chips','Cheese, Tomato & Chips','3 slices, cheese, tomato & chips',40,2),
  ('sandwich-chips','Ham, Cheese, Egg & Chips','3 slices, ham, cheese, egg & chips',50,3),
  ('sandwich-chips','Bacon, Cheese, Egg & Chips','3 slices, bacon, cheese, egg & chips',50,4),
  ('sandwich-chips','Patty, Cheese, Egg & Chips','3 slices, patty, cheese, egg & chips',50,5),

  ('sandwich-nuggets','Cheese, Egg, Chips & Nuggets','3 slices, cheese, egg, chips & nuggets',60,1),
  ('sandwich-nuggets','Cheese, Tomato, Chips & Nuggets','3 slices, cheese, tomato, chips & nuggets',60,2),
  ('sandwich-nuggets','Ham, Cheese, Egg, Chips & Nuggets','3 slices, ham, cheese, egg, chips & nuggets',70,3),
  ('sandwich-nuggets','Bacon, Cheese, Egg, Chips & Nuggets','3 slices, bacon, cheese, egg, chips & nuggets',70,4),
  ('sandwich-nuggets','Patty, Cheese, Egg, Chips & Nuggets','3 slices, patty, cheese, egg, chips & nuggets',70,5),

  ('sandwich-wings','Cheese, Egg, Chips & Wings','3 slices, cheese, egg, chips & wings',80,1),
  ('sandwich-wings','Cheese, Tomato, Chips & Wings','3 slices, cheese, tomato, chips & wings',80,2),
  ('sandwich-wings','Ham, Cheese, Egg, Chips & Wings','3 slices, ham, cheese, egg, chips & wings',90,3),
  ('sandwich-wings','Bacon, Cheese, Egg, Chips & Wings','3 slices, bacon, cheese, egg, chips & wings',90,4),
  ('sandwich-wings','Patty, Cheese, Egg, Chips & Wings','3 slices, patty, cheese, egg, chips & wings',90,5),

  ('burgers','Cheese Burger','Caramelised onions, tomato, patty, cheese & sauces',35,1),
  ('burgers','Double Cheese Burger','Caramelised onions, tomato, patty, 2 cheese & sauces',40,2),
  ('burgers','Russian Cheese Burger','Caramelised onions, tomato, patty, cheese, russian & sauces',50,3),
  ('burgers','Ham/ Bacon Burger','Caramelised onions, tomato, patty, cheese, ham/bacon & sauces',50,4),
  ('burgers','DBL Cheese DBL Burger','Caramelised onions, tomato, 2 patty, 2 cheese & sauces',65,5),
  ('burgers','Full House Burger','Caramelised onions, tomato, 2 patty, 2 cheese, bacon, ham & sauces',80,6),

  ('burger-chips','Cheese Burger Chips','Caramelised onions, tomato, patty, cheese & sauces',50,1),
  ('burger-chips','Double Cheese Burger Chips','Caramelised onions, tomato, patty, 2 cheese & sauces',55,2),
  ('burger-chips','Russian Cheese Burger Chips','Caramelised onions, tomato, patty, cheese, russian & sauces',65,3),
  ('burger-chips','Ham/ Bacon Burger Chips','Caramelised onions, tomato, patty, cheese, ham/bacon & sauces',65,4),
  ('burger-chips','DBL Cheese DBL Burger Chips','Caramelised onions, tomato, 2 patty, 2 cheese & sauces',80,5),
  ('burger-chips','Full House Burger Chips','Caramelised onions, tomato, 2 patty, 2 cheese, bacon, ham & sauces',95,6),

  ('burger-nuggets','Cheese Burger Chips & Nuggets','Caramelised onions, tomato, patty, cheese & sauces',70,1),
  ('burger-nuggets','Double Cheese Burger Chips & Nuggets','Caramelised onions, tomato, patty, 2 cheese & sauces',75,2),
  ('burger-nuggets','Russian Cheese Burger Chips & Nuggets','Caramelised onions, tomato, patty, cheese, russian & sauces',85,3),
  ('burger-nuggets','Ham/ Bacon Burger Chips & Nuggets','Caramelised onions, tomato, patty, cheese, ham/bacon & sauces',85,4),
  ('burger-nuggets','DBL Cheese DBL Burger Chips & Nuggets','Caramelised onions, tomato, 2 patty, 2 cheese & sauces',100,5),
  ('burger-nuggets','Full House Burger Chips & Nuggets','Caramelised onions, tomato, 2 patty, 2 cheese, bacon/ham & sauces',115,6),

  ('burger-wings','Cheese Burger Chips & Wings','Caramelised onions, tomato, patty, cheese & sauces',90,1),
  ('burger-wings','Double Cheese Burger Chips & Wings','Caramelised onions, tomato, patty, 2 cheese & sauces',95,2),
  ('burger-wings','Russian Cheese Burger Chips & Wings','Caramelised onions, tomato, patty, cheese, russian & sauces',105,3),
  ('burger-wings','Ham/ Bacon Burger Chips & Wings','Caramelised onions, tomato, patty, cheese, ham/bacon & sauces',105,4),
  ('burger-wings','DBL Cheese DBL Burger Chips & Wings','Caramelised onions, tomato, 2 patty, 2 cheese & sauces',120,5),
  ('burger-wings','Full House Burger Chips & Wings','Caramelised onions, tomato, 2 patty, 2 cheese, bacon/ham & sauces',135,6)
) AS v(slug, name, description, price, sort_order)
JOIN public.categories c ON c.slug = v.slug;