import { z } from "zod";

/** CSV 匯入/匯出共用欄位(順序即匯出順序) */
export const CSV_COLUMNS = [
  "sku",
  "name",
  "category",
  "brand",
  "price_mode",
  "price",
  "stock_status",
  "status",
  "short_description",
  "description",
  "ordering_notice",
  "pricing_note",
  "specs",
] as const;

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function toCsv(rows: Record<string, string>[], columns: readonly string[]): string {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((c) => csvEscape(row[c] ?? "")).join(","));
  // BOM 讓 Excel 正確以 UTF-8 開啟中文
  return `﻿${header}\n${lines.join("\n")}\n`;
}

/** 規格序列化:voltage=24|V; current=10|A; mounting=DIN rail */
export function serializeSpecs(specs: { name: string; value: string; unit: string | null }[]): string {
  return specs
    .map((s) => `${s.name}=${s.value}${s.unit ? `|${s.unit}` : ""}`)
    .join("; ");
}

export function parseSpecs(input: string): { name: string; value: string; unit: string | null }[] {
  if (!input.trim()) return [];
  return input
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return { name: part, value: "-", unit: null };
      const name = part.slice(0, eq).trim();
      const rest = part.slice(eq + 1).trim();
      const pipe = rest.lastIndexOf("|");
      if (pipe === -1) return { name, value: rest, unit: null };
      return {
        name,
        value: rest.slice(0, pipe).trim(),
        unit: rest.slice(pipe + 1).trim() || null,
      };
    })
    .filter((s) => s.name !== "");
}

/** 匯入列驗證 schema */
export const importRowSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "sku 必填")
    .max(64, "sku 過長")
    .regex(/^[A-Za-z0-9_.\-/]+$/, "sku 只能包含英數字與 - _ . /"),
  name: z.string().trim().min(1, "name 必填").max(200, "name 過長"),
  category: z.string().trim().max(100).optional().default(""),
  brand: z.string().trim().max(100).optional().default(""),
  price_mode: z
    .string()
    .trim()
    .default("quote_only")
    .transform((v) => (v === "" ? "quote_only" : v))
    .pipe(
      z.enum(["public_price", "quote_only", "login_or_quote"], {
        errorMap: () => ({ message: "price_mode 必須是 public_price / quote_only / login_or_quote" }),
      }),
    ),
  price: z
    .string()
    .trim()
    .default("")
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 9_999_999_999.99) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "price 必須是 0 以上的數字" });
        return z.NEVER;
      }
      return Math.round(n * 100) / 100;
    }),
  stock_status: z
    .string()
    .trim()
    .default("quote_required")
    .transform((v) => (v === "" ? "quote_required" : v))
    .pipe(
      z.enum(["in_stock", "preorder", "quote_required", "discontinued"], {
        errorMap: () => ({
          message: "stock_status 必須是 in_stock / preorder / quote_required / discontinued",
        }),
      }),
    ),
  short_description: z.string().trim().max(300, "short_description 過長").optional().default(""),
  description: z.string().trim().max(5000, "description 過長").optional().default(""),
  ordering_notice: z.string().trim().max(500, "ordering_notice 過長").optional().default(""),
  pricing_note: z.string().trim().max(300, "pricing_note 過長").optional().default(""),
  specs: z.string().trim().max(2000, "specs 過長").optional().default(""),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;
