/**
 * GA4 事件追蹤 — client 端共用 helper。
 * gtag 未載入(開發環境 / 使用者封鎖)時靜默略過,不得影響功能。
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params ?? {});
}
