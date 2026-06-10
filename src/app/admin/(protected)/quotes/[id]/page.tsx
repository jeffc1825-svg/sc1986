import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { NotificationBadge, QuoteStatusBadge } from "@/components/admin/status-badges";
import { QuoteUpdateForm } from "@/components/admin/quote-update-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { QuoteItemRow, QuoteRequestRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quote_requests").select("*").eq("id", id).maybeSingle(),
    supabase.from("quote_items").select("*").eq("quote_request_id", id).order("created_at"),
  ]);

  if (!quote) notFound();
  const q = quote as QuoteRequestRow;
  const quoteItems = (items ?? []) as QuoteItemRow[];

  return (
    <div>
      <Link
        href={routes.admin.quotes}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        回詢價列表
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-mono text-xl font-bold text-foreground">{q.reference_code}</h1>
        <QuoteStatusBadge status={q.status} />
        <NotificationBadge status={q.notification_status} />
        <span className="text-xs text-muted-foreground">建立於 {formatDateTime(q.created_at)}</span>
      </div>

      {q.notification_status === "failed" && q.notification_error ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          通知信寄送失敗,請人工通知業務:{q.notification_error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">客戶資料</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">姓名</dt>
                  <dd className="font-medium text-foreground">{q.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">公司</dt>
                  <dd className="text-foreground">{q.company ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${q.email}?subject=${encodeURIComponent(`[${q.reference_code}] 報價回覆`)}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="size-3.5" aria-hidden />
                      {q.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">電話</dt>
                  <dd>
                    {q.phone ? (
                      <a href={`tel:${q.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Phone className="size-3.5" aria-hidden />
                        {q.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">需求說明</dt>
                  <dd className="whitespace-pre-line text-foreground">{q.message ?? "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">詢價品項({quoteItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>品名(詢價當下快照)</TableHead>
                    <TableHead className="text-right">數量</TableHead>
                    <TableHead>備註</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quoteItems.map((item, i) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-sm">
                        {item.product_id ? (
                          <Link
                            href={routes.admin.productEdit(item.product_id)}
                            className="hover:text-primary"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span>
                            {item.name}
                            <span className="ml-1 text-xs text-muted-foreground">(商品已刪除)</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="max-w-48 text-xs text-muted-foreground">
                        {item.note ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">案件處理</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteUpdateForm quote={q} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
