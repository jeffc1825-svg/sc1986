import "server-only";
import { getNotificationEnv } from "@/lib/env";
import { siteConfig } from "@/config/site";

interface QuoteEmailPayload {
  referenceCode: string;
  customerName: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  items: { sku: string; name: string; quantity: number; note: string | null }[];
}

export type SendResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildHtml(p: QuoteEmailPayload): string {
  const rows = p.items
    .map(
      (it, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;">${escapeHtml(it.sku)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHtml(it.name)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${it.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHtml(it.note ?? "")}</td>
      </tr>`,
    )
    .join("");

  return `
  <div style="font-family:sans-serif;max-width:640px;">
    <h2 style="color:#D7373F;">新詢價案件 ${escapeHtml(p.referenceCode)}</h2>
    <table style="border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 8px;color:#666;">姓名</td><td style="padding:4px 8px;">${escapeHtml(p.customerName)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;">公司</td><td style="padding:4px 8px;">${escapeHtml(p.company ?? "—")}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;">Email</td><td style="padding:4px 8px;">${escapeHtml(p.email)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;">電話</td><td style="padding:4px 8px;">${escapeHtml(p.phone ?? "—")}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top;">需求說明</td><td style="padding:4px 8px;white-space:pre-line;">${escapeHtml(p.message ?? "—")}</td></tr>
    </table>
    <h3 style="margin-top:16px;">品項(${p.items.length})</h3>
    <table style="border-collapse:collapse;width:100%;font-size:13px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px 8px;text-align:left;">#</th>
          <th style="padding:6px 8px;text-align:left;">SKU</th>
          <th style="padding:6px 8px;text-align:left;">品名</th>
          <th style="padding:6px 8px;text-align:right;">數量</th>
          <th style="padding:6px 8px;text-align:left;">備註</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#999;font-size:12px;margin-top:16px;">此信由 ${escapeHtml(siteConfig.name)} 系統自動寄出。</p>
  </div>`;
}

/**
 * 寄送詢價通知信(Resend REST API)。
 * 絕不 throw;一律回傳結果讓呼叫端記錄 notification_status。
 */
export async function sendQuoteNotification(payload: QuoteEmailPayload): Promise<SendResult> {
  let env: ReturnType<typeof getNotificationEnv>;
  try {
    env = getNotificationEnv();
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : "通知設定錯誤" };
  }
  if (!env) {
    return { status: "skipped", reason: "通知信環境變數未設定(開發環境)" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.from,
        to: [env.to],
        reply_to: payload.email,
        subject: `[詢價 ${payload.referenceCode}] ${payload.customerName} ${payload.company ? `(${payload.company})` : ""} — ${payload.items.length} 項`,
        html: buildHtml(payload),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: "failed", error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { status: "sent" };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : "寄信發生未知錯誤" };
  }
}
