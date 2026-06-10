import { Search } from "lucide-react";
import { routes } from "@/config/routes";

/** 純 HTML GET 表單 — 無 JS 也可搜尋,SEO 友善 */
export function SearchForm({ defaultValue, className }: { defaultValue?: string; className?: string }) {
  return (
    <form action={routes.products} method="get" role="search" className={className}>
      <div className="relative">
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="搜尋 SKU、品名、規格…"
          aria-label="搜尋商品"
          className="h-9 w-full rounded-md border border-input bg-card pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          aria-label="搜尋"
          className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
