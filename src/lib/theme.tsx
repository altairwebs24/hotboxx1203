import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import logoRed from "@/assets/hotboxx-logo-red.jpg.asset.json";
import logoBlack from "@/assets/hotboxx-logo-black.jpg.asset.json";

export type ThemeKey = "red" | "mono";

export const THEMES: { key: ThemeKey; label: string; logo: string }[] = [
  { key: "red", label: "Red logo", logo: logoRed.url },
  { key: "mono", label: "Black logo", logo: logoBlack.url },
];

const STORAGE_KEY = "hotboxx-theme";

type Ctx = { theme: ThemeKey; setTheme: (t: ThemeKey) => void; logo: string };
const ThemeContext = createContext<Ctx>({ theme: "flame", setTheme: () => {}, logo: logoFlame.url });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>("flame");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    if (saved && THEMES.some((t) => t.key === saved)) setThemeState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-flame", "theme-red", "theme-mono");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = (t: ThemeKey) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  const logo = THEMES.find((t) => t.key === theme)?.logo ?? logoFlame.url;

  return <ThemeContext.Provider value={{ theme, setTheme, logo }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
