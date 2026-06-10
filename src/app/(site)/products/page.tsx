import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { productsUrl } from "@/config/routes";
import { fetchBrands, fetchCatalog } from "@/lib/catalog/queries";
import { buildCategoryTree, fetchAllCategories } from "@/lib/catalog/categories";
import { ProductGrid } from "@/components/catalog/product-card";
import { CatalogSidebar, MobileFilterToggle } from "@/components/catalog/catalog-sidebar";
import { Pagination } from "@/components/ui/pagination";
import type { CatalogQuery } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品目錄",
  description: "瀏覽全部工業電子材料商品,支援 SKU、品名與規格搜尋、分類與庫存篩選,線上加入報價車快速詢價。",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function parseQuery(sp: SearchParams): CatalogQuery {
  const sortRaw = str(sp.sort);
  const pageRaw = Number(str(sp.page) ?? "1");
  return {
    q: str(sp.q)?.slice(0, 80),
    category: str(sp.category),
    brand: str(sp.brand),
    price_mode: ["public_price", "quote_only", "login_or_quote"].includes(str(sp.price_mode) ?? "")
      ? str(sp.price_mode)
      : undefined,
    stock_status: ["in_stock", "preorder", "quote_required", "discontinued"].includes(
      str(sp.stock_status) ?? "",
    )
      ? str(sp.stock_status)
      : undefined,
    sort: sortRaw === "sku" || sortRaw === "name" ? sortRaw : "newest",
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1,
  };
}

const sortOptions = [
  { value: "newest", label: "最新上架" },
  { value: "sku", label: "SKU" },
  { value: "name", label: "品名" },
] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = parseQuery(await searchParams);

  const [catalog, categories, brands] = await Promise.all([
    fetchCatalog(query),
    fetchAllCategories(),
    fetchBrands(),
  ]);
  const tree = buildCategoryTree(categories);
  const currentCategory = query.category
    ? categories.find((c) => c.slug === query.category)
    : undefined;

  const sidebar = <CatalogSidebar tree={tree} brands={brands} query={query} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          {currentCategory ? currentCategory.name : query.q ? `搜尋「${query.q}」` : "商品目錄"}
        </h1>
        {currentCategory?.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{currentCategory.description}</p>
        ) : null}
      </div>

      <div className="mb-4 lg:hidden">
        <MobileFilterToggle>{sidebar}</MobileFilterToggle>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-1">{sidebar}</div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* 工具列:結果數 + 排序 */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
            <p className="text-sm text-muted-foreground">
              共 <span className="font-semibold tabular-nums text-foreground">{catalog.total}</span> 項商品
            </p>
            <div className="flex items-center gap-1 text-sm">
              <span className="mr-1 text-xs text-muted-foreground">排序</span>
              {sortOptions.map((opt) => (
                <Link
                  key={opt.value}
                  href={productsUrl({ ...query, sort: opt.value, page: 1 })}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs transition-colors",
                    query.sort === opt.value
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {catalog.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
              <PackageOpen className="size-10 text-muted-foreground" aria-hidden />
              <p className="font-medium text-foreground">
                {catalog.unknownCategory ? "找不到此分類" : "沒有符合條件的商品"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                試試其他關鍵字或清除篩選;也歡迎直接送出詢價,由業務協助找料。
              </p>
              <Link href={productsUrl({})} className="text-sm font-medium text-primary hover:underline">
                清除條件,瀏覽全部商品
              </Link>
            </div>
          ) : (
            <>
              <ProductGrid products={catalog.items} />
              <div className="mt-6">
                <Pagination
                  currentPage={catalog.page}
                  totalPages={catalog.totalPages}
                  hrefFor={(page) => productsUrl({ ...query, page })}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
