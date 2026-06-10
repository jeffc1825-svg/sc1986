/**
 * Storage 集中設定 — localStorage key、Supabase bucket、資產路徑與上傳限制。
 * 任何元件不得硬編這些字串。
 */

export const storageKeys = {
  /** 報價車(localStorage,JSON) */
  quoteCart: "sc1986_quote_cart",
  /** 主題由 next-themes 管理,key 統一指定 */
  theme: "sc1986_theme",
} as const;

export const supabaseStorage = {
  /** 商品圖片 bucket(public read) */
  productImagesBucket: "product-images",
  /** 建立商品圖片的 storage path */
  productImagePath: (productId: string, fileName: string) =>
    `products/${productId}/${fileName}`,
} as const;

export const assets = {
  /** 無商品圖時的替代圖 */
  productPlaceholder: "/placeholder-product.svg",
} as const;

export const uploadLimits = {
  /** 商品圖片允許的 MIME type */
  imageMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  /** 單張圖片上限(bytes) */
  imageMaxBytes: 4 * 1024 * 1024,
  /** 單一商品圖片張數上限 */
  imagesPerProduct: 8,
  /** CSV 檔案上限(bytes) */
  csvMaxBytes: 4 * 1024 * 1024,
} as const;

export const quoteCartLimits = {
  /** 報價車品項上限 */
  maxItems: 50,
  /** 單品項數量上限 */
  maxQuantity: 9999,
  /** 品項備註長度上限 */
  maxNoteLength: 500,
} as const;
