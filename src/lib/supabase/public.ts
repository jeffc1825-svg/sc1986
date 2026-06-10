import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

/**
 * 無 cookie 的公開 anon client — 專供「可跨請求快取」的公開資料讀取
 * (如分類樹的記憶體 TTL 快取;cookie-aware client 不可跨請求共用)。
 * 不可用於任何需要使用者 session 的查詢;後台一律用 server.ts / service.ts。
 */
export function createSupabasePublicClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // 明確 no-store:讓 Next.js patched fetch 走直通路徑,
      // 避開其快取/tee 串流(Node 20.16+/22 會炸 transformAlgorithm,見 vercel/next.js#68319)
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
