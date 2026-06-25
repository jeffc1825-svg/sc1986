"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

const order = ["light", "dark", "system"] as const;
const labels: Record<(typeof order)[number], string> = {
  light: "淺色模式",
  dark: "深色模式",
  system: "跟隨系統",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = (order.includes(theme as never) ? theme : "system") as (typeof order)[number];
  const next = order[(order.indexOf(current) + 1) % order.length];

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted ? `主題:${labels[current]},點擊切換` : "切換主題"}
      title={mounted ? labels[current] : undefined}
      onClick={() => setTheme(next)}
    >
      {!mounted ? (
        <Sun aria-hidden />
      ) : current === "light" ? (
        <Sun aria-hidden />
      ) : current === "dark" ? (
        <Moon aria-hidden />
      ) : (
        <Monitor aria-hidden />
      )}
    </Button>
  );
}
