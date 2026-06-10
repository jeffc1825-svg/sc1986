import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "管理登入",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // 已是有效管理者 → 直接進後台
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (admin) redirect(routes.admin.root);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image
            src={siteConfig.brand.logo}
            alt={siteConfig.brand.logoAlt}
            width={48}
            height={48}
            className="mx-auto size-12"
          />
          <CardTitle className="mt-2">{siteConfig.shortName} 管理後台</CardTitle>
          <CardDescription>限授權人員使用</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm initialError={error === "forbidden" ? "此帳號沒有管理權限。" : undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
