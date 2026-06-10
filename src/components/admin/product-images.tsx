"use client";

import * as React from "react";
import Image from "next/image";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import type { ProductImageRow } from "@/types";
import {
  deleteProductImageAction,
  swapImageOrderAction,
  uploadProductImageAction,
  type ActionState,
} from "@/lib/admin/product-actions";
import { uploadLimits } from "@/config/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductImages({
  productId,
  images,
}: {
  productId: string;
  images: ProductImageRow[];
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const result = await uploadProductImageAction(productId, prev, fd);
      if (!result.error) {
        formRef.current?.reset();
        router.refresh();
      }
      return result;
    },
    { error: null },
  );
  const [busy, setBusy] = React.useState(false);

  async function run(fn: () => Promise<ActionState>) {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          商品圖片({images.length}/{uploadLimits.imagesPerProduct})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {images.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.id} className="rounded-lg border border-border p-2">
                <div className="relative aspect-square overflow-hidden rounded bg-white">
                  <Image
                    src={img.public_url ?? ""}
                    alt={img.alt ?? `商品圖 ${i + 1}`}
                    fill
                    sizes="160px"
                    className="object-contain p-1"
                  />
                </div>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  {i === 0 ? "封面圖・" : ""}
                  {img.alt || "(無 alt)"}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      aria-label="往前移"
                      disabled={busy || i === 0}
                      onClick={() => run(() => swapImageOrderAction(productId, img.id, images[i - 1].id))}
                      className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="往後移"
                      disabled={busy || i === images.length - 1}
                      onClick={() => run(() => swapImageOrderAction(productId, img.id, images[i + 1].id))}
                      className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="刪除圖片"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("確定刪除此圖片?Storage 檔案會一併刪除。")) {
                        run(() => deleteProductImageAction(img.id, productId));
                      }
                    }}
                    className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            尚無圖片,前台將顯示預設替代圖。建議上傳白底產品照。
          </p>
        )}

        <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border border-dashed border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="image-file" required>
                圖片檔(JPEG/PNG/WebP,≤{Math.round(uploadLimits.imageMaxBytes / 1024 / 1024)}MB)
              </Label>
              <Input
                id="image-file"
                name="file"
                type="file"
                accept={uploadLimits.imageMimeTypes.join(",")}
                required
                className="pt-1.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image-alt">替代文字 alt(建議填寫)</Label>
              <Input id="image-alt" name="alt" maxLength={200} placeholder="如:LRS-350-24 正面照" />
            </div>
          </div>
          {state.error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4" aria-hidden />
              {state.error}
            </p>
          ) : null}
          <Button type="submit" size="sm" loading={pending}>
            <Upload aria-hidden />
            上傳圖片
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
