import Link from "next/link";
import {
  ArrowRight,
  Cable,
  CircuitBoard,
  ClipboardList,
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

export const dynamic = "force-dynamic";

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
  const [newProducts, categories, brands, stats] = await Promise.all([
    fetchNewProducts(8),
    fetchAllCategories(),
    fetchBrands(),
    fetchCatalogStats(),
  ]);
  const tree = buildCategoryTree(categories);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-red-800 text-white dark:to-red-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <p className="text-sm font-medium tracking-wide opacity-90">工業電子材料專業供應</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            找料、確認規格、整理數量
            <br />
            一張詢價單,業務幫你搞定
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed opacity-90">
            電子零組件、線材連接器、電源控制、感測自動化、工具耗材。把需要的品項加入報價車,
            免登入送出詢價,1 個工作天內回覆價格與交期。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={routes.products}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-6 text-sm font-medium text-primary transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Search className="size-4" aria-hidden />
              瀏覽全部商品
            </Link>
            <Link
              href={routes.quote}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-white/40 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ClipboardList className="size-4" aria-hidden />
              我的報價車
            </Link>
          </div>
        </div>
      </section>

      {/* 分類捷徑 */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold text-foreground">商品分類</h2>
          <Link href={routes.products} className="text-sm text-primary hover:underline">
            全部商品
          </Link>
        </div>
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
          <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            商品上架準備中,歡迎先與我們聯絡詢價。
          </p>
        )}
      </section>

      {/* 詢價流程 + 統計 */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">詢價流程</h2>
            <ol className="mt-4 space-y-4">
              {[
                {
                  icon: Search,
                  title: "1. 搜尋與加入報價車",
                  text: "以 SKU、品名或規格找到商品,逐項加入並填寫數量與備註。",
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
              ].map((step) => (
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
                <p className="text-3xl font-bold tabular-nums text-primary">{stats.inStock.toLocaleString("zh-TW")}</p>
                <p className="mt-1 text-xs text-muted-foreground">現貨品項</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-5 text-center">
                <p className="text-3xl font-bold tabular-nums text-primary">{stats.active.toLocaleString("zh-TW")}</p>
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
      </section>
    </div>
  );
}
