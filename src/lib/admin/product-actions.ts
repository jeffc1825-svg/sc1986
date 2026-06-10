"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  parseProductForm,
  type ProductFieldErrors,
  type ProductInput,
} from "@/lib/admin/product-schema";
import { routes } from "@/config/routes";
import { supabaseStorage, uploadLimits } from "@/config/storage";
import { slugify } from "@/lib/utils";

export interface ActionState {
  error: string | null;
  success?: string | null;
  /** 欄位層級驗證錯誤(Zod);供表單顯示紅框與欄位下方提示 */
  fieldErrors?: ProductFieldErrors;
}

function toRow(input: ProductInput) {
  return {
    sku: input.sku,
    name: input.name,
    brand_id: input.brand_id || null,
    category_id: input.category_id || null,
    short_description: input.short_description || null,
    description: input.description || null,
    ordering_notice: input.ordering_notice || null,
    pricing_note: input.pricing_note || null,
    price: input.price === "" || input.price === undefined ? null : input.price,
    price_mode: input.price_mode,
    stock_status: input.stock_status,
    status: input.status,
  };
}

async function resolveSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  input: ProductInput,
  excludeId?: string,
): Promise<string> {
  const base = slugify(input.slug || input.name) || slugify(input.sku) || "product";
  let query = supabase.from("products").select("id").eq("slug", base);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  if (!data) return base;
  return `${base}-${slugify(input.sku)}`.slice(0, 120);
}

export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const input = parsed.data;

  const slug = await resolveSlug(supabase, input);
  const { data: product, error } = await supabase
    .from("products")
    .insert({ ...toRow(input), slug })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "SKU 或網址代稱已存在,請更換。" };
    return { error: `建立失敗:${error.message}` };
  }

  if (input.specs.length > 0) {
    const { error: specError } = await supabase.from("product_specs").insert(
      input.specs.map((s, i) => ({
        product_id: product.id,
        name: s.name,
        value: s.value,
        unit: s.unit || null,
        sort_order: i,
      })),
    );
    if (specError) return { error: `商品已建立,但規格寫入失敗:${specError.message}` };
  }

  revalidatePath(routes.admin.products);
  redirect(routes.admin.productEdit(product.id));
}

export async function updateProductAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const input = parsed.data;

  const slug = await resolveSlug(supabase, input, productId);
  const { error } = await supabase
    .from("products")
    .update({ ...toRow(input), slug })
    .eq("id", productId);

  if (error) {
    if (error.code === "23505") return { error: "SKU 或網址代稱已存在,請更換。" };
    return { error: `更新失敗:${error.message}` };
  }

  // 規格整批重建(結構化陣列)
  const { error: delError } = await supabase.from("product_specs").delete().eq("product_id", productId);
  if (delError) return { error: `規格更新失敗:${delError.message}` };
  if (input.specs.length > 0) {
    const { error: specError } = await supabase.from("product_specs").insert(
      input.specs.map((s, i) => ({
        product_id: productId,
        name: s.name,
        value: s.value,
        unit: s.unit || null,
        sort_order: i,
      })),
    );
    if (specError) return { error: `規格更新失敗:${specError.message}` };
  }

  revalidatePath(routes.admin.products);
  return { error: null, success: "已儲存。" };
}

/** 批量狀態變更 */
export async function bulkUpdateStatusAction(
  ids: string[],
  status: "draft" | "active" | "archived",
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (ids.length === 0) return { error: "未選取商品。" };

  const { error } = await supabase.from("products").update({ status }).in("id", ids);
  if (error) return { error: `批量更新失敗:${error.message}` };

  revalidatePath(routes.admin.products);
  return { error: null, success: `已更新 ${ids.length} 筆商品狀態。` };
}

/** 批量刪除(同步清除 Storage 圖片) */
export async function bulkDeleteAction(ids: string[]): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (ids.length === 0) return { error: "未選取商品。" };

  // 先收集 storage path,刪除資料列後同步清 Storage
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .in("product_id", ids);

  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) return { error: `刪除失敗:${error.message}` };

  if (images && images.length > 0) {
    try {
      const service = createSupabaseServiceClient();
      await service.storage
        .from(supabaseStorage.productImagesBucket)
        .remove(images.map((i) => i.storage_path));
    } catch (e) {
      console.error("[SC1986] Storage 清理失敗:", e);
    }
  }

  revalidatePath(routes.admin.products);
  return { error: null, success: `已刪除 ${ids.length} 筆商品。` };
}

/** 圖片上傳(service role;呼叫前已 requireAdmin) */
export async function uploadProductImageAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200);
  if (!(file instanceof File) || file.size === 0) return { error: "請選擇圖片檔案。" };
  if (!uploadLimits.imageMimeTypes.includes(file.type as (typeof uploadLimits.imageMimeTypes)[number])) {
    return { error: "僅支援 JPEG / PNG / WebP 圖片。" };
  }
  if (file.size > uploadLimits.imageMaxBytes) {
    return { error: `圖片不可超過 ${Math.round(uploadLimits.imageMaxBytes / 1024 / 1024)}MB。` };
  }

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if ((count ?? 0) >= uploadLimits.imagesPerProduct) {
    return { error: `每個商品最多 ${uploadLimits.imagesPerProduct} 張圖片。` };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = supabaseStorage.productImagePath(productId, fileName);

  let service;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return { error: "未設定 SUPABASE_SERVICE_ROLE_KEY,無法上傳圖片。" };
  }

  const { error: uploadError } = await service.storage
    .from(supabaseStorage.productImagesBucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: `上傳失敗:${uploadError.message}` };

  const { data: pub } = service.storage.from(supabaseStorage.productImagesBucket).getPublicUrl(path);

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    public_url: pub.publicUrl,
    alt: alt || null,
    sort_order: count ?? 0,
  });
  if (insertError) {
    await service.storage.from(supabaseStorage.productImagesBucket).remove([path]);
    return { error: `圖片記錄寫入失敗:${insertError.message}` };
  }

  revalidatePath(routes.admin.productEdit(productId));
  return { error: null, success: "圖片已上傳。" };
}

export async function deleteProductImageAction(imageId: string, productId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const { data: image, error: fetchError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .maybeSingle();
  if (fetchError || !image) return { error: "找不到圖片。" };

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { error: `刪除失敗:${error.message}` };

  try {
    const service = createSupabaseServiceClient();
    await service.storage.from(supabaseStorage.productImagesBucket).remove([image.storage_path]);
  } catch (e) {
    console.error("[SC1986] Storage 清理失敗:", e);
  }

  revalidatePath(routes.admin.productEdit(productId));
  return { error: null, success: "圖片已刪除。" };
}

/** 圖片排序對調 */
export async function swapImageOrderAction(
  productId: string,
  imageIdA: string,
  imageIdB: string,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const { data: images } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .in("id", [imageIdA, imageIdB]);
  if (!images || images.length !== 2) return { error: "找不到圖片。" };

  const [a, b] = images;
  const r1 = await supabase.from("product_images").update({ sort_order: b.sort_order }).eq("id", a.id);
  const r2 = await supabase.from("product_images").update({ sort_order: a.sort_order }).eq("id", b.id);
  if (r1.error || r2.error) return { error: "排序更新失敗。" };

  revalidatePath(routes.admin.productEdit(productId));
  return { error: null, success: "已更新排序。" };
}

/** 單筆刪除 */
export async function deleteProductAction(productId: string): Promise<ActionState> {
  return bulkDeleteAction([productId]);
}
