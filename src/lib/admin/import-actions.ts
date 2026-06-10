"use server";

import { redirect } from "next/navigation";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/admin/guard";
import { importRowSchema, parseSpecs } from "@/lib/admin/csv";
import { routes } from "@/config/routes";
import { uploadLimits } from "@/config/storage";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/admin/product-actions";

const MAX_ROWS = 2000;

/**
 * CSV 商品匯入:
 * - 每列獨立成功/失敗,單列錯誤不中止整批
 * - 成功列一律建立為 draft(不可違反)
 * - 品牌/分類以名稱或 slug 比對既有資料,不自動建立
 * - 圖片不在匯入範圍(授權考量),請於商品編輯頁上傳
 */
export async function importCsvAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, admin } = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "請選擇 CSV 檔案。" };
  if (file.size > uploadLimits.csvMaxBytes) {
    return { error: `檔案不可超過 ${Math.round(uploadLimits.csvMaxBytes / 1024 / 1024)}MB。` };
  }
  if (!/\.csv$/i.test(file.name)) {
    return { error: "僅支援 .csv 檔(Excel 請先另存為 CSV UTF-8)。" };
  }

  const text = (await file.text()).replace(/^﻿/, "");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows = parsed.data;
  if (rows.length === 0) return { error: "CSV 沒有資料列。" };
  if (rows.length > MAX_ROWS) return { error: `單批最多 ${MAX_ROWS} 列,請分批匯入。` };

  // 建立批次
  const { data: batch, error: batchError } = await supabase
    .from("product_import_batches")
    .insert({
      uploaded_by: admin.id,
      original_filename: file.name.slice(0, 255),
      status: "processing",
      row_count: rows.length,
    })
    .select("id")
    .single();
  if (batchError || !batch) return { error: `建立匯入批次失敗:${batchError?.message}` };

  // 既有 SKU / 品牌 / 分類 對照
  const [{ data: brandRows }, { data: categoryRows }] = await Promise.all([
    supabase.from("brands").select("id, name, slug"),
    supabase.from("categories").select("id, name, slug"),
  ]);
  const brandMap = new Map<string, string>();
  (brandRows ?? []).forEach((b) => {
    brandMap.set(b.name.toLowerCase(), b.id);
    brandMap.set(b.slug.toLowerCase(), b.id);
  });
  // 分類:slug 必唯一;name 在多層分類下可能重複(不同父層同名),重複名稱不允許比對
  const categorySlugMap = new Map<string, string>();
  const categoryNameMap = new Map<string, string>();
  const ambiguousCategoryNames = new Set<string>();
  (categoryRows ?? []).forEach((c) => {
    categorySlugMap.set(c.slug.toLowerCase(), c.id);
    const nameKey = c.name.toLowerCase();
    if (categoryNameMap.has(nameKey)) ambiguousCategoryNames.add(nameKey);
    else categoryNameMap.set(nameKey, c.id);
  });
  const resolveCategory = (value: string): { id: string | null; ambiguous: boolean } => {
    const key = value.toLowerCase();
    const bySlug = categorySlugMap.get(key);
    if (bySlug) return { id: bySlug, ambiguous: false };
    if (ambiguousCategoryNames.has(key)) return { id: null, ambiguous: true };
    return { id: categoryNameMap.get(key) ?? null, ambiguous: false };
  };

  const seenSkus = new Set<string>();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNumber = i + 2; // 含表頭的人類列號
    let errorMessage: string | null = null;
    let productId: string | null = null;
    let normalized: Record<string, unknown> | null = null;

    const validated = importRowSchema.safeParse(raw);
    if (!validated.success) {
      errorMessage = validated.error.issues[0]?.message ?? "資料驗證失敗";
    } else {
      const input = validated.data;
      const skuKey = input.sku.toLowerCase();

      let brandId: string | null = null;
      let categoryId: string | null = null;

      if (seenSkus.has(skuKey)) {
        errorMessage = `SKU ${input.sku} 在檔案內重複`;
      } else if (input.brand && !(brandId = brandMap.get(input.brand.toLowerCase()) ?? null)) {
        errorMessage = `品牌「${input.brand}」不存在,請先於後台建立`;
      } else if (input.category && (() => {
        const resolved = resolveCategory(input.category);
        categoryId = resolved.id;
        if (resolved.ambiguous) {
          errorMessage = `分類名稱「${input.category}」對應多個分類,請改填分類 slug`;
          return true;
        }
        if (!categoryId) {
          errorMessage = `分類「${input.category}」不存在,請先於後台建立`;
          return true;
        }
        return false;
      })()) {
        // 錯誤訊息已於上方設定
      } else {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("sku", input.sku)
          .maybeSingle();
        if (existing) {
          errorMessage = `SKU ${input.sku} 已存在`;
        } else {
          // slug:名稱優先,衝突時帶 sku
          let slug = slugify(input.name) || slugify(input.sku);
          const { data: slugTaken } = await supabase
            .from("products")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (slugTaken) slug = `${slug}-${slugify(input.sku)}`.slice(0, 120);

          const specs = parseSpecs(input.specs);
          normalized = { ...input, slug, specs };

          const { data: created, error: insertError } = await supabase
            .from("products")
            .insert({
              sku: input.sku,
              name: input.name,
              slug,
              brand_id: brandId,
              category_id: categoryId,
              short_description: input.short_description || null,
              description: input.description || null,
              ordering_notice: input.ordering_notice || null,
              pricing_note: input.pricing_note || null,
              price: input.price,
              price_mode: input.price_mode,
              stock_status: input.stock_status,
              status: "draft", // 匯入一律草稿,人工審核後上架
            })
            .select("id")
            .single();

          if (insertError || !created) {
            errorMessage = `寫入失敗:${insertError?.message ?? "未知錯誤"}`;
          } else {
            productId = created.id;
            seenSkus.add(skuKey);
            if (specs.length > 0) {
              const { error: specError } = await supabase.from("product_specs").insert(
                specs.slice(0, 50).map((s, idx) => ({
                  product_id: created.id,
                  name: s.name.slice(0, 50),
                  value: s.value.slice(0, 200),
                  unit: s.unit ? s.unit.slice(0, 20) : null,
                  sort_order: idx,
                })),
              );
              if (specError) {
                errorMessage = `商品已建立(草稿),但規格寫入失敗:${specError.message}`;
              }
            }
          }
        }
      }
    }

    if (errorMessage && !productId) errorCount++;
    else successCount++;

    await supabase.from("product_import_rows").insert({
      batch_id: batch.id,
      row_number: rowNumber,
      raw_data: raw,
      normalized_data: normalized,
      error_message: errorMessage,
      product_id: productId,
    });
  }

  await supabase
    .from("product_import_batches")
    .update({
      status: "completed",
      success_count: successCount,
      error_count: errorCount,
      error_summary: errorCount > 0 ? `${errorCount} 列失敗,詳見錯誤列表` : null,
    })
    .eq("id", batch.id);

  redirect(routes.admin.importDetail(batch.id));
}
