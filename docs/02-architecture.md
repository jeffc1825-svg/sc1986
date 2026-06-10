# 02 技術架構

## 架構總覽

```text
客戶 / 管理者
   │
Cloudflare(DNS / HTTPS / CDN / 基礎防護)
   │
Vercel(Next.js 15 App Router:前台 + /admin + Route Handlers + Server Actions)
   │
Supabase(PostgreSQL / Auth / Storage / RLS / RPC)
   └ Resend(詢價通知信)
```

## 技術棧與版本基準

| 項目 | 選擇 |
| --- | --- |
| 框架 | Next.js 15(App Router)、React 19 |
| 語言 | TypeScript 5 strict |
| 樣式 | Tailwind CSS v4(CSS-first `@theme`,無 tailwind.config) |
| UI | 自製 shadcn 風格元件 `src/components/ui/`,icon 用 lucide-react,無 Radix |
| 資料 | Supabase JS 2.x + `@supabase/ssr` |
| 驗證 | Zod |
| 主題 | next-themes(class 策略) |
| CSV | papaparse(伺服器端解析) |
| 套件 | pnpm,只維護 `pnpm-lock.yaml` |

升級任何主要版本前:查官方遷移文件 → 固定版本 → `typecheck/lint/build` + 主要流程驗證。

## 目錄結構

```text
src/
  app/
    (globals.css, layout.tsx, page.tsx, error.tsx, not-found.tsx, sitemap.ts, robots.ts, icon.png)
    products/page.tsx            # 目錄:搜尋/篩選/分頁(全部伺服器端)
    products/[slug]/page.tsx     # 詳情
    quote/page.tsx               # 報價車+表單
    quote/success/page.tsx
    about/page.tsx
    api/quote/route.ts           # POST 建立詢價
    admin/login/page.tsx
    admin/(protected)/
      layout.tsx                 # fail-closed requireAdmin
      page.tsx                   # 儀表板
      products/ products/new/ products/[id]/edit/ products/export(route.ts)
      import/ import/[id]/ import/[id]/errors(route.ts)
      quotes/ quotes/[id]/
  components/ ui/ site/ catalog/ quote/ admin/ theme/
  config/ routes.ts storage.ts site.ts
  lib/
    env.ts                       # 環境變數驗證(fail-closed)
    utils.ts
    supabase/ (browser.ts server.ts service.ts middleware.ts)
    catalog/ (queries.ts categories.ts)
    quote/ (schema.ts rate-limit.ts)
    admin/ (guard.ts product-actions.ts import-actions.ts quote-actions.ts csv.ts)
    notifications/ (quote-email.ts)
  types/ (database.ts domain.ts)
  middleware.ts
supabase/ migrations/ seed.sql
public/ brand/ placeholder-product.svg
```

## 集中設定(嚴格執行)

- `src/config/routes.ts`:所有頁面路由、API path、middleware matcher、產生器(如 `routes.productDetail(slug)`)。
- `src/config/storage.ts`:localStorage key(`sc1986_quote_cart`、`sc1986_theme`)、bucket `product-images`、公開資產前綴、fallback 圖、path 建立規則、上傳限制(MIME/大小/張數)。
- `src/config/site.ts`:站名、公司資訊、聯絡方式、營業時間、導覽連結、社群連結、預設 SEO。

## 公開路由

| 路由 | 用途 |
| --- | --- |
| `/` | 首頁(主視覺、分類捷徑、新品、品牌牆) |
| `/products?q=&category=&brand=&price_mode=&stock_status=&sort=&page=` | 目錄 |
| `/products/[slug]` | 詳情 |
| `/quote`、`/quote/success?ref=` | 報價車、成功頁 |
| `/about` | 公司與服務說明 |
| `POST /api/quote` | 建立詢價 |

## 管理路由

`/admin/login`、`/admin`(儀表板)、`/admin/products`(+ `/new`、`/[id]/edit`、`/export`)、`/admin/import`(+ `/[id]`、`/[id]/errors`)、`/admin/quotes`(+ `/[id]`)。

## 資料模型(10 表 + enum)

enum:`product_price_mode(public_price|quote_only|login_or_quote)`、`product_stock_status(in_stock|preorder|quote_required|discontinued)`、`product_status(draft|active|archived)`、`quote_status(new|reviewing|quoted|closed|cancelled)`、`admin_role(owner|admin|staff)`、`import_batch_status(pending|processing|completed|failed)`、`notification_status(pending|sent|failed|skipped)`。

| 表 | 重點欄位 |
| --- | --- |
| `brands` | name/slug unique、website |
| `categories` | parent_id 自參照、slug unique、sort_order |
| `products` | sku/slug unique、brand_id、category_id、short_description、description、ordering_notice、pricing_note、price numeric(12,2)、price_mode、stock_status、status |
| `product_images` | product_id、storage_path、public_url、alt、sort_order |
| `product_specs` | product_id、name、value、unit、sort_order |
| `admin_users` | auth_user_id unique、name、role、is_active |
| `quote_requests` | reference_code unique(如 Q20260610-7F3K)、customer_name、company、email、phone、message、status、admin_note、notification_status、notification_error |
| `quote_items` | quote_request_id、product_id nullable、sku/name 快照、quantity>0、note |
| `product_import_batches` | uploaded_by、original_filename、status、row_count、success_count、error_count、error_summary |
| `product_import_rows` | batch_id、row_number、raw_data jsonb、normalized_data jsonb、error_message、product_id |

`quote_items.sku/name` 是詢價當下快照;商品日後修改或刪除,案件仍可讀。

## RLS 與權限

公開(anon):`brands`/`categories` 可讀;`products` 只讀 `status='active'`;`product_images`/`product_specs` 只讀 active 商品的列。公開寫入只透過 RPC,不開放直接 INSERT。
管理(authenticated + `is_admin()`):全表讀寫。`is_admin()` = `admin_users` 存在 `auth_user_id = auth.uid()` 且 `is_active`,SECURITY DEFINER。
Service role:只在伺服器端、且呼叫前已通過 `requireAdmin()`(或系統內部用途如通知狀態回寫);絕不進瀏覽器 bundle、log、錯誤畫面。

## 詢價 RPC(高風險核心)

`create_quote_request(p_contact jsonb, p_items jsonb) → {id, reference_code}`,SECURITY DEFINER:

1. 驗證 contact 必填與長度、items 1–50 筆、quantity 1–9999。
2. 以傳入 product_id 重查 `status='active'` 商品,任何一筆無效 → 整筆 RAISE(交易回滾)。
3. SKU/name 以資料庫當下值寫入快照,不用瀏覽器傳值。
4. 產生 `reference_code`,主檔+品項同交易寫入。

`/api/quote` 在 RPC 之外另做:Zod 解析、body ≤ 32KB、IP rate limit(每分鐘 5 次,記憶體式,文件註明多 instance 限制)、honeypot 欄位 `website` 必須為空、成功後非同步寄信並回寫 `notification_status/notification_error`(用 service client;寄信失敗不可吞掉)。

## 商品搜尋(第一階段)

- Supabase 伺服器端查詢:`ILIKE` 比對 `sku/name/short_description/description`(pg_trgm GIN 索引加速),品牌與分類用篩選器涵蓋。
- 分類篩選含整棵子樹:categories 全量(小表)讀入後算出 descendant ids,`in('category_id', ids)`。
- 分頁 `range()` + `count: 'exact'`;排序:最新/SKU/名稱。
- 商品達數千筆且中文搜尋品質不足時,第二階段導入 Meilisearch。
- 禁止一次載入全部商品到瀏覽器再篩選。

## 環境變數(`src/lib/env.ts` 驗證)

```dotenv
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Server only
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
QUOTE_NOTIFICATION_EMAIL=
QUOTE_NOTIFICATION_FROM=
```

正式環境缺必要變數 → 直接報錯(fail-closed),不得悄悄切換示範資料。開發環境允許缺 RESEND(通知記為 `skipped`)。

## 渲染策略

所有讀 DB 的頁面 `dynamic = 'force-dynamic'`(無 build-time DB 依賴,build 不需要連線)。`error.tsx` 顯示中性錯誤畫面,絕不以示範資料掩蓋。圖片用 next/image,remotePatterns 允許 `*.supabase.co` 與本地資產,無圖時用 `placeholder-product.svg`。

## 最低測試要求

`pnpm typecheck`、`pnpm lint`、`pnpm build` 全綠;高風險流程依 `.claude/skills/qa-release/` 清單人工驗證:詢價端對端、價格模式顯示、權限(匿名進 /admin 被擋)、CSV 匯入草稿規則、light/dark。
