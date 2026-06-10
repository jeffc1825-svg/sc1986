import { z } from "zod";

export const specInputSchema = z.object({
  name: z.string().trim().min(1, "規格名稱必填").max(50, "規格名稱過長"),
  value: z.string().trim().min(1, "規格值必填").max(200, "規格值過長"),
  unit: z.string().trim().max(20, "單位過長").optional().or(z.literal("")),
});

export const productInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU 必填")
    .max(64, "SKU 過長")
    .regex(/^[A-Za-z0-9_.\-/]+$/, "SKU 只能包含英數字與 - _ . /"),
  name: z.string().trim().min(1, "品名必填").max(200, "品名過長"),
  slug: z
    .string()
    .trim()
    .max(120, "網址代稱過長")
    .regex(/^[a-z0-9一-鿿-]*$/, "網址代稱只能包含小寫英數、中文與連字號")
    .optional()
    .or(z.literal("")),
  brand_id: z.string().uuid().optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  short_description: z.string().trim().max(300, "簡述請控制在 300 字內").optional().or(z.literal("")),
  description: z.string().trim().max(5000, "介紹請控制在 5000 字內").optional().or(z.literal("")),
  ordering_notice: z.string().trim().max(500, "訂購說明過長").optional().or(z.literal("")),
  pricing_note: z.string().trim().max(300, "價格備註過長").optional().or(z.literal("")),
  price: z
    .union([
      z.literal(""),
      z.coerce
        .number({ invalid_type_error: "價格必須是數字" })
        .min(0, "價格不可為負")
        .max(9_999_999_999.99, "價格超出範圍"),
    ])
    .optional(),
  price_mode: z.enum(["public_price", "quote_only", "login_or_quote"]),
  stock_status: z.enum(["in_stock", "preorder", "quote_required", "discontinued"]),
  status: z.enum(["draft", "active", "archived"]),
  specs: z.array(specInputSchema).max(50, "規格最多 50 列"),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/** 從 FormData 解析商品表單(specs 由前端序列化為 JSON 字串) */
export function parseProductForm(formData: FormData):
  | { success: true; data: ProductInput }
  | { success: false; error: string } {
  let specs: unknown = [];
  try {
    specs = JSON.parse(String(formData.get("specs_json") ?? "[]"));
  } catch {
    return { success: false, error: "規格資料格式錯誤" };
  }

  const candidate = {
    sku: String(formData.get("sku") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brand_id: String(formData.get("brand_id") ?? ""),
    category_id: String(formData.get("category_id") ?? ""),
    short_description: String(formData.get("short_description") ?? ""),
    description: String(formData.get("description") ?? ""),
    ordering_notice: String(formData.get("ordering_notice") ?? ""),
    pricing_note: String(formData.get("pricing_note") ?? ""),
    price: String(formData.get("price") ?? "").trim(),
    price_mode: String(formData.get("price_mode") ?? ""),
    stock_status: String(formData.get("stock_status") ?? ""),
    status: String(formData.get("status") ?? ""),
    specs,
  };

  const parsed = productInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "資料驗證失敗" };
  }
  return { success: true, data: parsed.data };
}
