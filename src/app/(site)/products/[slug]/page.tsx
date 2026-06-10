import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Info } from "lucide-react";
import { routes, productsUrl } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { fetchProductBySlug, fetchRelatedProducts } from "@/lib/catalog/queries";
import { categoryPathById, fetchAllCategories } from "@/lib/catalog/categories";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { SpecTable } from "@/components/catalog/spec-table";
import { PriceDisplay } from "@/components/catalog/price-display";
import { StockBadge } from "@/components/catalog/stock-badge";
import { AddToQuoteWithQuantity } from "@/components/catalog/add-to-quote-button";
import { ProductGrid } from "@/components/catalog/product-card";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(decodeURIComponent(slug));
  if (!product) return { title: "找不到商品" };
  const description =
    product.short_description ??
    `${product.name} — ${siteConfig.shortName} 工業電子材料,線上詢價。`;
  return {
    title: `${product.name} (${product.sku})`,
    description,
    alternates: { canonical: routes.productDetail(product.slug) },
    openGraph: {
      title: `${product.name} (${product.sku})`,
      description,
      images: product.images[0]?.public_url ? [product.images[0].public_url] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(decodeURIComponent(slug));
  if (!product) notFound();

  const related = await fetchRelatedProducts(product);
  // 完整分類路徑(快取小表),麵包屑顯示頂層 → 商品所屬分類
  const categoryPath = product.category
    ? categoryPathById(await fetchAllCategories(), product.category.id)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 麵包屑 */}
      <nav aria-label="麵包屑" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href={routes.home} className="hover:text-primary">
          首頁
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link href={routes.products} className="hover:text-primary">
          商品目錄
        </Link>
        {(categoryPath ?? []).map((c) => (
          <span key={c.id} className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden />
            <Link href={productsUrl({ category: c.slug })} className="hover:text-primary">
              {c.name}
            </Link>
          </span>
        ))}
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{product.sku}</span>
            <StockBadge status={product.stock_status} />
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-snug text-foreground">{product.name}</h1>

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {product.brand ? (
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">品牌</dt>
                <dd>
                  <Link
                    href={productsUrl({ brand: product.brand.slug })}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {product.brand.name}
                  </Link>
                </dd>
              </div>
            ) : null}
            {product.category ? (
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">分類</dt>
                <dd>
                  <Link
                    href={productsUrl({ category: product.category.slug })}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {product.category.name}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>

          {product.short_description ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.short_description}
            </p>
          ) : null}

          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <div className="flex items-baseline gap-2">
              <PriceDisplay priceMode={product.price_mode} price={product.price} size="lg" />
              {product.price_mode === "public_price" && product.price !== null ? (
                <span className="text-xs text-muted-foreground">含稅參考價</span>
              ) : null}
            </div>
            {product.pricing_note ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{product.pricing_note}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              正式價格與交期以業務報價為準;送出詢價後 1 個工作天內回覆。
            </p>
            <div className="mt-4">
              <AddToQuoteWithQuantity
                product={{
                  productId: product.id,
                  sku: product.sku,
                  name: product.name,
                  slug: product.slug,
                  stockStatus: product.stock_status,
                }}
              />
            </div>
          </div>

          {product.ordering_notice ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{product.ordering_notice}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* 規格 */}
      {product.specs.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">商品規格</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <SpecTable specs={product.specs} />
          </div>
        </section>
      ) : null}

      {/* 介紹 */}
      {product.description ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">商品介紹</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {product.description}
            </p>
          </div>
        </section>
      ) : null}

      {/* 相關商品 */}
      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">相關商品</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
