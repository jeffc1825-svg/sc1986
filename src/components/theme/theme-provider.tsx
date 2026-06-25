"use client";

import * as React from "react";
import { storageKeys } from "@/config/storage";

const themeValues = ["light", "dark", "system"] as const;
type Theme = (typeof themeValues)[number];
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: Theme[];
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const mediaQuery = "(prefers-color-scheme: dark)";
const defaultTheme: Theme = "system";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themeValues.includes(value as Theme);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return defaultTheme;

  try {
    const stored = window.localStorage.getItem(storageKeys.theme);
    return isTheme(stored) ? stored : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function readSystemTheme(query?: MediaQueryList): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  const matches = query
    ? query.matches
    : window.matchMedia(mediaQuery).matches;
  return matches ? "dark" : "light";
}

function resolveTheme(theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme {
  return theme === "system" ? systemTheme : theme;
}

function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(readStoredTheme);
  const [systemTheme, setSystemTheme] =
    React.useState<ResolvedTheme>(readSystemTheme);

  const resolvedTheme = resolveTheme(theme, systemTheme);

  const setTheme = React.useCallback<ThemeContextValue["setTheme"]>((value) => {
    setThemeState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      const safeNext = isTheme(next) ? next : defaultTheme;

      try {
        window.localStorage.setItem(storageKeys.theme, safeNext);
      } catch {
        // localStorage 不可用時仍允許本次頁面切換主題。
      }

      return safeNext;
    });
  }, []);

  React.useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  React.useEffect(() => {
    const query = window.matchMedia(mediaQuery);
    const updateSystemTheme = () => setSystemTheme(readSystemTheme(query));

    query.addEventListener("change", updateSystemTheme);
    return () => query.removeEventListener("change", updateSystemTheme);
  }, []);

  React.useEffect(() => {
    const syncStoredTheme = (event: StorageEvent) => {
      if (event.key === storageKeys.theme) setThemeState(readStoredTheme());
    };

    window.addEventListener("storage", syncStoredTheme);
    return () => window.removeEventListener("storage", syncStoredTheme);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      themes: [...themeValues],
      setTheme,
    }),
    [theme, resolvedTheme, systemTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context) return context;

  return (
    {
      theme: defaultTheme,
      resolvedTheme: "light",
      systemTheme: "light",
      themes: [...themeValues],
      setTheme: () => {},
    } satisfies ThemeContextValue
  );
}
