import Image from "next/image";
import Link from "next/link";
import { Clock, Phone } from "lucide-react";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { buildCategoryTree, fetchAllCategories } from "@/lib/catalog/categories";
import { SearchForm } from "@/components/site/search-form";
import { QuoteCartButton } from "@/components/site/quote-cart-button";
import { CategoryNav } from "@/components/site/category-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function SiteHeader() {
  const categories = await fetchAllCategories();
  const tree = buildCategoryTree(categories);

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* 頂部資訊列 */}
      <div className="bg-foreground text-background dark:bg-card dark:text-foreground dark:border-b dark:border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <p className="truncate opacity-90">{siteConfig.notice.topBar}</p>
          <div className="hidden items-center gap-4 sm:flex">
            <span className="inline-flex items-center gap-1 opacity-90">
              <Phone className="size-3" aria-hidden />
              {siteConfig.company.phone}
            </span>
            <span className="inline-flex items-center gap-1 opacity-90">
              <Clock className="size-3" aria-hidden />
              {siteConfig.company.hours[0]}
            </span>
          </div>
        </div>
      </div>

      {/* 主列:Logo + 搜尋 + 報價車 */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link href={routes.home} className="flex shrink-0 items-center gap-2" aria-label="回首頁">
            <Image
              src={siteConfig.brand.logo}
              alt={siteConfig.brand.logoAlt}
              width={40}
              height={40}
              priority
              className="size-10"
            />
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-lg font-bold tracking-wide text-foreground">
                {siteConfig.shortName}
              </span>
              <span className="text-[11px] text-muted-foreground">工業電子材料</span>
            </span>
          </Link>

          <SearchForm className="min-w-0 flex-1 sm:mx-auto sm:max-w-xl" />

          <div className="flex shrink-0 items-center gap-1.5">
            <QuoteCartButton />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <CategoryNav tree={tree} />
    </header>
  );
}
