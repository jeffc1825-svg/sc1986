import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { productsUrl } from "@/config/routes";
import { findNodeBySlug } from "@/lib/catalog/categories";
import { CategorySidebarTree } from "@/components/catalog/category-sidebar-tree";
import type { BrandRow, CatalogQuery, CategoryNode } from "@/types";
import { cn } from "@/lib/utils";

const priceModeOptions = [
  { value: "public_price", label: "有參考價" },
  { value: "quote_only", label: "需詢價" },
  { value: "login_or_quote", label: "報價後提供" },
];

const stockOptions = [
  { value: "in_stock", label: "現貨" },
  { value: "preorder", label: "可預訂" },
  { value: "quote_required", label: "需確認交期" },
  { value: "discontinued", label: "停產品" },
];

interface CatalogSidebarProps {
  tree: CategoryNode[];
  brands: BrandRow[];
  query: CatalogQuery;
}

/**
 * 目錄側欄 — 全部以連結驅動(伺服器端篩選、SEO 友善、無 JS 依賴)。
 * 行動版由外層 <details> 收合。
 */
export function CatalogSidebar({ tree, brands, query }: CatalogSidebarProps) {
  const base = { q: query.q, sort: query.sort };
  const hasFilter =
    !!query.category || !!query.brand || !!query.price_mode || !!query.stock_status;

  // 預設展開:選取分類的祖先 + 自身(client 樹元件可再手動展開其他節點)
  const found = query.category ? findNodeBySlug(tree, query.category) : null;
  const defaultExpandedIds = found ? [...found.ancestorIds, found.node.id] : [];

  return (
    <div className="space-y-5">
      {hasFilter ? (
        <Link
          href={productsUrl({ q: query.q })}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3.5" aria-hidden />
          清除全部篩選
        </Link>
      ) : null}

      <section aria-label="商品分類">
        <h2 className="mb-2 text-sm font-semibold text-foreground">商品分類</h2>
        <ul className="space-y-0.5">
          <li>
            <SidebarLink href={productsUrl({ ...base })} active={!query.category}>
              全部商品
            </SidebarLink>
          </li>
          <CategorySidebarTree
            nodes={tree}
            base={base}
            activeSlug={query.category}
            defaultExpandedIds={defaultExpandedIds}
          />
        </ul>
      </section>

      <FilterSection
        title="價格模式"
        options={priceModeOptions}
        current={query.price_mode}
        hrefFor={(v) =>
          productsUrl({ ...base, category: query.category, brand: query.brand, stock_status: query.stock_status, price_mode: v })
        }
      />

      <FilterSection
        title="庫存狀態"
        options={stockOptions}
        current={query.stock_status}
        hrefFor={(v) =>
          productsUrl({ ...base, category: query.category, brand: query.brand, price_mode: query.price_mode, stock_status: v })
        }
      />

      <FilterSection
        title="品牌"
        options={brands.map((b) => ({ value: b.slug, label: b.name }))}
        current={query.brand}
        hrefFor={(v) =>
          productsUrl({ ...base, category: query.category, price_mode: query.price_mode, stock_status: query.stock_status, brand: v })
        }
      />
    </div>
  );
}

function FilterSection({
  title,
  options,
  current,
  hrefFor,
}: {
  title: string;
  options: { value: string; label: string }[];
  current?: string;
  hrefFor: (value: string | undefined) => string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = current === opt.value;
          return (
            <Link
              key={opt.value}
              href={hrefFor(active ? undefined : opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function MobileFilterToggle({ children }: { children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-border bg-card lg:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="size-4 text-primary" aria-hidden />
        分類與篩選
        <span className="ml-auto text-xs text-muted-foreground group-open:hidden">展開</span>
        <span className="ml-auto hidden text-xs text-muted-foreground group-open:inline">收合</span>
      </summary>
      <div className="border-t border-border p-4">{children}</div>
    </details>
  );
}
