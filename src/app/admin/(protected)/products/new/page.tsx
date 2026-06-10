import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { ProductForm } from "@/components/admin/product-form";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/catalog/categories";
import type { BrandRow, CategoryRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductNewPage() {
  const { supabase } = await requireAdmin();

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("*").order("name"),
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);

  return (
    <div>
      <Link
        href={routes.admin.products}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        回商品列表
      </Link>
      <h1 className="mb-4 text-xl font-bold text-foreground">新增商品</h1>
      <ProductForm
        mode="create"
        brands={(brands ?? []) as BrandRow[]}
        categories={flattenCategoryTree(buildCategoryTree((categories ?? []) as CategoryRow[]))}
      />
    </div>
  );
}
