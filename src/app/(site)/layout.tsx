import { QuoteCartProvider } from "@/components/quote/quote-cart-provider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { TestModeBanner } from "@/components/site/test-mode-banner";
import { TestModeNotice } from "@/components/site/test-mode-notice";

/**
 * 前台所有頁面一律動態渲染:
 * Header 需即時讀取分類,且 build 不得依賴資料庫連線(fail-closed)。
 */
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuoteCartProvider>
      <div className="flex min-h-dvh flex-col">
        <TestModeBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      <TestModeNotice />
    </QuoteCartProvider>
  );
}
