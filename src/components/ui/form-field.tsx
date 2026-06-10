import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** 子控制項(Input / Textarea / Select)會被注入的無障礙屬性 */
interface InjectedControlProps {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export interface FormFieldProps {
  /** 控制項 id,同時用於 label htmlFor 與錯誤訊息 aria-describedby */
  id: string;
  label: React.ReactNode;
  required?: boolean;
  /** 驗證錯誤訊息;有值時控制項標 aria-invalid(紅框)並於下方顯示錯誤提示 */
  error?: string | null;
  /** 欄位下方輔助說明;與 error 同時存在時優先顯示 error */
  hint?: React.ReactNode;
  className?: string;
  /** 單一表單控制項(Input / Textarea / Select) */
  children: React.ReactElement<InjectedControlProps>;
}

/**
 * 表單欄位容器:Label + 控制項 + 錯誤訊息/輔助說明。
 * 統一欄位排版與錯誤呈現:紅框由控制項的 aria-invalid 樣式觸發,
 * 錯誤訊息以 role="alert" 顯示於控制項下方。
 *
 * 用法:
 * <FormField id="sku" label="SKU" required error={errors.sku}>
 *   <Input name="sku" maxLength={64} />
 * </FormField>
 */
/**
 * 即時重新驗證用的錯誤合併規則:只處理「目前已顯示」的錯誤——
 * 已修正的欄位移除、仍未通過的更新訊息;不在輸入途中新增尚未提示過的錯誤
 * (新錯誤一律等送出時才完整顯示)。回傳 prev 本身代表無變化,避免多餘 re-render。
 */
export function pruneFieldErrors<T extends Partial<Record<string, string>>>(
  prev: T,
  fresh: Partial<Record<string, string>>,
): T {
  const next: Partial<Record<string, string>> = {};
  let changed = false;
  for (const key of Object.keys(prev)) {
    const message = fresh[key];
    if (message) {
      next[key] = message;
      if (message !== prev[key]) changed = true;
    } else {
      changed = true; // 該欄位已修正,移除錯誤
    }
  }
  // next 的鍵必為 prev 鍵的子集,斷言回 T 是安全的
  return changed ? (next as T) : prev;
}

export function FormField({ id, label, required, error, hint, className, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  const control = React.cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  });

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
