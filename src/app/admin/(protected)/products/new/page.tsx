import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { ProductForm } from "@/components/admin/product-form";
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
        categories={sortCategories((categories ?? []) as CategoryRow[])}
      />
    </div>
  );
}

/** 父分類在前、子分類緊隨其後 */
function sortCategories(rows: CategoryRow[]): CategoryRow[] {
  const tops = rows.filter((r) => !r.parent_id);
  const result: CategoryRow[] = [];
  for (const top of tops) {
    result.push(top);
    result.push(...rows.filter((r) => r.parent_id === top.id));
  }
  // 殘留(父分類遺失)補在最後
  result.push(...rows.filter((r) => !result.includes(r)));
  return result;
}
