import type {
  BrandRow,
  CategoryRow,
  ProductImageRow,
  ProductRow,
  ProductSpecRow,
} from "@/types/database";

/** 列表用商品卡資料(含首圖) */
export interface ProductListItem extends ProductRow {
  brand: Pick<BrandRow, "id" | "name" | "slug"> | null;
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  cover_image: Pick<
    ProductImageRow,
    "public_url" | "storage_path" | "alt"
  > | null;
}

/** 詳情頁完整商品資料 */
export interface ProductDetail extends ProductRow {
  brand: Pick<BrandRow, "id" | "name" | "slug"> | null;
  category: Pick<CategoryRow, "id" | "name" | "slug" | "parent_id"> | null;
  images: ProductImageRow[];
  specs: ProductSpecRow[];
}

/** 分類樹節點 */
export interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
}

/** 攤平後的分類選項(後台下拉等用;depth 0 = 頂層) */
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  depth: number;
}

/**
 * 分類樹深度上限(1 = 頂層,最深 4 層)。
 * 與 migration 0002 的 check_category_depth() trigger 同步,修改其一必須同步另一處。
 */
export const CATEGORY_MAX_DEPTH = 4;

/** 詢價清單品項(localStorage 與 context 共用) */
export interface QuoteCartItem {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  quantity: number;
  note: string;
}

/** 目錄頁查詢參數(正規化後) */
export interface CatalogQuery {
  q?: string;
  category?: string;
  brand?: string;
  price_mode?: string;
  stock_status?: string;
  sort: "newest" | "sku" | "name";
  page: number;
}

export const CATALOG_PAGE_SIZE = 24;
