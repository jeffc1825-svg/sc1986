import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "詢價已送出",
  robots: { index: false },
};

export default async function QuoteSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const reference = typeof ref === "string" && /^Q[0-9]{8}-[0-9A-Z]{4,8}$/.test(ref) ? ref : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
      <CheckCircle2 className="size-14 text-green-600 dark:text-green-400" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold text-foreground">詢價已送出</h1>

      {reference ? (
        <div className="mt-4 rounded-lg border border-border bg-card px-6 py-4">
          <p className="text-xs text-muted-foreground">您的案件編號</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-primary">{reference}</p>
        </div>
      ) : null}

      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
        業務將於 1 個工作天內(營業時間 {siteConfig.company.hours[0]})以 Email 或電話回覆價格與交期。
        若需加急,歡迎來電 {siteConfig.company.phone} 並告知案件編號。
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={routes.products}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          繼續瀏覽商品
        </Link>
        <Link
          href={routes.home}
          className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          回首頁
        </Link>
      </div>
    </div>
  );
}
