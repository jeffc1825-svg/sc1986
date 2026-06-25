import { NextResponse, after, type NextRequest } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { siteConfig } from "@/config/site";
import { quoteRequestSchema, type QuoteApiResponse } from "@/lib/quote/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/quote/turnstile";
import { sendQuoteNotification, type SendResult } from "@/lib/notifications/quote-email";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;

function json(body: QuoteApiResponse, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : null)?.trim() || "unknown";
}

/** 通知結果回寫 — 失敗不可吞掉,至少留 console 紀錄 */
async function recordNotification(quoteId: string, result: SendResult) {
  const status = result.status;
  const error =
    result.status === "failed" ? result.error : result.status === "skipped" ? result.reason : null;
  try {
    const service = createSupabaseServiceClient();
    const { error: dbError } = await service
      .from("quote_requests")
      .update({ notification_status: status, notification_error: error })
      .eq("id", quoteId);
    if (dbError) {
      console.error(`[SC1986] 通知狀態回寫失敗 quote=${quoteId}:`, dbError.message);
    }
  } catch (e) {
    // 開發環境可能沒有 service key:留下紀錄,不讓詢價流程失敗
    console.error(`[SC1986] 無法回寫通知狀態 quote=${quoteId}(${status}):`, e);
  }
}

export async function POST(request: NextRequest) {
  if (!siteConfig.features.quoteRequest.enabled) {
    return json({ ok: false, error: siteConfig.features.quoteRequest.disabledMessage }, 503);
  }

  // 1) payload 大小上限
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "資料量過大,請減少品項或備註長度。" }, 413);
  }

  // 2) rate limit
  const rate = checkRateLimit(`quote:${clientIp(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: "送出太頻繁,請稍候再試。" },
      429,
      { "Retry-After": String(rate.retryAfterSec) },
    );
  }

  // 3) 解析與驗證(含 honeypot)
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: "資料量過大,請減少品項或備註長度。" }, 413);
    }
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "資料格式錯誤,請重新整理後再試。" }, 400);
  }

  const parsed = quoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return json({ ok: false, error: first?.message ?? "資料驗證失敗" }, 422);
  }
  const { contact, items } = parsed.data;

  // 4) Turnstile 人機驗證(未設定 secret 的開發環境會略過;正式環境 fail-closed)
  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, clientIp(request));
  if (!turnstile.ok) {
    if (turnstile.reason === "verify-unavailable") {
      return json({ ok: false, error: "驗證服務暫時無法使用,請稍後再試或來電聯絡。" }, 503);
    }
    return json({ ok: false, error: "人機驗證未通過,請重新驗證後再送出。" }, 422);
  }

  // 5) 原子寫入(RPC 內部重查 active 商品並快照 sku/name;匿名詢價,無 cookie anon client)
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("create_quote_request", {
    p_contact: {
      customer_name: contact.customer_name,
      company: contact.company || null,
      email: contact.email,
      phone: contact.phone || null,
      message: contact.message || null,
    },
    p_items: items.map((it) => ({
      product_id: it.product_id,
      quantity: it.quantity,
      note: it.note || null,
    })),
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("INVALID_ITEM: product")) {
      const ids = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) ?? [];
      return json(
        {
          ok: false,
          error: "部分商品已下架或無法詢價,請移除後再送出。",
          invalidProductIds: ids,
        },
        422,
      );
    }
    if (message.includes("INVALID_")) {
      return json({ ok: false, error: "資料驗證失敗,請檢查後再送出。" }, 422);
    }
    console.error("[SC1986] 建立詢價失敗:", message);
    return json({ ok: false, error: "系統暫時無法受理詢價,請稍後再試或來電聯絡。" }, 500);
  }

  const result = data as { id: string; reference_code: string };

  // 6) 回應後寄送通知並回寫結果(不阻塞使用者)
  after(async () => {
    try {
      const service = createSupabaseServiceClient();
      const { data: itemRows } = await service
        .from("quote_items")
        .select("sku, name, quantity, note")
        .eq("quote_request_id", result.id)
        .order("created_at", { ascending: true });

      const sendResult = await sendQuoteNotification({
        referenceCode: result.reference_code,
        customerName: contact.customer_name,
        company: contact.company || null,
        email: contact.email,
        phone: contact.phone || null,
        message: contact.message || null,
        items: itemRows ?? [],
      });
      await recordNotification(result.id, sendResult);
    } catch (e) {
      console.error("[SC1986] 通知流程異常:", e);
      await recordNotification(result.id, {
        status: "failed",
        error: e instanceof Error ? e.message : "通知流程異常",
      });
    }
  });

  return json({ ok: true, referenceCode: result.reference_code }, 201);
}
