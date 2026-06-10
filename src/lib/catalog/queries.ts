import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CATALOG_PAGE_SIZE,
  type BrandRow,
  type CatalogQuery,
  type ProductDetail,
  type ProductListItem,
} from "@/types";
import { categoryDescendantIds, fetchAllCategories } from "@/lib/catalog/categories";

const LIST_SELECT = `
  *,
  brand:brands(id, name, slug),
  category:categories(id, name, slug),
  images:product_images(public_url, storage_path, alt, sort_order)
`;

type RawListRow = Omit<ProductListItem, "cover_image"> & {
  images: { public_url: string | null; storage_path: string; alt: string | null; sort_order: number }[] | null;
};

function toListItem(row: RawListRow): ProductListItem {
  const sorted = [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const { images: _images, ...rest } = row;
  void _images;
  return { ...rest, cover_image: sorted[0] ?? null };
}

/** 目錄查詢 — 搜尋/篩選/排序/分頁全部在資料庫端執行 */
export async function fetchCatalog(query: CatalogQuery): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
  /** 分類 slug 無效時為 true(顯示找不到分類) */
  unknownCategory: boolean;
}> {
  const supabase = await createSupabaseServerClient();

  let categoryIds: string[] | null = null;
  let unknownCategory = false;
  if (query.category) {
    const categories = await fetchAllCategories();
    categoryIds = categoryDescendantIds(categories, query.category);
    if (!categoryIds) unknownCategory = true;
  }

  let builder = supabase
    .from("products")
    .select(LIST_SELECT, { count: "exact" })
    .eq("status", "active");

  if (categoryIds) builder = builder.in("category_id", categoryIds);
  if (unknownCategory) builder = builder.eq("id", "00000000-0000-0000-0000-000000000000");

  if (query.brand) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", query.brand)
      .maybeSingle();
    builder = brand
      ? builder.eq("brand_id", brand.id)
      : builder.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  if (query.price_mode) builder = builder.eq("price_mode", query.price_mode);
  if (query.stock_status) builder = builder.eq("stock_status", query.stock_status);

  if (query.q) {
    // 跳脫 PostgREST or 語法的保留字元,ILIKE 比對 SKU/品名/簡述/描述
    const term = query.q.replace(/[,()]/g, " ").trim().slice(0, 80);
    if (term) {
      const like = `%${term}%`;
      builder = builder.or(
        `sku.ilike.${like},name.ilike.${like},short_description.ilike.${like},description.ilike.${like}`,
      );
    }
  }

  switch (query.sort) {
    case "sku":
      builder = builder.order("sku", { ascending: true });
      break;
    case "name":
      builder = builder.order("name", { ascending: true });
      break;
    default:
      builder = builder.order("created_at", { ascending: false });
  }

  const page = Math.max(1, query.page);
  const from = (page - 1) * CATALOG_PAGE_SIZE;
  builder = builder.range(from, from + CATALOG_PAGE_SIZE - 1);

  const { data, error, count } = await builder;
  if (error) throw new Error(`讀取商品目錄失敗:${error.message}`);

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as RawListRow[]).map(toListItem),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)),
    unknownCategory,
  };
}

/** 商品詳情(僅 active;RLS 已限制,此處再防一層) */
export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `*,
       brand:brands(id, name, slug),
       category:categories(id, name, slug, parent_id),
       images:product_images(*),
       specs:product_specs(*)`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`讀取商品失敗:${error.message}`);
  if (!data) return null;

  const detail = data as unknown as ProductDetail;
  detail.images = [...detail.images].sort((a, b) => a.sort_order - b.sort_order);
  detail.specs = [...detail.specs].sort((a, b) => a.sort_order - b.sort_order);
  return detail;
}

/** 相關商品:同分類優先,不足補同品牌(真實查詢,不用示範資料) */
export async function fetchRelatedProducts(product: ProductDetail, limit = 4): Promise<ProductListItem[]> {
  const supabase = await createSupabaseServerClient();
  const collected: RawListRow[] = [];

  if (product.category_id) {
    const { data } = await supabase
      .from("products")
      .select(LIST_SELECT)
      .eq("status", "active")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    collected.push(...((data ?? []) as unknown as RawListRow[]));
  }

  if (collected.length < limit && product.brand_id) {
    const exclude = [product.id, ...collected.map((p) => p.id)];
    const { data } = await supabase
      .from("products")
      .select(LIST_SELECT)
      .eq("status", "active")
      .eq("brand_id", product.brand_id)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - collected.length);
    collected.push(...((data ?? []) as unknown as RawListRow[]));
  }

  return collected.slice(0, limit).map(toListItem);
}

/** 首頁:最新上架 */
export async function fetchNewProducts(limit = 8): Promise<ProductListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(LIST_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`讀取新品失敗:${error.message}`);
  return ((data ?? []) as unknown as RawListRow[]).map(toListItem);
}

export async function fetchBrands(): Promise<BrandRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw new Error(`讀取品牌失敗:${error.message}`);
  return (data ?? []) as BrandRow[];
}

/** 首頁統計(現貨品項/商品筆數,廣華式 footer 數字) */
export async function fetchCatalogStats(): Promise<{ active: number; inStock: number }> {
  const supabase = await createSupabaseServerClient();
  const [activeRes, stockRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("stock_status", "in_stock"),
  ]);
  return { active: activeRes.count ?? 0, inStock: stockRes.count ?? 0 };
}
