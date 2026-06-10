/**
 * 路由集中設定 — 全站唯一的路由真相來源。
 * 頁面、元件、Server Action、Route Handler 一律 import 自此檔,
 * 不得硬編 "/products"、"/admin"、"/api/*" 等字串。
 *
 * 注意:src/middleware.ts 的 config.matcher 因 Next.js 要求靜態字面值,
 * 無法 import 此檔;修改 admin 路徑時必須同步修改 middleware.ts。
 */

export const routes = {
  home: "/",
  products: "/products",
  productDetail: (slug: string) => `/products/${encodeURIComponent(slug)}`,
  quote: "/quote",
  quoteSuccess: (ref: string) => `/quote/success?ref=${encodeURIComponent(ref)}`,
  about: "/about",

  api: {
    quote: "/api/quote",
    categories: "/api/categories",
  },

  admin: {
    root: "/admin",
    login: "/admin/login",
    products: "/admin/products",
    productNew: "/admin/products/new",
    productEdit: (id: string) => `/admin/products/${id}/edit`,
    productExport: "/admin/products/export",
    import: "/admin/import",
    importDetail: (id: string) => `/admin/import/${id}`,
    importErrors: (id: string) => `/admin/import/${id}/errors`,
    quotes: "/admin/quotes",
    quoteDetail: (id: string) => `/admin/quotes/${id}`,
  },
} as const;

/** 帶 query 參數的商品目錄連結 */
export function productsUrl(params: {
  q?: string;
  category?: string;
  brand?: string;
  price_mode?: string;
  stock_status?: string;
  sort?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  if (params.price_mode) sp.set("price_mode", params.price_mode);
  if (params.stock_status) sp.set("stock_status", params.stock_status);
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${routes.products}?${qs}` : routes.products;
}
