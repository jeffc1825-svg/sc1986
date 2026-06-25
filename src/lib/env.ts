/**
 * 環境變數驗證 — fail-closed。
 * 缺必要變數時直接 throw,正式環境不得以示範資料掩蓋設定錯誤。
 */

class EnvError extends Error {
  constructor(name: string) {
    super(
      `[SC1986] 缺少必要環境變數 ${name}。請依 .env.example 設定;正式環境缺少設定時必須失敗(fail-closed)。`,
    );
    this.name = "EnvError";
  }
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") throw new EnvError(name);
  return value;
}

/** Supabase 公開設定(server 與 client 皆可用) */
export function getSupabaseEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Service role(僅伺服器端;呼叫端必須已完成權限檢查) */
export function getServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** 站台正式網址(SEO / sitemap / OG 用) */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * 通知信設定。
 * 開發環境允許未設定(回傳 null,通知記為 skipped);
 * 正式環境(VERCEL_ENV=production)缺設定時 throw。
 */
export function getNotificationEnv(): {
  resendApiKey: string;
  to: string;
  from: string;
} | null {
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_NOTIFICATION_EMAIL;
  const from = process.env.QUOTE_NOTIFICATION_FROM;
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!resendApiKey || !to || !from) {
    if (isProduction) {
      throw new EnvError("RESEND_API_KEY / QUOTE_NOTIFICATION_EMAIL / QUOTE_NOTIFICATION_FROM");
    }
    return null;
  }
  return { resendApiKey, to, from };
}

/**
 * Cloudflare Turnstile site key(公開,client 與 server 皆可用)。
 * 未設定回傳 null → 前端不渲染驗證 widget(開發環境允許)。
 */
export function getTurnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
}

/**
 * Cloudflare Turnstile secret(僅伺服器端)。
 * 開發環境允許未設定(回傳 null → 略過驗證);
 * 正式環境(VERCEL_ENV=production)缺設定時 throw(fail-closed)。
 */
export function getTurnstileEnv(): { secretKey: string } | null {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!secretKey) {
    if (isProduction) throw new EnvError("TURNSTILE_SECRET_KEY");
    return null;
  }
  return { secretKey };
}
