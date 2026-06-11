---
name: database
description: SC1986 Supabase 資料庫工作規範。新增/修改 migration、RLS、RPC、查詢邏輯或任何 schema 變更前必讀。涵蓋 schema 速查、RLS 模式、原子詢價 RPC、草稿規則與安全邊界。
---

# SC1986 資料庫技能

Schema 全貌見 `docs/02-architecture.md`;SQL 真相來源是 `supabase/migrations/`。
套用方式:`pnpm db:apply`(scripts/db-apply.mjs,需 `.env.local` 的 `SUPABASE_DB_URL`,以 `_migrations` 表追蹤已套用檔案);測試資料 `pnpm db:apply:seed`;管理者 `pnpm admin:create`。不要叫使用者去 Dashboard 貼 SQL。

## 硬規則

1. Schema 變更只透過新增 migration 檔(`supabase/migrations/NNNN_描述.sql`),不修改已套用的舊檔。
2. 每張新表必須:啟用 RLS、寫明 policy、加 `updated_at` trigger(用既有 `set_updated_at()`)。
3. 公開寫入只能經 SECURITY DEFINER RPC,絕不開 anon 的 INSERT/UPDATE policy。
4. `products.status` 是公開可見性的唯一開關:anon policy 一律 `status = 'active'`;`product_images`/`product_specs` 的 anon policy 必須 join 檢查母商品 active。
5. 匯入/AI 建立的商品 INSERT 時 status 一律 `'draft'`,由人工在後台改 `active`。
6. 詢價寫入只用 `create_quote_request` RPC:伺服器重查 active 商品、快照 sku/name、主檔+品項同交易;任何品項無效就整筆失敗。
7. `quote_requests.admin_note` 與 `notification_*` 不得被 anon 讀取(本來就無 anon SELECT policy,不要新開)。
8. 應用層查詢規則:目錄頁用 `range()` 分頁 + `count:'exact'`;搜尋用 `or(ilike...)` 比對 sku/name/short_description/description;分類篩選先在記憶體算 descendant ids 再 `in()`。
9. 分類為巢狀(adjacency list),**最深 4 層**:由 0002 的 `check_category_depth()` trigger 強制(防循環、防超深、parent FK on delete restrict),與 `CATEGORY_MAX_DEPTH`(types/domain.ts)同步。分類讀取一律走 `fetchAllCategories()`(記憶體 TTL 快取 5 分鐘);異動分類後呼叫 `invalidateCategoriesCache()` 或等 TTL 失效。**禁止用 `unstable_cache` 包 Supabase 查詢**(Node 20.16+/22 會炸 `transformAlgorithm is not a function`,vercel/next.js#68319)。

## 客戶端選用

| 情境 | 用哪個 |
| --- | --- |
| 公開頁讀 active 商品、sitemap、分類 | `lib/supabase/public.ts`(anon、**無 cookie**) |
| 公開詢價寫入(RPC) | `lib/supabase/public.ts` |
| 後台讀寫(已 requireAdmin)、登入流程 | `lib/supabase/server.ts`(cookie-aware,走 admin RLS) |
| Storage 上傳/刪除、通知狀態回寫 | `lib/supabase/service.ts`(service role,**只能在 server,呼叫前先 requireAdmin 或系統內部流程**) |

公開路徑**禁用 cookie-aware client**:訪客帶過期 admin cookie 時,每個請求(含 prefetch)都會觸發 token refresh,曾打爆 Auth API(429 over_request_rate_limit)。三個 client 都已強制 `fetch(..., { cache: 'no-store' })` 繞開 Next patched fetch 的串流 bug,新增 client 時必須照做。

## RLS 模式範本

```sql
-- 公開讀 active 商品
create policy "anon read active products" on products
  for select using (status = 'active' or is_admin());
-- 子表跟隨母商品
create policy "anon read images of active products" on product_images
  for select using (
    exists (select 1 from products p where p.id = product_id
            and (p.status = 'active' or is_admin())));
-- 管理者全權
create policy "admin all" on products
  for all using (is_admin()) with check (is_admin());
```

## 變更後驗證

- [ ] 新 migration 可在乾淨資料庫由上而下重放成功
- [ ] anon 查 draft 商品回空、anon 直接 insert 被拒
- [ ] RPC 傳入無效 product_id 時整筆回滾(無孤兒主檔)
- [ ] `src/types/database.ts` 同步更新欄位型別
- [ ] `docs/02-architecture.md` 資料模型表同步更新
