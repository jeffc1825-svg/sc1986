import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * 伺服器端 Supabase client(anon key + cookie session)。
 * - 後台讀寫(登入後 RLS 依 is_admin() 放行)與 /api/quote RPC
 * - 注意:公開型錄讀取請改用 lib/supabase/public.ts(無 cookie),
 *   避免訪客/過期 session 觸發 token refresh(曾因此打爆 Auth API 429)
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    global: {
      // 明確 no-store:避開 Next patched fetch 的快取/tee 串流路徑(vercel/next.js#68319)
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component 內呼叫 set 會 throw;session 由 middleware 負責刷新,可安全忽略
        }
      },
    },
  });
}
