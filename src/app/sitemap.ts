import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { getSiteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** sitemap 只包含公開頁與 active 商品(草稿/封存絕不出現) */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}${routes.home}`, changeFrequency: "daily", priority: 1 },
    { url: `${base}${routes.products}`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}${routes.about}`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    const productEntries: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${base}${routes.productDetail(p.slug)}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticEntries, ...productEntries];
  } catch (e) {
    // 資料庫暫時不可用時仍回傳靜態頁(記錄錯誤,不偽造商品資料)
    console.error("[SC1986] sitemap 商品讀取失敗:", e);
    return staticEntries;
  }
}
