import { Badge } from "@/components/ui/badge";
import type { ProductStockStatus } from "@/types";

const config: Record<
  ProductStockStatus,
  { label: string; variant: "success" | "warning" | "info" | "muted" }
> = {
  in_stock: { label: "現貨", variant: "success" },
  preorder: { label: "可預訂", variant: "warning" },
  quote_required: { label: "需確認交期", variant: "info" },
  discontinued: { label: "停產品", variant: "muted" },
};

export function StockBadge({
  status,
  className,
}: {
  status: ProductStockStatus;
  className?: string;
}) {
  const { label, variant } = config[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
