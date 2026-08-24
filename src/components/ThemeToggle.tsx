import { Palette } from "lucide-react";
import { useTheme, THEMES, type ThemeKey } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const i = THEMES.findIndex((t) => t.key === theme);
    const target = THEMES[(i + 1) % THEMES.length];
    if (target) setTheme(target.key as ThemeKey);
  };


  return (
    <button
      onClick={next}
      aria-label={`Switch theme (current: ${THEMES.find((t) => t.key === theme)?.label})`}
      title={`Theme: ${THEMES.find((t) => t.key === theme)?.label}`}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:bg-muted"
    >
      <Palette className="size-4 text-accent" />
      <span className="hidden sm:inline">{THEMES.find((t) => t.key === theme)?.label}</span>
      <span className="flex items-center gap-1">
        {THEMES.map((t) => (
          <span
            key={t.key}
            className={`size-1.5 rounded-full ${t.key === theme ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </span>
    </button>
  );
}
