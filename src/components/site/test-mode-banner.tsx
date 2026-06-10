import { TriangleAlert } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * 測試期頂部提示列 — 正式上線時自 (site)/layout.tsx 移除。
 */
export function TestModeBanner() {
  return (
    <div className="bg-destructive text-destructive-foreground">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium sm:text-sm">
        <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
        {siteConfig.notice.testing}
      </p>
    </div>
  );
}
