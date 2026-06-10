"use client";

import { useCallback, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { siteConfig } from "@/config/site";
import { storageKeys } from "@/config/storage";
import { Button } from "@/components/ui/button";

/**
 * 測試期首次進站提醒 popup — 關閉後寫入 localStorage,不再重複顯示。
 * 正式上線時自 (site)/layout.tsx 移除。
 */
export function TestModeNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKeys.testNoticeDismissed) !== "1") {
        setOpen(true);
      }
    } catch {
      // localStorage 不可用(隱私模式等)時仍顯示,僅無法記住已關閉狀態
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKeys.testNoticeDismissed, "1");
    } catch {
      // 寫入失敗則下次進站仍會顯示,不影響瀏覽
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-mode-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0">
            <h2 id="test-mode-notice-title" className="text-base font-bold text-foreground">
              測試網站提醒
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {siteConfig.notice.testing}。
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={dismiss} autoFocus>
            我知道了
          </Button>
        </div>
      </div>
    </div>
  );
}
