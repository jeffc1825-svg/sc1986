"use client";

import * as React from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";

/**
 * GA4(gtag.js)— 只在 production build 載入。
 * - 初始 config 關閉自動 page_view,改由 <PageViewTracker> 於每次路由變化
 *   (含首次載入)送出,避免 App Router SPA 導航漏記或與自動偵測重複計數。
 * - gtag stub 以同步 inline script 先行定義,事件在 gtag.js 載入前會排入
 *   dataLayer 佇列,不會遺失。
 * 註:GA4 後台「加強型評估 → 依瀏覽器歷程記錄變更網頁瀏覽」建議關閉,避免重複計數。
 */

const GA_ID = siteConfig.analytics.ga4Id;

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const qs = searchParams.toString();
    window.gtag?.("event", "page_view", {
      page_path: qs ? `${pathname}?${qs}` : pathname,
      send_to: GA_ID,
    });
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production" || !GA_ID) return null;

  return (
    <>
      <script
        // gtag stub:同步定義,確保早期事件進入 dataLayer 佇列
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config','${GA_ID}',{send_page_view:false});`,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
    </>
  );
}
