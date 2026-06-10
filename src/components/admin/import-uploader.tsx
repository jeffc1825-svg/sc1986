"use client";

import { useActionState } from "react";
import { AlertCircle, FileUp } from "lucide-react";
import { importCsvAction } from "@/lib/admin/import-actions";
import type { ActionState } from "@/lib/admin/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportUploader() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(importCsvAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="csv-file" required>
          CSV 檔案(UTF-8)
        </Label>
        <Input id="csv-file" name="file" type="file" accept=".csv,text/csv" required className="pt-1.5" />
      </div>
      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden />
          {state.error}
        </p>
      ) : null}
      <Button type="submit" loading={pending}>
        <FileUp aria-hidden />
        {pending ? "匯入中,請勿關閉頁面…" : "開始匯入"}
      </Button>
    </form>
  );
}
