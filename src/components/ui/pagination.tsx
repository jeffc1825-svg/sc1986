import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** 由呼叫端(Server Component)提供頁碼 → 連結的轉換 */
  hrefFor: (page: number) => string;
}

/** 伺服器端分頁(純連結,SEO 友善) */
export function Pagination({ currentPage, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const window = 2;
  let last = 0;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= window) {
      if (last && p - last > 1) pages.push("...");
      pages.push(p);
      last = p;
    }
  }

  const linkCls =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-card px-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav aria-label="分頁" className="flex flex-wrap items-center justify-center gap-1.5">
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className={linkCls} aria-label="上一頁">
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              linkCls,
              p === currentPage &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} className={linkCls} aria-label="下一頁">
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
