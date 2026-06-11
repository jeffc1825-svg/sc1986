import "server-only";
import { getTurnstileEnv } from "@/lib/env";

/**
 * Cloudflare Turnstile 伺服器端驗證(siteverify)。
 * - 未設定 TURNSTILE_SECRET_KEY(開發環境)→ 一律放行。
 * - 正式環境缺設定 → getTurnstileEnv() throw(fail-closed)。
 * - siteverify 連不上或回應異常 → 拒絕(fail-closed),不得放行。
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "missing-token" | "invalid-token" | "verify-unavailable" };

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string,
): Promise<TurnstileResult> {
  const env = getTurnstileEnv();
  if (!env) return { ok: true }; // 開發環境未設定 → 略過

  if (!token) return { ok: false, reason: "missing-token" };

  let data: SiteverifyResponse;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.secretKey,
        response: token,
        ...(remoteIp !== "unknown" ? { remoteip: remoteIp } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[SC1986] Turnstile siteverify HTTP ${res.status}`);
      return { ok: false, reason: "verify-unavailable" };
    }
    data = (await res.json()) as SiteverifyResponse;
  } catch (e) {
    console.error("[SC1986] Turnstile siteverify 連線失敗:", e);
    return { ok: false, reason: "verify-unavailable" };
  }

  if (!data.success) {
    const codes = data["error-codes"] ?? [];
    // 內部錯誤(非 token 問題)視為驗證服務異常
    if (codes.includes("internal-error")) {
      console.error("[SC1986] Turnstile siteverify internal-error");
      return { ok: false, reason: "verify-unavailable" };
    }
    return { ok: false, reason: "invalid-token" };
  }
  return { ok: true };
}
