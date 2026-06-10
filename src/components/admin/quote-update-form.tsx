"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateQuoteAction } from "@/lib/admin/quote-actions";
import type { ActionState } from "@/lib/admin/product-actions";
import { quoteStatusOptions } from "@/components/admin/status-badges";
import type { QuoteRequestRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function QuoteUpdateForm({ quote }: { quote: QuoteRequestRow }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateQuoteAction.bind(null, quote.id),
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="status" required>
          案件狀態
        </Label>
        <Select id="status" name="status" defaultValue={quote.status}>
          {quoteStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin_note">內部備註(不會對客戶顯示)</Label>
        <Textarea
          id="admin_note"
          name="admin_note"
          rows={5}
          maxLength={5000}
          defaultValue={quote.admin_note ?? ""}
          placeholder="報價金額、供應商、交期、跟催紀錄…"
        />
      </div>

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden />
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.success}
        </p>
      ) : null}

      <Button type="submit" loading={pending}>
        儲存
      </Button>
    </form>
  );
}
