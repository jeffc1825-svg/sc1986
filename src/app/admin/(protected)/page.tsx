import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { QuoteStatusBadge } from "@/components/admin/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { QuoteRequestRow } from "@/types";

export const dynamic = "force-dynamic";

async function count(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  table: string,
  filters: Record<string, string>,
): Promise<number> {
  let builder = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters)) builder = builder.eq(k, v);
  const { count: c } = await builder;
  return c ?? 0;
}

export default async function AdminDashboardPage() {
  const { supabase, admin } = await requireAdmin();

  const [
    activeCount,
    draftCount,
    archivedCount,
    newQuotes,
    reviewingQuotes,
    failedNotifications,
    recentQuotesRes,
  ] = await Promise.all([
    count(supabase, "products", { status: "active" }),
    count(supabase, "products", { status: "draft" }),
    count(supabase, "products", { status: "archived" }),
    count(supabase, "quote_requests", { status: "new" }),
    count(supabase, "quote_requests", { status: "reviewing" }),
    count(supabase, "quote_requests", { notification_status: "failed" }),
    supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recentQuotes = (recentQuotesRes.data ?? []) as QuoteRequestRow[];

  const stats = [
    { label: "上架中商品", value: activeCount, href: `${routes.admin.products}?status=active` },
    { label: "草稿待審核", value: draftCount, href: `${routes.admin.products}?status=draft` },
    { label: "已封存", value: archivedCount, href: `${routes.admin.products}?status=archived` },
    { label: "新詢價案件", value: newQuotes, href: `${routes.admin.quotes}?status=new` },
    { label: "處理中案件", value: reviewingQuotes, href: `${routes.admin.quotes}?status=reviewing` },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">儀表板</h1>
        <p className="text-sm text-muted-foreground">您好,{admin.name}。</p>
      </div>

      {failedNotifications > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <p>
            有 {failedNotifications} 件詢價的通知信寄送失敗,請至詢價管理確認並人工通知業務。
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">最新詢價</CardTitle>
          <Link
            href={routes.admin.quotes}
            className="inline-flex items-center gap-0.5 text-sm text-primary hover:underline"
          >
            全部案件
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">尚無詢價案件。</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentQuotes.map((quote) => (
                <li key={quote.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <Link
                    href={routes.admin.quoteDetail(quote.id)}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {quote.reference_code}
                  </Link>
                  <QuoteStatusBadge status={quote.status} />
                  <span className="text-sm text-foreground">
                    {quote.customer_name}
                    {quote.company ? `(${quote.company})` : ""}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDateTime(quote.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
