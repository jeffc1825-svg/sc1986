import Image from "next/image";
import Link from "next/link";
import { Clock, Facebook, Mail, MapPin, Phone, Printer } from "lucide-react";
import { routes, productsUrl } from "@/config/routes";
import { siteConfig } from "@/config/site";

const quoteFeature = siteConfig.features.quoteRequest;

const serviceLinks = [
  { label: "全部商品", href: routes.products },
  { label: "現貨商品", href: productsUrl({ stock_status: "in_stock" }) },
  { label: "可詢價商品", href: productsUrl({ price_mode: "quote_only" }) },
  ...(quoteFeature.enabled ? [{ label: quoteFeature.label, href: routes.quote }] : []),
];

const infoLinks = [
  { label: "關於我們", href: routes.about },
  { label: "詢價與報價流程", href: routes.about },
  { label: "聯絡方式", href: routes.about },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src={siteConfig.brand.logo}
              alt={siteConfig.brand.logoAlt}
              width={36}
              height={36}
              className="size-9"
            />
            <span className="font-bold text-foreground">{siteConfig.shortName}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            工業電子材料專業供應。線上整理需求、快速詢價,業務專人回覆價格與交期。
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{siteConfig.notice.pricing}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">商品服務</h3>
          <ul className="mt-3 space-y-2">
            {serviceLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">服務台</h3>
          <ul className="mt-3 space-y-2">
            {infoLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {siteConfig.company.fullName}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" aria-hidden />
              {siteConfig.company.phone}
            </li>
            <li className="flex items-center gap-2">
              <Printer className="size-3.5 shrink-0" aria-hidden />
              {siteConfig.company.fax}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              {siteConfig.company.email}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {siteConfig.company.address}
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {siteConfig.company.hours.map((h) => (
                  <span key={h} className="block">
                    {h}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Facebook className="size-3.5 shrink-0" aria-hidden />
              <a
                href={siteConfig.links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                Facebook 粉絲專頁
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} {siteConfig.company.fullName} All rights reserved.
          統一編號 {siteConfig.company.taxId}
        </p>
      </div>
    </footer>
  );
}
