import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Printer } from "lucide-react";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "關於我們",
  description: `${siteConfig.company.fullName} — 工業電子材料專業供應,詢價與報價流程說明、聯絡方式與營業時間。`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">關於我們</h1>

      <section className="mt-5 space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          {siteConfig.company.fullName}
          長期供應工業電子材料,服務工廠採購、設備維護、自動化設備廠商、電控盤與系統整合商,
          也歡迎需要少量零件與工具的個人客戶。
        </p>
        <p>
          商品涵蓋電子零組件、線材與連接器、電源與電池、開關與感測、自動控制、焊接與 PCB
          相關、工具儀器與五金耗材。除現貨品項外,也提供備料、客製線材加工與替代料建議。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">詢價與報價流程</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          <li>於商品頁將需要的品項加入報價車,逐項填寫數量與需求備註(例如長度、加工、包裝)。</li>
          <li>
            在<Link href={routes.quote} className="mx-0.5 text-primary hover:underline">報價車</Link>
            填寫聯絡方式後送出,系統會提供案件編號,免註冊登入。
          </li>
          <li>業務於 1 個工作天內回覆正式價格、交期與替代料建議。</li>
          <li>價格確認後,由業務協助安排付款與出貨方式(匯款、貨運、自取等)。</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">{siteConfig.notice.pricing}。</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">聯絡方式</h2>
        <Card className="mt-3">
          <CardHeader>
            <CardTitle className="text-base">{siteConfig.company.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2.5 text-sm text-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-primary" aria-hidden />
                {siteConfig.company.phone}
              </li>
              <li className="flex items-center gap-2">
                <Printer className="size-4 text-primary" aria-hidden />
                {siteConfig.company.fax}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-primary" aria-hidden />
                {siteConfig.company.email}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" aria-hidden />
                {siteConfig.company.address}
              </li>
              <li className="flex items-start gap-2 sm:col-span-2">
                <Clock className="mt-0.5 size-4 text-primary" aria-hidden />
                <span>
                  {siteConfig.company.hours.map((h) => (
                    <span key={h} className="block">
                      {h}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
