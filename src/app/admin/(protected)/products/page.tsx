import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { ProductsTable } from "@/components/admin/products-table";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const status = ["draft", "active", "archived"].includes(sp.status ?? "") ? sp.status! : "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  let builder = supabase
    .from("products")
    .select(
      `*, brand:brands(id, name, slug), category:categories(id, name, slug),
       images:product_images(public_url, storage_path, alt, sort_order)`,
      { count: "exact" },
    );
  if (status) builder = builder.eq("status", status);
  if (q) {
    const like = `%${q.replace(/[,()]/g, " ")}%`;
    builder = builder.or(`sku.ilike.${like},name.ilike.${like}`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await builder
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`讀取商品失敗:${error.message}`);

  const products = (data ?? []).map((row) => {
    const images = [...(row.images ?? [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
    );
    return { ...row, cover_image: images[0] ?? null } as unknown as ProductListItem;
  });
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${routes.admin.products}?${qs}` : routes.admin.products;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">商品管理</h1>
          <p className="text-sm text-muted-foreground">共 {count ?? 0} 筆</p>
        </div>
        <div className="flex gap-2">
          <a href={routes.admin.productExport}>
            <Button variant="outline" size="sm">
              <Download aria-hidden />
              匯出 CSV
            </Button>
          </a>
          <Link href={routes.admin.productNew}>
            <Button size="sm">
              <Plus aria-hidden />
              新增商品
            </Button>
          </Link>
        </div>
      </div>

      {/* 篩選列(GET 表單,伺服器端查詢) */}
      <form method="get" action={routes.admin.products} className="mb-3 flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="搜尋 SKU 或品名…"
          aria-label="搜尋商品"
          className="w-56"
        />
        <Select name="status" defaultValue={status} aria-label="狀態篩選" className="w-36">
          <option value="">全部狀態</option>
          <option value="draft">草稿</option>
          <option value="active">上架中</option>
          <option value="archived">已封存</option>
        </Select>
        <Button type="submit" variant="secondary" size="sm" className="h-9">
          篩選
        </Button>
      </form>

      <ProductsTable products={products} />

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
