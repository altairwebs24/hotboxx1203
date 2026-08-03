import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Flame, ShoppingBag, Search } from "lucide-react";
import { useCart } from "@/lib/cart";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/specials", label: "Specials", icon: Flame },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/track", label: "Track", icon: Search },
];

export function BottomNav() {
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors ${
                  active ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <t.icon className="size-5" />
                  {t.to === "/cart" && count > 0 && (
                    <span className="absolute -right-2.5 -top-2 grid size-4 place-items-center rounded-full flame-bg text-[10px] text-primary-foreground">
                      {count}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
