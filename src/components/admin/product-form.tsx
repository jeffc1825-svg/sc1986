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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

export function ProductForm({ mode, product, specs, brands, categories }: ProductFormProps) {
  const action =
    mode === "create" ? createProductAction : updateProductAction.bind(null, product!.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {
    error: null,
  });

  const [specDrafts, setSpecDrafts] = React.useState<SpecDraft[]>(
    (specs ?? []).map((s, i) => ({ key: i, name: s.name, value: s.value, unit: s.unit ?? "" })),
  );
  const nextKey = React.useRef(specDrafts.length);

  const specsJson = JSON.stringify(
    specDrafts
      .filter((s) => s.name.trim() !== "" || s.value.trim() !== "")
      .map((s) => ({ name: s.name, value: s.value, unit: s.unit })),
  );

  function updateSpec(key: number, field: "name" | "value" | "unit", val: string) {
    setSpecDrafts((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: val } : s)));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="specs_json" value={specsJson} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本資料</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sku" required>
                  SKU(型號)
                </Label>
                <Input id="sku" name="sku" defaultValue={product?.sku} required maxLength={64} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">網址代稱(留空自動產生)</Label>
                <Input id="slug" name="slug" defaultValue={product?.slug} maxLength={120} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name" required>
                  品名
                </Label>
                <Input id="name" name="name" defaultValue={product?.name} required maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand_id">品牌</Label>
                <Select id="brand_id" name="brand_id" defaultValue={product?.brand_id ?? ""}>
                  <option value="">(無)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category_id">分類</Label>
                <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""}>
                  <option value="">(無)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.depth > 0 ? `${"　".repeat(c.depth)}└ ${c.name}` : c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="short_description">簡述(列表與 SEO 用)</Label>
                <Textarea
                  id="short_description"
                  name="short_description"
                  rows={2}
                  maxLength={300}
                  defaultValue={product?.short_description ?? ""}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">商品介紹</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={6}
                  maxLength={5000}
                  defaultValue={product?.description ?? ""}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ordering_notice">訂購說明(顯示於詳情頁提示框)</Label>
                <Textarea
                  id="ordering_notice"
                  name="ordering_notice"
                  rows={2}
                  maxLength={500}
                  defaultValue={product?.ordering_notice ?? ""}
                />
              </div>
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
              <div className="space-y-1.5">
                <Label htmlFor="price_mode" required>
                  價格模式
                </Label>
                <Select id="price_mode" name="price_mode" defaultValue={product?.price_mode ?? "quote_only"}>
                  <option value="public_price">公開參考價</option>
                  <option value="quote_only">僅詢價($詢價)</option>
                  <option value="login_or_quote">報價後提供</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  非「公開參考價」模式時,前台一律不顯示數字價格。
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">含稅參考價(TWD)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.price ?? ""}
                  placeholder="留空 = 未定價"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pricing_note">價格備註</Label>
                <Input
                  id="pricing_note"
                  name="pricing_note"
                  maxLength={300}
                  defaultValue={product?.pricing_note ?? ""}
                  placeholder="如:依數量階梯報價"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock_status" required>
                  庫存狀態
                </Label>
                <Select
                  id="stock_status"
                  name="stock_status"
                  defaultValue={product?.stock_status ?? "quote_required"}
                >
                  <option value="in_stock">現貨</option>
                  <option value="preorder">可預訂</option>
                  <option value="quote_required">需確認交期</option>
                  <option value="discontinued">停產品</option>
                </Select>
              </div>
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

              {state.error ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>{state.error}</p>
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
