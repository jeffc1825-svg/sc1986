import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import type { AdminUserRow } from "@/types";

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
  admin: AdminUserRow;
}

/**
 * Fail-closed 管理者驗證。
 * 所有 /admin 頁面 layout 與「每一個」管理端 Server Action / Route Handler
 * 都必須呼叫;任何錯誤一律視為未授權。
 */
export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(routes.admin.login);
  }

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !admin) {
    // 有登入但不是有效管理者:登出並回登入頁(fail closed)
    await supabase.auth.signOut();
    redirect(`${routes.admin.login}?error=forbidden`);
  }

  return { supabase, user, admin: admin as AdminUserRow };
}
