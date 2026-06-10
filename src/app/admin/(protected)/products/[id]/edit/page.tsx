import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { ProductStatusBadge } from "@/components/admin/status-badges";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/catalog/categories";
import type { BrandRow, CategoryRow, ProductImageRow, ProductRow, ProductSpecRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: product }, { data: brands }, { data: categories }, { data: specs }, { data: images }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("brands").select("*").order("name"),
      supabase.from("categories").select("*").order("sort_order").order("name"),
      supabase.from("product_specs").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
    ]);

  if (!product) notFound();
  const p = product as ProductRow;

  return (
    <div>
      <Link
        href={routes.admin.products}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        回商品列表
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-foreground">編輯商品</h1>
        <ProductStatusBadge status={p.status} />
        <span className="font-mono text-sm text-muted-foreground">{p.sku}</span>
        {p.status === "active" ? (
          <Link
            href={routes.productDetail(p.slug)}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            前台預覽
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="space-y-5">
        <ProductImages productId={p.id} images={(images ?? []) as ProductImageRow[]} />
        <ProductForm
          mode="edit"
          product={p}
          specs={(specs ?? []) as ProductSpecRow[]}
          brands={(brands ?? []) as BrandRow[]}
          categories={flattenCategoryTree(buildCategoryTree((categories ?? []) as CategoryRow[]))}
        />
      </div>
    </div>
  );
}
