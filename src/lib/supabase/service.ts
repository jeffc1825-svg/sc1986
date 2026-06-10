import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseEnv } from "@/lib/env";

/**
 * Service role client — 繞過 RLS。
 *
 * 安全邊界(違反即重大事故):
 * 1. 僅伺服器端(此檔已標 server-only,import 進 client bundle 會直接 build error)。
 * 2. 呼叫端必須先完成 requireAdmin() 權限檢查,或屬於系統內部流程
 *    (例:詢價通知狀態回寫)。
 * 3. 回傳值與錯誤訊息不得外洩 key。
 */
export function createSupabaseServiceClient(): SupabaseClient {
  const { url } = getSupabaseEnv();
  return createClient(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
