import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Cable,
  CircuitBoard,
  Cpu,
  Flame,
  Hammer,
  MailCheck,
  PackageCheck,
  Plug,
  Search,
  Settings2,
  ToggleLeft,
  Wrench,
} from "lucide-react";
import { routes, productsUrl } from "@/config/routes";
import { siteConfig } from "@/config/site";
import {
  fetchBrands,
  fetchCatalogStats,
  fetchNewProducts,
} from "@/lib/catalog/queries";
import { buildCategoryTree, fetchAllCategories } from "@/lib/catalog/categories";
import { ProductGrid } from "@/components/catalog/product-card";
import { hasSupabasePublicEnv } from "@/lib/env";
import {
  HomeCarousel,
  type HomeCarouselSlide,
} from "@/components/site/home-carousel";

export const dynamic = "force-dynamic";

type HomeData = {
  newProducts: Awaited<ReturnType<typeof fetchNewProducts>>;
  categories: Awaited<ReturnType<typeof fetchAllCategories>>;
  brands: Awaited<ReturnType<typeof fetchBrands>>;
  stats: Awaited<ReturnType<typeof fetchCatalogStats>> | null;
  hasDataError: boolean;
};

/** 分類 icon 對應(依 slug,缺省用 CircuitBoard) */
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "electronic-components": Cpu,
  "wires-connectors": Cable,
  "power-batteries": Plug,
  "switches-sensors": ToggleLeft,
  automation: Settings2,
  "soldering-pcb": Flame,
  "tools-instruments": Wrench,
  "hardware-consumables": Hammer,
};

export default async function HomePage() {
  const { newProducts, categories, brands, stats, hasDataError } =
    await loadHomeData();
  const tree = buildCategoryTree(categories);
  const quoteFeature = siteConfig.features.quoteRequest;
  const carouselSlides: HomeCarouselSlide[] = siteConfig.homeHighlights.map(
    (slide) => {
      const quoteRelated = slide.action === "quote" || slide.icon === "quote";
      if (!quoteFeature.enabled && quoteRelated) {
        return {
          ...slide,
          title: quoteFeature.disabledTitle,
          description: quoteFeature.disabledMessage,
          actionLabel: "查看聯絡方式",
          href: routes.about,
        };
      }

      return {
        ...slide,
        href: slide.action === "quote" ? routes.quote : routes.products,
      };
    },
  );
  const quoteSteps = quoteFeature.enabled
    ? [
        {
          icon: Search,
          title: `1. 搜尋與${quoteFeature.label}`,
          text: "以 SKU、品名或規格找到商品,逐項加入詢價清單並填寫數量與備註。",
        },
        {
          icon: MailCheck,
          title: "2. 免登入送出詢價",
          text: "留下聯絡方式即可送出,系統立即產生案件編號。",
        },
        {
          icon: PackageCheck,
          title: "3. 業務回覆報價",
          text: "1 個工作天內回覆價格、交期與替代料建議,確認後安排出貨。",
        },
      ]
    : [
        {
          icon: Search,
          title: `1. ${quoteFeature.disabledTitle}`,
          text: quoteFeature.disabledMessage,
        },
        {
          icon: MailCheck,
          title: "2. 電話或 Email 聯絡",
          text: "請提供 SKU、品名、數量與需求備註,由業務協助確認。",
        },
        {
          icon: PackageCheck,
          title: "3. 業務協助回覆",
          text: "我們會依品項、數量與交期需求回覆價格與替代料建議。",
        },
      ];

  return (
    <div>
      <HomeCarousel
        slides={carouselSlides}
        logo={siteConfig.brand.logo}
        logoAlt={siteConfig.brand.logoAlt}
      />

      {/* 分類捷徑 */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold text-foreground">商品分類</h2>
          <Link href={routes.products} className="text-sm text-primary hover:underline">
            全部商品
          </Link>
        </div>
        {tree.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tree.map((cat) => {
              const Icon = categoryIcons[cat.slug] ?? CircuitBoard;
              return (
                <Link
                  key={cat.id}
                  href={productsUrl({ category: cat.slug })}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {cat.name}
                    </span>
                    {cat.children.length > 0 ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {cat.children.map((c) => c.name).join("・")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <DataUnavailableNotice message="商品分類資料暫時無法載入,可先使用上方搜尋或直接來電詢價。" />
        )}
      </section>

      {/* 本月新品 */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold text-foreground">最新上架</h2>
          <Link
            href={productsUrl({ sort: "newest" })}
            className="inline-flex items-center gap-0.5 text-sm text-primary hover:underline"
          >
            更多新品
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        {newProducts.length > 0 ? (
          <ProductGrid products={newProducts} />
        ) : (
          <DataUnavailableNotice
            message={
              hasDataError
                ? "最新上架資料暫時無法載入,歡迎先以電話或 Email 聯絡詢價。"
                : "商品上架準備中,歡迎先與我們聯絡詢價。"
            }
          />
        )}
      </section>

      {/* 詢價流程 + 統計 */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">詢價流程</h2>
            <ol className="mt-4 space-y-4">
              {quoteSteps.map((step) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <step.icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col justify-center gap-6 md:items-end">
            <div className="grid w-full grid-cols-2 gap-4 md:max-w-sm">
              <div className="rounded-lg border border-border bg-background p-5 text-center">
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {stats ? stats.inStock.toLocaleString("zh-TW") : "--"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">現貨品項</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-5 text-center">
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {stats ? stats.active.toLocaleString("zh-TW") : "--"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">商品筆數</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground md:max-w-sm md:text-right">
              {siteConfig.notice.pricing}
            </p>
          </div>
        </div>
      </section>

      {/* 品牌牆 */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-4 text-xl font-bold text-foreground">代理與經銷品牌</h2>
        {brands.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={productsUrl({ brand: brand.slug })}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        ) : (
          <DataUnavailableNotice message="品牌資料暫時無法載入,如需指定品牌料件,請直接送出詢價。" />
        )}
      </section>
    </div>
  );
}

async function loadHomeData(): Promise<HomeData> {
  if (!hasSupabasePublicEnv()) {
    if (isProductionRuntime()) {
      throw new Error("[SC1986] 缺少 Supabase 公開環境變數");
    }

    return emptyHomeData();
  }

  const [newProducts, categories, brands, stats] = await Promise.allSettled([
    fetchNewProducts(8),
    fetchAllCategories(),
    fetchBrands(),
    fetchCatalogStats(),
  ]);

  const failures = [newProducts, categories, brands, stats].filter(
    (result) => result.status === "rejected",
  );

  if (failures.length > 0) {
    const reasons = failures.map((failure) => failure.reason);

    if (isProductionRuntime()) {
      throw new AggregateError(reasons, "[SC1986] 首頁資料載入失敗");
    }
  }

  return {
    newProducts:
      newProducts.status === "fulfilled" ? newProducts.value : [],
    categories: categories.status === "fulfilled" ? categories.value : [],
    brands: brands.status === "fulfilled" ? brands.value : [],
    stats: stats.status === "fulfilled" ? stats.value : null,
    hasDataError: failures.length > 0,
  };
}

function emptyHomeData(): HomeData {
  return {
    newProducts: [],
    categories: [],
    brands: [],
    stats: null,
    hasDataError: true,
  };
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function DataUnavailableNotice({ message }: { message: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
      <div>
        <AlertTriangle className="mx-auto size-5 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
