"use client";

import * as React from "react";
import { Check, FilePlus2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuoteCart } from "@/components/quote/quote-cart-provider";
import { quoteCartLimits } from "@/config/storage";
import type { ProductStockStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ProductInfo {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  stockStatus: ProductStockStatus;
}

/** 商品卡用:小型加入按鈕 */
export function AddToQuoteButton({ product, className }: { product: ProductInfo; className?: string }) {
  const { addItem } = useQuoteCart();
  const [added, setAdded] = React.useState(false);
  const discontinued = product.stockStatus === "discontinued";

  if (discontinued) {
    return (
      <Button variant="outline" size="sm" className={cn("w-full", className)} disabled>
        停產品,請洽替代料
      </Button>
    );
  }

  return (
    <Button
      variant={added ? "secondary" : "outline"}
      size="sm"
      className={cn("w-full", className)}
      onClick={() => {
        const ok = addItem(product);
        if (!ok) {
          window.alert(`報價車最多 ${quoteCartLimits.maxItems} 項,請先送出目前的詢價。`);
          return;
        }
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? <Check aria-hidden /> : <FilePlus2 aria-hidden />}
      {added ? "已加入" : "加入報價車"}
    </Button>
  );
}

/** 詳情頁用:數量 stepper + 加入按鈕 */
export function AddToQuoteWithQuantity({ product }: { product: ProductInfo }) {
  const { addItem } = useQuoteCart();
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const discontinued = product.stockStatus === "discontinued";

  if (discontinued) {
    return (
      <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        本商品已停產,無法直接詢價訂購;您仍可送出詢價,由業務為您推薦替代料件。
      </div>
    );
  }

  const set = (q: number) =>
    setQuantity(Math.min(quoteCartLimits.maxQuantity, Math.max(1, Math.round(q) || 1)));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border border-input bg-card">
        <button
          type="button"
          aria-label="減少數量"
          className="inline-flex h-10 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          onClick={() => set(quantity - 1)}
          disabled={quantity <= 1}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={quoteCartLimits.maxQuantity}
          value={quantity}
          onChange={(e) => set(Number(e.target.value))}
          aria-label="數量"
          className="h-10 w-16 border-x border-input bg-transparent text-center text-sm tabular-nums text-foreground focus-visible:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="增加數量"
          className="inline-flex h-10 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => set(quantity + 1)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <Button
        size="lg"
        onClick={() => {
          const ok = addItem(product, quantity);
          if (!ok) {
            window.alert(`報價車最多 ${quoteCartLimits.maxItems} 項,請先送出目前的詢價。`);
            return;
          }
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? <Check aria-hidden /> : <FilePlus2 aria-hidden />}
        {added ? "已加入報價車" : "加入報價車"}
      </Button>
    </div>
  );
}
