"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, Minus, Plus, Trash2 } from "lucide-react";
import { routes } from "@/config/routes";
import { assets, quoteCartLimits } from "@/config/storage";
import { useQuoteCart } from "@/components/quote/quote-cart-provider";
import { quoteRequestSchema, type QuoteApiResponse } from "@/lib/quote/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FieldErrors {
  customer_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
}

export function QuotePageClient() {
  const router = useRouter();
  const cart = useQuoteCart();
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  if (!cart.ready) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <FileText className="size-10 text-muted-foreground" aria-hidden />
        <p className="font-medium text-foreground">報價車目前是空的</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          瀏覽商品並點「加入報價車」,即可在此整理數量與備註,一次送出詢價。
        </p>
        <Link
          href={routes.products}
          className="mt-1 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          去逛商品
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      contact: {
        customer_name: String(fd.get("customer_name") ?? ""),
        company: String(fd.get("company") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        message: String(fd.get("message") ?? ""),
      },
      items: cart.items.map((it) => ({
        product_id: it.productId,
        quantity: it.quantity,
        note: it.note,
      })),
      website: String(fd.get("website") ?? ""),
    };

    const parsed = quoteRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      let general: string | null = null;
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (path.startsWith("contact.")) {
          errors[path.replace("contact.", "") as keyof FieldErrors] = issue.message;
        } else {
          general = issue.message;
        }
      }
      setFieldErrors(errors);
      setFormError(general);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(routes.api.quote, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as QuoteApiResponse;

      if (body.ok) {
        cart.clear();
        router.push(routes.quoteSuccess(body.referenceCode));
        return;
      }

      if (body.invalidProductIds?.length) {
        body.invalidProductIds.forEach((id) => cart.removeItem(id));
      }
      setFormError(body.error);
    } catch {
      setFormError("連線異常,請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* 品項列表 */}
      <div className="space-y-3">
        {cart.items.map((item) => (
          <div
            key={item.productId}
            className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-card p-3 sm:flex-nowrap"
          >
            <Link
              href={routes.productDetail(item.slug)}
              className="relative block size-16 shrink-0 overflow-hidden rounded-md border border-border bg-white"
            >
              <Image
                src={assets.productPlaceholder}
                alt={item.name}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
              <Link
                href={routes.productDetail(item.slug)}
                className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
              >
                {item.name}
              </Link>
              <Input
                value={item.note}
                onChange={(e) => cart.updateNote(item.productId, e.target.value)}
                placeholder="品項備註(規格、長度、加工、包裝…)"
                maxLength={quoteCartLimits.maxNoteLength}
                aria-label={`${item.sku} 備註`}
                className="mt-2 h-8 text-xs"
              />
            </div>

            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
              <div className="flex items-center rounded-md border border-input bg-card">
                <button
                  type="button"
                  aria-label="減少數量"
                  className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                  onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="size-3.5" aria-hidden />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={quoteCartLimits.maxQuantity}
                  value={item.quantity}
                  onChange={(e) => cart.updateQuantity(item.productId, Number(e.target.value))}
                  aria-label={`${item.sku} 數量`}
                  className="h-8 w-14 border-x border-input bg-transparent text-center text-sm tabular-nums text-foreground focus-visible:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="增加數量"
                  className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={() => cart.removeItem(item.productId)}
                aria-label={`移除 ${item.sku}`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                移除
              </button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          共 {cart.items.length} 項(上限 {quoteCartLimits.maxItems} 項)。價格與交期由業務確認後回覆。
        </p>
      </div>

      {/* 聯絡表單 */}
      <Card className="h-fit lg:sticky lg:top-32">
        <CardHeader>
          <CardTitle>聯絡資料</CardTitle>
          <CardDescription>免註冊登入,送出後立即取得案件編號。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="customer_name" required>
                姓名
              </Label>
              <Input id="customer_name" name="customer_name" autoComplete="name" maxLength={100} />
              {fieldErrors.customer_name ? (
                <p className="text-xs text-destructive">{fieldErrors.customer_name}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">公司名稱</Label>
              <Input id="company" name="company" autoComplete="organization" maxLength={100} />
              {fieldErrors.company ? (
                <p className="text-xs text-destructive">{fieldErrors.company}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" name="email" type="email" autoComplete="email" maxLength={255} />
              {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">聯絡電話</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} />
              {fieldErrors.phone ? <p className="text-xs text-destructive">{fieldErrors.phone}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">需求說明</Label>
              <Textarea
                id="message"
                name="message"
                rows={4}
                maxLength={2000}
                placeholder="交期需求、替代料、加工、發票或其他說明…"
              />
              {fieldErrors.message ? (
                <p className="text-xs text-destructive">{fieldErrors.message}</p>
              ) : null}
            </div>

            {/* honeypot:一般使用者不可見、不可填 */}
            <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
              <label htmlFor="website">請勿填寫此欄位</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {formError ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>{formError}</p>
              </div>
            ) : null}

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              {submitting ? "送出中…" : `送出詢價(${cart.items.length} 項)`}
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              送出即代表同意我們以上述聯絡方式回覆報價;個資僅用於本次詢價服務。
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
