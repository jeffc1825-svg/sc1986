import { requireAdmin } from "@/lib/admin/guard";
import { toCsv } from "@/lib/admin/csv";

export const dynamic = "force-dynamic";

/** 匯入錯誤列 CSV 下載(原始資料 + 錯誤原因,修正後可重新匯入) */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const { data, error } = await supabase
    .from("product_import_rows")
    .select("row_number, raw_data, error_message")
    .eq("batch_id", id)
    .not("error_message", "is", null)
    .order("row_number");

  if (error) return new Response(`下載失敗:${error.message}`, { status: 500 });

  const rows = (data ?? []).map((r) => {
    const raw = (r.raw_data ?? {}) as Record<string, string>;
    return {
      row_number: String(r.row_number),
      error: r.error_message ?? "",
      ...raw,
    };
  });

  // 欄位:列號 + 錯誤 + 原始欄位聯集
  const rawKeys = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => rawKeys.add(k)));
  rawKeys.delete("row_number");
  rawKeys.delete("error");
  const columns = ["row_number", "error", ...Array.from(rawKeys)];

  return new Response(toCsv(rows, columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="import-errors-${id.slice(0, 8)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
