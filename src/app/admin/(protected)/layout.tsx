import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileUp, Gauge, LogOut, MessageSquareQuote, Package } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { logoutAction } from "@/lib/admin/auth-actions";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: { default: "管理後台", template: `%s | ${siteConfig.shortName} 管理後台` },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const nav = [
  { label: "儀表板", href: routes.admin.root, icon: Gauge },
  { label: "商品管理", href: routes.admin.products, icon: Package },
  { label: "CSV 匯入", href: routes.admin.import, icon: FileUp },
  { label: "詢價管理", href: routes.admin.quotes, icon: MessageSquareQuote },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Fail-closed:非有效管理者直接 redirect,不渲染任何後台內容
  const { admin } = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card md:min-h-dvh md:w-56 md:border-b-0 md:border-r">
        <Link href={routes.admin.root} className="flex items-center gap-2 px-4 py-4">
          <Image
            src={siteConfig.brand.logo}
            alt={siteConfig.brand.logoAlt}
            width={32}
            height={32}
            className="size-8"
          />
          <span className="text-sm font-bold text-foreground">
            {siteConfig.shortName} 後台
          </span>
        </Link>

        <nav aria-label="後台選單" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-border p-3 md:block">
          <p className="truncate px-1 text-xs text-muted-foreground">
            {admin.name}({admin.role})
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <LogOut className="size-3.5" aria-hidden />
                登出
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* 行動版頂列登出 */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 md:hidden">
        <p className="text-xs text-muted-foreground">
          {admin.name}({admin.role})
        </p>
        <div className="flex items-center gap-1">
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-3.5" aria-hidden />
              登出
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>

      <main className="min-w-0 flex-1 bg-background p-4 md:p-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
