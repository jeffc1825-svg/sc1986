"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { routes } from "@/config/routes";
import { useQuoteCart } from "@/components/quote/quote-cart-provider";
import { cn } from "@/lib/utils";

export function QuoteCartButton({ className }: { className?: string }) {
  const { count, ready } = useQuoteCart();

  return (
    <Link
      href={routes.quote}
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={`報價車,目前 ${ready ? count : 0} 項`}
    >
      <FileText className="size-4 text-primary" aria-hidden />
      <span className="hidden sm:inline">報價車</span>
      {ready && count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
