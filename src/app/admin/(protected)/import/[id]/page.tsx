import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { ImportStatusBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { ProductImportBatchRow, ProductImportRowRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: batch }, { data: rows }] = await Promise.all([
    supabase.from("product_import_batches").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("product_import_rows")
      .select("*")
      .eq("batch_id", id)
      .order("row_number")
      .limit(500),
  ]);

  if (!batch) notFound();
  const b = batch as ProductImportBatchRow;
  const importRows = (rows ?? []) as ProductImportRowRow[];

  return (
    <div>
      <Link
        href={routes.admin.import}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        回匯入紀錄
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            {b.original_filename}
            <ImportStatusBadge status={b.status} />
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDateTime(b.created_at)}・共 {b.row_count} 列・成功{" "}
            <span className="text-green-700 dark:text-green-400">{b.success_count}</span>・失敗{" "}
            <span className="text-destructive">{b.error_count}</span>
          </p>
        </div>
        {b.error_count > 0 ? (
          <a href={routes.admin.importErrors(b.id)}>
            <Button variant="outline" size="sm">
              <Download aria-hidden />
              下載錯誤列 CSV
            </Button>
          </a>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">列號</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>品名</TableHead>
              <TableHead>結果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importRows.map((row) => {
              const raw = (row.raw_data ?? {}) as Record<string, string>;
              return (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums text-muted-foreground">{row.row_number}</TableCell>
                  <TableCell className="font-mono text-xs">{raw.sku ?? "—"}</TableCell>
                  <TableCell className="max-w-64 truncate text-sm">{raw.name ?? "—"}</TableCell>
                  <TableCell>
                    {row.error_message ? (
                      <span className="text-xs text-destructive">{row.error_message}</span>
                    ) : row.product_id ? (
                      <Link
                        href={routes.admin.productEdit(row.product_id)}
                        className="text-xs font-medium text-green-700 hover:underline dark:text-green-400"
                      >
                        已建立草稿,前往編輯
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {b.row_count > 500 ? (
        <p className="mt-2 text-xs text-muted-foreground">僅顯示前 500 列,完整錯誤請下載 CSV。</p>
      ) : null}
    </div>
  );
}
