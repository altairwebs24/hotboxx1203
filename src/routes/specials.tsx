import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/format";
import drinks from "@/assets/drinks.jpg.asset.json";

export const Route = createFileRoute("/specials")({
  head: () => ({
    meta: [
      { title: "Hotboxx Special | 2 Burgers + Chips + 2 Drinks R100" },
      {
        name: "description",
        content:
          "It's back! The Hotboxx Special runs 03 Aug to 31 Aug: 2 burgers, small chips and 2 drinks for R100, or any kota/burger/sandwich plus a drink for R10.",
      },
      { property: "og:title", content: "Hotboxx Special — Meal Deals" },
      {
        property: "og:description",
        content: "2 burgers + small chips + 2 drinks for R100, or add any drink for R10.",
      },
    ],
  }),
  component: Specials,
});

const DRINKS = [
  "Fizzy Drink",
  "Chocolate Milkshake",
  "Bubblegum Milkshake",
  "Lime Milkshake",
  "Strawberry Milkshake",
];

function Specials() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
        <Flame className="size-3.5" /> It's back!
      </span>
      <h1 className="mt-4 text-5xl">
        HOTBOXX <span className="flame-text">SPECIAL</span>
      </h1>
      <p className="mt-2 font-semibold text-muted-foreground">03 AUG TO 31 AUG</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-accent/40 bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Option 1</p>
          <h2 className="mt-2 text-2xl leading-tight">2 Burgers + Small Chips + 2 Drinks</h2>
          <p className="mt-3 font-display text-4xl flame-text">R100</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Option 2</p>
          <h2 className="mt-2 text-2xl leading-tight">
            Buy any Kota, Burger or Sandwich and get a drink
          </h2>
          <p className="mt-3 font-display text-4xl flame-text">R10</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card sm:flex">
        <img src={drinks.url} alt="Fizzy drinks" className="h-48 w-full object-cover sm:h-auto sm:w-1/2" />
        <div className="p-6">
          <h2 className="text-2xl">Drink options</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {DRINKS.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <Flame className="size-3.5 text-accent" /> {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-secondary/40 p-6">
        <h2 className="text-2xl">Contact & order info</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Build your order here and checkout for an order number, or WhatsApp / call{" "}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="font-bold text-accent">
            {WHATSAPP_DISPLAY}
          </a>
          . Add the special you want in the order notes at checkout.
        </p>
        <p className="mt-3 text-sm italic text-muted-foreground">
          "While we wait for your order, Hotboxx will be ready to serve your cravings."
        </p>
        <Link
          to="/menu"
          className="mt-5 inline-block rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          Start your order
        </Link>
      </div>
    </div>
  );
}
