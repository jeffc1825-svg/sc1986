import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { NotificationBadge, QuoteStatusBadge, quoteStatusOptions } from "@/components/admin/status-badges";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { QuoteRequestRow } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export default async function AdminQuotesPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const status = quoteStatusOptions.some((o) => o.value === sp.status) ? sp.status! : "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  let builder = supabase
    .from("quote_requests")
    .select("*, items:quote_items(id)", { count: "exact" });
  if (status) builder = builder.eq("status", status);
  if (q) {
    const like = `%${q.replace(/[,()]/g, " ")}%`;
    builder = builder.or(
      `reference_code.ilike.${like},customer_name.ilike.${like},email.ilike.${like},company.ilike.${like}`,
    );
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await builder
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`讀取詢價失敗:${error.message}`);

  const quotes = (data ?? []) as (QuoteRequestRow & { items: { id: string }[] })[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${routes.admin.quotes}?${qs}` : routes.admin.quotes;
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">詢價管理</h1>
        <p className="text-sm text-muted-foreground">共 {count ?? 0} 件</p>
      </div>

      <form method="get" action={routes.admin.quotes} className="mb-3 flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="搜尋案件編號 / 姓名 / Email / 公司…"
          aria-label="搜尋詢價"
          className="w-72"
        />
        <Select name="status" defaultValue={status} aria-label="狀態篩選" className="w-36">
          <option value="">全部狀態</option>
          {quoteStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" size="sm" className="h-9">
          篩選
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案件編號</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead className="hidden md:table-cell">品項數</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="hidden lg:table-cell">通知</TableHead>
              <TableHead className="hidden md:table-cell">建立時間</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  沒有符合條件的詢價案件。
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <Link
                      href={routes.admin.quoteDetail(quote.id)}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {quote.reference_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{quote.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {quote.company ? `${quote.company}・` : ""}
                      {quote.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{quote.items.length}</TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <NotificationBadge status={quote.notification_status} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(quote.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
