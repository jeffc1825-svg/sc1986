"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { storageKeys } from "@/config/storage";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={storageKeys.theme}
    >
      {children}
    </NextThemesProvider>
  );
}
