import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock } from "lucide-react";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl">
            HOT<span className="flame-text">BOXX</span>
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Right choice. Kotas, burgers, sandwiches and combos made hot to order.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-accent" />
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              WhatsApp / Call {WHATSAPP_DISPLAY}
            </a>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 text-accent" /> Delivery around Matsulu — R30
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-accent" /> Collection also available
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <Link to="/menu" className="block text-muted-foreground hover:text-foreground">
            Full menu
          </Link>
          <Link to="/specials" className="block text-muted-foreground hover:text-foreground">
            Hotboxx special
          </Link>
          <Link to="/track" className="block text-muted-foreground hover:text-foreground">
            Track your order
          </Link>
          <Link to="/auth" className="block text-muted-foreground hover:text-foreground">
            Admin / sign in
          </Link>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hotboxx. Payments are completed on WhatsApp.
      </p>
    </footer>
  );
}
