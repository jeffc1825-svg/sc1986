import { cn, formatPrice } from "@/lib/utils";
import type { ProductPriceMode } from "@/types";

interface PriceDisplayProps {
  priceMode: ProductPriceMode;
  price: number | null;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * 價格顯示唯一入口 — 嚴格依 price_mode 分流。
 * quote_only / login_or_quote 即使資料庫有 price 也絕不顯示數字。
 */
export function PriceDisplay({ priceMode, price, size = "sm", className }: PriceDisplayProps) {
  const base = size === "lg" ? "text-2xl" : "text-base";

  if (priceMode === "public_price" && price !== null) {
    return (
      <span className={cn(base, "font-bold tabular-nums text-foreground", className)}>
        {formatPrice(price)}
      </span>
    );
  }

  if (priceMode === "public_price") {
    // 公開價商品但價格未填:顯示詢價,不顯示 0 或空白
    return <span className={cn(base, "font-bold text-primary", className)}>$詢價</span>;
  }

  if (priceMode === "quote_only") {
    return <span className={cn(base, "font-bold text-primary", className)}>$詢價</span>;
  }

  // login_or_quote
  return (
    <span className={cn(size === "lg" ? "text-lg" : "text-sm", "font-medium text-muted-foreground", className)}>
      報價後提供
    </span>
  );
}
