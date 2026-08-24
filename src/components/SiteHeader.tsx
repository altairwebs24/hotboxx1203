import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, ShoppingBag, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { StoreBar } from "@/components/StoreBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WHATSAPP_DISPLAY } from "@/lib/format";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/specials", label: "Specials" },
  { to: "/track", label: "Track order" },
];

export function SiteHeader() {
  const { count } = useCart();
  const { logo } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="Hotboxx logo"
            className="size-10 rounded-full object-cover ring-2 ring-primary/60"
          />

          <span className="font-display text-xl tracking-wide">
            HOT<span className="flame-text">BOXX</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                pathname === l.to
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <a
            href={`https://wa.me/27799155422`}
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground sm:block"
          >
            {WHATSAPP_DISPLAY}
          </a>
          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 rounded-full flame-bg px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-background text-[11px] font-bold text-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border p-2 md:hidden"
          >
            {open ? <X className="size-4" /> : <MenuIcon className="size-4" />}
          </button>
        </div>
      </div>

      <StoreBar />

      {open && (
        <nav className="border-t border-border bg-card px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold"
            >
              <Flame className="size-4 text-accent" />
              {l.label}
            </Link>
          ))}
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold"
          >
            <Flame className="size-4 text-accent" />
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
