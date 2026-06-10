import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * 伺服器端 Supabase client(anon key + cookie session)。
 * - 公開頁讀取 active 商品(RLS 生效)
 * - 後台讀寫(登入後 RLS 依 is_admin() 放行)
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
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
