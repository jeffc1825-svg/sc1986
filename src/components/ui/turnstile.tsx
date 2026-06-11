"use client";

import * as React from "react";
import { useTheme } from "next-themes";

/**
 * Cloudflare Turnstile widget(explicit render)。
 * - Managed 模式:平常隱形通過,可疑流量才顯示互動驗證。
 * - 主題跟隨 next-themes(light/dark 重新渲染 widget)。
 * - token 取得/過期/錯誤一律回呼 onToken(token | null)。
 * - 父層可透過 ref.reset() 在送出失敗後重置(token 為一次性)。
 */

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile script 載入失敗"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface TurnstileHandle {
  /** 重置 widget(送出失敗後必須呼叫,token 為一次性) */
  reset: () => void;
}

interface TurnstileProps {
  siteKey: string;
  /** token 取得時回傳字串;過期/錯誤時回傳 null */
  onToken: (token: string | null) => void;
  ref?: React.Ref<TurnstileHandle>;
}

export function Turnstile({ siteKey, onToken, ref }: TurnstileProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<string | null>(null);
  const onTokenRef = React.useRef(onToken);
  onTokenRef.current = onToken;

  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  const [failed, setFailed] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        onTokenRef.current(null);
      }
    },
  }));

  React.useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size: "flexible",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      onTokenRef.current(null);
    };
  }, [siteKey, theme]);

  if (failed) {
    return (
      <p className="text-xs text-destructive" role="alert">
        人機驗證載入失敗,請檢查網路後重新整理頁面。
      </p>
    );
  }

  return <div ref={containerRef} aria-label="人機驗證" />;
}
