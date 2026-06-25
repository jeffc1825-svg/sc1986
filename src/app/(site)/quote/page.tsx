import type { Metadata } from "next";
import { QuotePageClient } from "@/components/quote/quote-page-client";

export const metadata: Metadata = {
  title: "我要詢價",
  description: "整理品項數量與備註,填寫聯絡方式後免登入送出詢價,業務將於 1 個工作天內回覆。",
};

export default function QuotePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-foreground">我要詢價</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        確認品項與數量,填寫聯絡資料後送出;業務將回覆正式價格與交期。
      </p>
      <QuotePageClient />
    </div>
  );
}
