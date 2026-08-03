# Hotboxx — Ordering App

A mobile-first food ordering app for Hotboxx with a full menu, cart, order numbers, WhatsApp payment handoff, and a built-in admin panel.

## Brand & look

Flame-inspired dark/red identity taken from the logo: deep charcoal surfaces, hot orange-to-red gradient accents, bold condensed headings, rounded cards with big product prices — the polish level of Uber Eats / Debonairs, not a generic template.

- Logo used in header, footer, and as favicon source.
- The Noah's Ark photo is cropped (screenshot chrome removed) and used as the homepage hero.
- The fizzy drink photo is cropped and used for the drinks/special section.
- Global CSS rule hides anything with id `lovable-badge`.

## Customer experience

- **Home** — hero, live special banner, category shortcuts, featured items.
- **Menu** — categories: Kota, Kota & Wings Combo, Kota & Nuggets Combo, Sandwiches, Sandwich & Chips, Sandwich & Nuggets, Sandwich & Wings, Burgers, Burgers & Chips, Burger & Nuggets, Burger & Wings. Every item and price from the uploaded menus is entered exactly as shown.
- **Specials page** — the 03 Aug–31 Aug Meal Deals (2 burgers + small chips + 2 drinks for R100; any Kota/Burger/Sandwich + drink for R10) with the five drink options listed (Fizzy, Chocolate, Bubblegum, Lime, Strawberry).
- **Cart** — quantities, notes per item, running total, delivery toggle (R30 delivery fee around Matsulu, or free collection).
- **Checkout** — name, phone, delivery address if delivery. Order is saved and given a friendly order number (e.g. `HB-1042`), then a pre-filled WhatsApp message to 079 915 5422 opens for payment.
- **Order tracking** — customers can look up an order by number and see status (Pending → Confirmed → Preparing → Ready → Out for delivery → Completed / Cancelled).
- **Optional accounts** — guests can order; signed-in customers also see their order history.

## Admin panel

- Sign-up/sign-in with no email confirmation step.
- `Altairwebs24@gmail.com` and `masekokholizwe101@gmail.com` are seeded as admins; any admin can promote another email to admin.
- Live order list with details, and one-tap status updates.
- Edit any menu item price, name, description, or availability; add/remove items.
- Edit the running special text and the delivery fee.

## Technical notes

- Lovable Cloud (database + auth) backs menu items, orders, order items, roles, and settings.
- Roles live in a separate `user_roles` table with a `has_role()` security-definer function — never on the profile row. Admin-only reads/writes are enforced with RLS, so a customer cannot change prices or see others' orders.
- Menu content and the two seed admin emails are inserted via migration so the app is populated on first load.
- Order numbers are generated server-side from a sequence, not on the client.
- Auth is configured with auto-confirm so admin signup is instant.
- Uploaded images are cropped and stored as project assets referenced by URL.
- No online payment integration — payment stays on WhatsApp.

## Notes

- Drinks are only referenced through the special for now (no standalone drinks menu with prices).
