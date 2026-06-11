"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { routes } from "@/config/routes";

export interface LoginState {
  error: string | null;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "請輸入 Email 與密碼。" };
  }

  // 與 /api/quote 同款的滑動視窗限流(每 60 秒 5 次):
  // 以 IP 防大範圍掃描、以 email 防鎖定單一帳號的分散式嘗試。
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipRate = checkRateLimit(`admin-login:ip:${ip}`);
  const emailRate = checkRateLimit(`admin-login:email:${email.toLowerCase()}`);
  if (!ipRate.allowed || !emailRate.allowed) {
    const retryAfterSec = Math.max(ipRate.retryAfterSec, emailRate.retryAfterSec);
    return { error: `登入嘗試次數過多,請於 ${retryAfterSec} 秒後再試。` };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "登入失敗,請確認帳號密碼。" };
  }

  // 必須是有效管理者,否則立即登出(fail closed)
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { error: "此帳號沒有管理權限。" };
  }

  redirect(routes.admin.root);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(routes.admin.login);
}
