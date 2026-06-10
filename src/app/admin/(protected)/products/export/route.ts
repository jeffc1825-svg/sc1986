import { requireAdmin } from "@/lib/admin/guard";
import { CSV_COLUMNS, serializeSpecs, toCsv } from "@/lib/admin/csv";

export const dynamic = "force-dynamic";

/** 商品 CSV 匯出(Route Handler 不經 layout,必須自行 requireAdmin) */
export async function GET() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      `sku, name, price, price_mode, stock_status, status,
       short_description, description, ordering_notice, pricing_note,
       brand:brands(name), category:categories(name),
       specs:product_specs(name, value, unit, sort_order)`,
    )
    .order("sku");

  if (error) {
    return new Response(`匯出失敗:${error.message}`, { status: 500 });
  }

  const rows = (data ?? []).map((p) => {
    const brand = p.brand as unknown as { name: string } | null;
    const category = p.category as unknown as { name: string } | null;
    const specs = [...((p.specs ?? []) as { name: string; value: string; unit: string | null; sort_order: number }[])]
      .sort((a, b) => a.sort_order - b.sort_order);
    return {
      sku: p.sku,
      name: p.name,
      category: category?.name ?? "",
      brand: brand?.name ?? "",
      price_mode: p.price_mode,
      price: p.price === null ? "" : String(p.price),
      stock_status: p.stock_status,
      status: p.status,
      short_description: p.short_description ?? "",
      description: p.description ?? "",
      ordering_notice: p.ordering_notice ?? "",
      pricing_note: p.pricing_note ?? "",
      specs: serializeSpecs(specs),
    };
  });

  const csv = toCsv(rows, CSV_COLUMNS);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sc1986-products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
