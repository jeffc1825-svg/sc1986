/**
 * 資料庫型別 — 與 supabase/migrations 同步維護。
 * schema 變更時必須同步更新此檔(見 .claude/skills/database)。
 */

export type ProductPriceMode = "public_price" | "quote_only" | "login_or_quote";
export type ProductStockStatus = "in_stock" | "preorder" | "quote_required" | "discontinued";
export type ProductStatus = "draft" | "active" | "archived";
export type QuoteStatus = "new" | "reviewing" | "quoted" | "closed" | "cancelled";
export type AdminRole = "owner" | "admin" | "staff";
export type ImportBatchStatus = "pending" | "processing" | "completed" | "failed";
export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  ordering_notice: string | null;
  pricing_note: string | null;
  price: number | null;
  price_mode: ProductPriceMode;
  stock_status: ProductStockStatus;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string | null;
  alt: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductSpecRow {
  id: string;
  product_id: string;
  name: string;
  value: string;
  unit: string | null;
  sort_order: number;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  auth_user_id: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteRequestRow {
  id: string;
  reference_code: string;
  customer_name: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: QuoteStatus;
  admin_note: string | null;
  notification_status: NotificationStatus;
  notification_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItemRow {
  id: string;
  quote_request_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  note: string | null;
  created_at: string;
}

export interface ProductImportBatchRow {
  id: string;
  uploaded_by: string | null;
  original_filename: string;
  status: ImportBatchStatus;
  row_count: number;
  success_count: number;
  error_count: number;
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImportRowRow {
  id: string;
  batch_id: string;
  row_number: number;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown> | null;
  error_message: string | null;
  product_id: string | null;
  created_at: string;
}
