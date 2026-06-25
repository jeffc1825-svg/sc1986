import { z } from "zod";
import { quoteCartLimits } from "@/config/storage";

/** 詢價請求 schema — API 與前端表單共用 */
export const quoteContactSchema = z.object({
  customer_name: z
    .string({ required_error: "請填寫姓名" })
    .trim()
    .min(1, "請填寫姓名")
    .max(100, "姓名過長"),
  company: z.string().trim().max(100, "公司名稱過長").optional().or(z.literal("")),
  email: z
    .string({ required_error: "請填寫 Email" })
    .trim()
    .min(1, "請填寫 Email")
    .max(255, "Email 過長")
    .email("Email 格式不正確"),
  phone: z.string().trim().max(50, "電話過長").optional().or(z.literal("")),
  message: z.string().trim().max(2000, "需求說明請控制在 2000 字內").optional().or(z.literal("")),
});

export const quoteItemSchema = z.object({
  product_id: z.string().uuid("品項資料異常,請重新加入詢價清單"),
  quantity: z
    .number({ invalid_type_error: "數量必須是數字" })
    .int("數量必須是整數")
    .min(1, "數量至少 1")
    .max(quoteCartLimits.maxQuantity, `數量上限 ${quoteCartLimits.maxQuantity}`),
  note: z.string().trim().max(quoteCartLimits.maxNoteLength, "備註過長").optional().or(z.literal("")),
});

export const quoteRequestSchema = z.object({
  contact: quoteContactSchema,
  items: z
    .array(quoteItemSchema)
    .min(1, "詢價清單是空的")
    .max(quoteCartLimits.maxItems, `一次詢價最多 ${quoteCartLimits.maxItems} 項`),
  /** honeypot:正常使用者永遠是空字串 */
  website: z.string().max(0, "驗證失敗").optional().or(z.literal("")),
  /** Cloudflare Turnstile token;是否必填由伺服器依環境設定決定 */
  turnstileToken: z.string().max(4096, "驗證資料異常,請重新整理後再試").optional(),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

/** API 回應型別(前端共用) */
export interface QuoteApiSuccess {
  ok: true;
  referenceCode: string;
}

export interface QuoteApiError {
  ok: false;
  error: string;
  /** 無效品項的 product_id 清單(前端可據此移除) */
  invalidProductIds?: string[];
}

export type QuoteApiResponse = QuoteApiSuccess | QuoteApiError;
