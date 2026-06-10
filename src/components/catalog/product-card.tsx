import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { assets } from "@/config/storage";
import type { ProductListItem } from "@/types";
import { PriceDisplay } from "@/components/catalog/price-display";
import { StockBadge } from "@/components/catalog/stock-badge";
import { AddToQuoteButton } from "@/components/catalog/add-to-quote-button";

/** 商品卡 — 所有商品列表共用(圖、SKU、品名、價格、現貨 badge) */
export function ProductCard({ product }: { product: ProductListItem }) {
  const href = routes.productDetail(product.slug);
  const imgSrc = product.cover_image?.public_url || assets.productPlaceholder;
  const imgAlt = product.cover_image?.alt || product.name;

  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative block overflow-hidden rounded-md bg-white"
      >
        <div className="relative aspect-square">
          <Image
            src={imgSrc}
            alt={imgAlt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform group-hover:scale-105"
          />
        </div>
        <StockBadge
          status={product.stock_status}
          className="absolute left-1.5 top-1.5"
        />
      </Link>

      <div className="mt-2 flex flex-1 flex-col gap-1">
        <span className="font-mono text-xs text-muted-foreground">
          {product.sku}
        </span>
        <Link
          href={href}
          className="line-clamp-2 min-h-10 text-sm leading-5 text-foreground transition-colors group-hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between pt-1">
          <PriceDisplay priceMode={product.price_mode} price={product.price} />
          {product.brand ? (
            <span className="truncate pl-2 text-xs text-muted-foreground">
              {product.brand.name}
            </span>
          ) : null}
        </div>
      </div>

      <AddToQuoteButton
        className="mt-2"
        product={{
          productId: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          stockStatus: product.stock_status,
        }}
      />
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
