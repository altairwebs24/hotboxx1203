import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Truck, Timer, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero-kota.jpg.asset.json";
import drinks from "@/assets/drinks.jpg.asset.json";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hotboxx | Order Kotas, Burgers & Combos Online" },
      {
        name: "description",
        content:
          "Hotboxx — the right choice. Order kotas, burgers, sandwiches, wings and nugget combos. Collection or R30 delivery around Matsulu.",
      },
      { property: "og:title", content: "Hotboxx | Order Kotas, Burgers & Combos Online" },
      {
        property: "og:description",
        content: "Kotas, burgers and combos made hot to order. Order online, pay on WhatsApp.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--flame)_35%,transparent),transparent_60%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
              <Flame className="size-3.5" /> Right choice
            </span>
            <h1 className="mt-5 text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              LOADED KOTAS.<br />
              <span className="flame-text">SERIOUS FLAVOUR.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              From the Regular to the legendary Noah's Ark — built fresh, packed full and served
              hot. Order online, get an order number, pay on WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="rounded-full flame-bg px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                Order now
              </Link>
              <Link
                to="/specials"
                className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-secondary"
              >
                See the special
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src={hero.url}
              alt="Hotboxx Noah's Ark kota meal for two"
              className="w-full rounded-3xl border border-border object-cover shadow-2xl"
            />
            <div className="absolute -bottom-5 left-5 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl">
              <p className="font-display text-lg">NOAH'S ARK</p>
              <p className="text-xs text-muted-foreground">Meal for 2 — R120</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {[
          { icon: Timer, title: "Made to order", text: "Everything is grilled and packed fresh when you order." },
          { icon: Truck, title: "R30 delivery", text: "Delivery around Matsulu, or collect from us." },
          { icon: ShieldCheck, title: "Order number", text: "Every order gets a tracking number like HB-1001." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
            <f.icon className="size-6 text-accent" />
            <h3 className="mt-3 text-lg">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2">
          <img src={drinks.url} alt="Hotboxx fizzy drinks" className="h-full w-full object-cover" />
          <div className="p-8">
            <h2 className="text-3xl">ICE COLD FIZZY DRINKS</h2>
            <p className="mt-2 text-muted-foreground">
              R17 each — or grab one for R10 with the current special when you buy any kota, burger
              or sandwich.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/specials" className="rounded-full flame-bg px-5 py-2.5 text-sm font-bold text-primary-foreground">
                View specials
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-5 py-2.5 text-sm font-bold"
              >
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
