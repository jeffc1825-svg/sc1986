"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import type { BrandRow, CategoryOption, ProductRow, ProductSpecRow } from "@/types";
import {
  createProductAction,
  updateProductAction,
  type ActionState,
} from "@/lib/admin/product-actions";
import { parseProductForm, type ProductFieldErrors } from "@/lib/admin/product-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField, pruneFieldErrors } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpecDraft {
  key: number;
  name: string;
  value: string;
  unit: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  product?: ProductRow;
  specs?: ProductSpecRow[];
  brands: BrandRow[];
  /** 已依樹狀順序攤平、附深度的分類(flattenCategoryTree 產出) */
  categories: CategoryOption[];
}

/** 依 DOM 順序聚焦第一個驗證失敗的控制項 */
function focusFirstError(form: HTMLFormElement, errors: ProductFieldErrors) {
  for (const el of Array.from(form.elements)) {
    const name = (el as HTMLInputElement).name;
    if (name && errors[name] && el instanceof HTMLElement) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
  }
}

export function ProductForm({ mode, product, specs, brands, categories }: ProductFormProps) {
  const action =
    mode === "create" ? createProductAction : updateProductAction.bind(null, product!.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {
    error: null,
  });

  // 送出前以共用 Zod schema 做客製驗證(瀏覽器預設驗證已由 noValidate 停用);
  // 伺服器端 action 仍會以同一 schema 再驗一次,fieldErrors 同步進本地 errors。
  // 已顯示錯誤的欄位在輸入時即時重新驗證:修正即移除紅框與提示、
  // 仍未通過則更新訊息;輸入途中不新增新錯誤(pruneFieldErrors)。
  const formRef = React.useRef<HTMLFormElement>(null);
  const [errors, setErrors] = React.useState<ProductFieldErrors>({});
  const hasFieldErrors = Object.keys(errors).length > 0;
  const summaryError = hasFieldErrors
    ? "資料驗證失敗,請修正紅框標示的欄位。"
    : state.fieldErrors
      ? null // 伺服器驗證錯誤已被使用者即時修正,摘要一併移除
      : state.error;

  // action 回傳新狀態時,將伺服器端 fieldErrors 同步到本地(之後可被輸入即時清除)
  React.useEffect(() => {
    setErrors(state.fieldErrors ?? {});
  }, [state]);

  const revalidate = React.useCallback((form: HTMLFormElement) => {
    const parsed = parseProductForm(new FormData(form));
    setErrors((prev) => pruneFieldErrors(prev, parsed.success ? {} : parsed.fieldErrors));
  }, []);

  const [specDrafts, setSpecDrafts] = React.useState<SpecDraft[]>(
    (specs ?? []).map((s, i) => ({ key: i, name: s.name, value: s.value, unit: s.unit ?? "" })),
  );
  const nextKey = React.useRef(specDrafts.length);

  const specsJson = JSON.stringify(
    specDrafts
      .filter((s) => s.name.trim() !== "" || s.value.trim() !== "")
      .map((s) => ({ name: s.name, value: s.value, unit: s.unit })),
  );

  // 規格列是 controlled input(序列化進 hidden specs_json),change 事件當下
  // hidden 值尚未更新,因此規格錯誤改在 specsJson 更新後重新驗證
  React.useEffect(() => {
    if (errors.specs && formRef.current) revalidate(formRef.current);
  }, [specsJson, errors.specs, revalidate]);

  function updateSpec(key: number, field: "name" | "value" | "unit", val: string) {
    setSpecDrafts((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: val } : s)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const parsed = parseProductForm(new FormData(form));
    if (!parsed.success) {
      e.preventDefault();
      setErrors(parsed.fieldErrors);
      focusFirstError(form, parsed.fieldErrors);
      return;
    }
    setErrors({});
  }

  /** 已顯示錯誤時,任何欄位輸入都即時重新驗證(事件委派至 form) */
  function handleFormChange(e: React.FormEvent<HTMLFormElement>) {
    if (!hasFieldErrors) return;
    revalidate(e.currentTarget);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onChange={handleFormChange}
      noValidate
      className="space-y-5"
    >
      <input type="hidden" name="specs_json" value={specsJson} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本資料</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField id="sku" label="SKU(型號)" required error={errors.sku}>
                <Input name="sku" defaultValue={product?.sku} required maxLength={64} />
              </FormField>
              <FormField id="slug" label="網址代稱(留空自動產生)" error={errors.slug}>
                <Input name="slug" defaultValue={product?.slug} maxLength={120} />
              </FormField>
              <FormField id="name" label="品名" required error={errors.name} className="sm:col-span-2">
                <Input name="name" defaultValue={product?.name} required maxLength={200} />
              </FormField>
              <FormField id="brand_id" label="品牌" error={errors.brand_id}>
                <Select name="brand_id" defaultValue={product?.brand_id ?? ""}>
                  <option value="">(無)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="category_id" label="分類" error={errors.category_id}>
                <Select name="category_id" defaultValue={product?.category_id ?? ""}>
                  <option value="">(無)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.depth > 0 ? `${"　".repeat(c.depth)}└ ${c.name}` : c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                id="short_description"
                label="簡述(列表與 SEO 用)"
                error={errors.short_description}
                className="sm:col-span-2"
              >
                <Textarea
                  name="short_description"
                  rows={2}
                  maxLength={300}
                  defaultValue={product?.short_description ?? ""}
                />
              </FormField>
              <FormField
                id="description"
                label="商品介紹"
                error={errors.description}
                className="sm:col-span-2"
              >
                <Textarea
                  name="description"
                  rows={6}
                  maxLength={5000}
                  defaultValue={product?.description ?? ""}
                />
              </FormField>
              <FormField
                id="ordering_notice"
                label="訂購說明(顯示於詳情頁提示框)"
                error={errors.ordering_notice}
                className="sm:col-span-2"
              >
                <Textarea
                  name="ordering_notice"
                  rows={2}
                  maxLength={500}
                  defaultValue={product?.ordering_notice ?? ""}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">商品規格({specDrafts.length})</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setSpecDrafts((prev) => [
                    ...prev,
                    { key: nextKey.current++, name: "", value: "", unit: "" },
                  ])
                }
              >
                <Plus aria-hidden />
                新增規格
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {specDrafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚無規格。建議至少填寫關鍵電氣或尺寸規格。</p>
              ) : (
                specDrafts.map((s) => (
                  <div key={s.key} className="flex gap-2">
                    <Input
                      value={s.name}
                      onChange={(e) => updateSpec(s.key, "name", e.target.value)}
                      placeholder="名稱(如 輸出電壓)"
                      aria-label="規格名稱"
                      maxLength={50}
                      className="flex-1"
                    />
                    <Input
                      value={s.value}
                      onChange={(e) => updateSpec(s.key, "value", e.target.value)}
                      placeholder="值(如 24)"
                      aria-label="規格值"
                      maxLength={200}
                      className="flex-1"
                    />
                    <Input
                      value={s.unit}
                      onChange={(e) => updateSpec(s.key, "unit", e.target.value)}
                      placeholder="單位"
                      aria-label="單位"
                      maxLength={20}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="刪除此規格"
                      onClick={() => setSpecDrafts((prev) => prev.filter((x) => x.key !== s.key))}
                    >
                      <Trash2 className="text-muted-foreground" aria-hidden />
                    </Button>
                  </div>
                ))
              )}
              {errors.specs ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.specs}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* 右欄:價格與狀態 */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">價格與庫存</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                id="price_mode"
                label="價格模式"
                required
                error={errors.price_mode}
                hint="非「公開參考價」模式時,前台一律不顯示數字價格。"
              >
                <Select name="price_mode" defaultValue={product?.price_mode ?? "quote_only"}>
                  <option value="public_price">公開參考價</option>
                  <option value="quote_only">僅詢價($詢價)</option>
                  <option value="login_or_quote">報價後提供</option>
                </Select>
              </FormField>
              <FormField id="price" label="含稅參考價(TWD)" error={errors.price}>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.price ?? ""}
                  placeholder="留空 = 未定價"
                />
              </FormField>
              <FormField id="pricing_note" label="價格備註" error={errors.pricing_note}>
                <Input
                  name="pricing_note"
                  maxLength={300}
                  defaultValue={product?.pricing_note ?? ""}
                  placeholder="如:依數量階梯報價"
                />
              </FormField>
              <FormField id="stock_status" label="庫存狀態" required error={errors.stock_status}>
                <Select name="stock_status" defaultValue={product?.stock_status ?? "quote_required"}>
                  <option value="in_stock">現貨</option>
                  <option value="preorder">可預訂</option>
                  <option value="quote_required">需確認交期</option>
                  <option value="discontinued">停產品</option>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">發布狀態</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select id="status" name="status" defaultValue={product?.status ?? "draft"} aria-label="發布狀態">
                <option value="draft">草稿(僅後台可見)</option>
                <option value="active">上架(前台公開)</option>
                <option value="archived">封存(前台隱藏)</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                匯入或 AI 產生的資料必須先以草稿人工審核後再上架。
              </p>

              {summaryError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>{summaryError}</p>
                </div>
              ) : null}
              {state.success ? (
                <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 p-2.5 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>{state.success}</p>
                </div>
              ) : null}

              <Button type="submit" className="w-full" loading={pending}>
                {mode === "create" ? "建立商品(草稿)" : "儲存變更"}
              </Button>
              {mode === "create" ? (
                <p className="text-xs text-muted-foreground">建立後即可在編輯頁上傳商品圖片。</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
