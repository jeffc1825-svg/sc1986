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
  cover_image: Pick<ProductImageRow, "public_url" | "storage_path" | "alt"> | null;
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

/** 報價車品項(localStorage 與 context 共用) */
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
