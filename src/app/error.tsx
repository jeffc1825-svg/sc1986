"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 全站錯誤邊界 — fail-closed:
 * 顯示中性錯誤畫面,絕不以示範資料掩蓋資料庫或設定錯誤。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SC1986] 頁面錯誤:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-bold text-foreground">系統暫時無法提供服務</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        資料載入發生錯誤,請稍後再試。若持續發生,請以電話或 Email 與我們聯絡。
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">錯誤代碼:{error.digest}</p>
      ) : null}
      <Button onClick={reset} variant="outline">
        重新載入
      </Button>
    </div>
  );
}
