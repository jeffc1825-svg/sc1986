"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { routes } from "@/config/routes";
import type { ProductListItem } from "@/types";
import { bulkDeleteAction, bulkUpdateStatusAction } from "@/lib/admin/product-actions";
import { ProductStatusBadge } from "@/components/admin/status-badges";
import { PriceDisplay } from "@/components/catalog/price-display";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export function ProductsTable({ products }: { products: ProductListItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));
  const ids = React.useMemo(() => Array.from(selected), [selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: () => Promise<{ error: string | null; success?: string | null }>) {
    setPending(true);
    setMessage(null);
    try {
      const result = await action();
      setMessage(result.error ?? result.success ?? null);
      if (!result.error) {
        setSelected(new Set());
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {/* 批量操作列 */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-xs text-muted-foreground">
          已選 <span className="font-semibold tabular-nums text-foreground">{selected.size}</span> 筆
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={pending || ids.length === 0}
            onClick={() => runBulk(() => bulkUpdateStatusAction(ids, "active"))}
          >
            上架
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending || ids.length === 0}
            onClick={() => runBulk(() => bulkUpdateStatusAction(ids, "draft"))}
          >
            轉草稿
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending || ids.length === 0}
            onClick={() => runBulk(() => bulkUpdateStatusAction(ids, "archived"))}
          >
            封存
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || ids.length === 0}
            onClick={() => {
              if (window.confirm(`確定刪除 ${ids.length} 筆商品?圖片將一併刪除,無法復原。`)) {
                runBulk(() => bulkDeleteAction(ids));
              }
            }}
          >
            刪除
          </Button>
        </div>
        {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="全選"
                  className="size-4 accent-[var(--primary)]"
                />
              </TableHead>
              <TableHead>SKU / 品名</TableHead>
              <TableHead className="hidden md:table-cell">分類</TableHead>
              <TableHead className="hidden md:table-cell">價格</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="hidden lg:table-cell">更新日</TableHead>
              <TableHead className="w-16 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  沒有符合條件的商品。
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      aria-label={`選取 ${p.sku}`}
                      className="size-4 accent-[var(--primary)]"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    <Link
                      href={routes.admin.productEdit(p.id)}
                      className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <PriceDisplay priceMode={p.price_mode} price={p.price} />
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {formatDate(p.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={routes.admin.productEdit(p.id)}
                      aria-label={`編輯 ${p.sku}`}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
