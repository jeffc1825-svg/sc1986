import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <PackageSearch className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-bold text-foreground">找不到此頁面或商品</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        商品可能已下架或網址有誤。您可以瀏覽全部商品,或直接送出詢價由業務協助。
      </p>
      <div className="flex gap-3">
        <Link
          href={routes.products}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          瀏覽全部商品
        </Link>
        <Link
          href={routes.home}
          className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          回首頁
        </Link>
      </div>
    </div>
  );
}
