import { NextResponse } from "next/server";
import { buildCategoryTree, fetchAllCategories } from "@/lib/catalog/categories";

/**
 * GET /api/categories — 公開分類樹(巢狀 JSON)。
 *
 * 快取策略(雙層):
 * 1. 資料層:fetchAllCategories 為記憶體 TTL 快取(5 分鐘,instance 內共用,
 *    併發去重;刻意不用 unstable_cache,原因見 lib/catalog/categories.ts)。
 * 2. HTTP 層:CDN/瀏覽器快取 + stale-while-revalidate,
 *    Header 選單等客戶端非同步取用時不會打到 DB。
 * 新增/調整分類後最慢 5 分鐘自動生效,無須重新部署。
 */
export async function GET() {
  try {
    const rows = await fetchAllCategories();
    const tree = buildCategoryTree(rows);
    return NextResponse.json(
      { categories: tree, total: rows.length },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    // fail-closed:錯誤就回 500,不退回示範資料
    return NextResponse.json(
      { error: "分類資料暫時無法取得" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
