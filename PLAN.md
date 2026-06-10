# PLAN.md — SC1986 建置計畫與進度追蹤

> 本檔是進度的唯一真相來源。每完成一項就勾選;每個工作階段結束時在文末 Progress Log 補一行紀錄。
> 階段採大顆粒拆分,完成 Stage 5 後由業主人工審查。

## 階段總覽

| Stage | 名稱                   | 狀態                |
| ----- | ---------------------- | ------------------- |
| 0     | 文件與規範重寫         | ✅ 完成(2026-06-10) |
| 1     | 專案基建與資料庫       | ✅ 完成(2026-06-10) |
| 2     | 前台商品型錄           | ✅ 完成(2026-06-10) |
| 3     | 報價車與詢價流程       | ✅ 完成(2026-06-10) |
| 4     | 管理後台               | ✅ 完成(2026-06-10) |
| 5     | SEO 與上線整備         | ✅ 完成(2026-06-10) |
| 6     | 業主審查與真實資料上線 | 🔶 等待人工         |

---

## Stage 0 — 文件與規範重寫 ✅

- [x] 刪除舊 docs 與根目錄舊資源,Logo 移至 `public/brand/logo.png`
- [x] `CLAUDE.md`(工作指引)
- [x] `PLAN.md`(本檔)
- [x] `README.md`(快速啟動)
- [x] `docs/01-business.md` 業務需求
- [x] `docs/02-architecture.md` 技術架構
- [x] `docs/03-design-system.md` 設計系統(業務型商城模板)
- [x] `docs/04-operations.md` 部署營運與驗收
- [x] `.claude/skills/ui-design/SKILL.md`
- [x] `.claude/skills/database/SKILL.md`
- [x] `.claude/skills/qa-release/SKILL.md`

## Stage 1 — 專案基建與資料庫 ✅

- [x] Next.js 15.3 + React 19 + TS strict + Tailwind v4 + pnpm,ESLint、`.env.example`、`.gitignore`
- [x] 集中設定:`src/config/routes.ts`、`storage.ts`、`site.ts`
- [x] 基礎 UI 元件(button、input、textarea、select、label、badge、card、table、skeleton、pagination)
- [x] Light / dark / system 主題(next-themes + 語意 token)
- [x] 全站佈局:頂部資訊列、Header(Logo+搜尋+報價車)、分類導覽、Footer
- [x] Supabase migration `0001_init.sql`:7 enum、10 表、索引、trigger、RLS、`is_admin()`、`create_quote_request` RPC、storage bucket
- [x] `supabase/seed.sql`:8 品牌、8+4 分類、26 商品(含 draft/archived 測試品)與規格
- [x] Supabase 客戶端(server anon / service-role / middleware)與 `lib/env.ts` fail-closed 驗證

## Stage 2 — 前台商品型錄 ✅

- [x] 首頁:品牌紅 Hero、分類捷徑(8 格)、最新上架、詢價流程 3 步驟、現貨/商品統計、品牌牆
- [x] `/products`:ILIKE 搜尋(SKU/品名/簡述/描述)、分類樹側欄(含子孫分類)、價格模式/庫存/品牌篩選、3 種排序、分頁(24/頁,全伺服器端)
- [x] `/products/[slug]`:麵包屑、多圖 gallery、規格表、PriceDisplay 嚴格依 price_mode、訂購說明、相關商品(同分類→同品牌)
- [x] 行動版:抽屜分類選單、details 收合篩選
- [x] `loading.tsx` 骨架、`error.tsx`(fail-closed)、`not-found.tsx`

## Stage 3 — 報價車與詢價流程 ✅

- [x] QuoteCart context + localStorage(`sc1986_quote_cart`、結構驗證、損壞自清、上限 50 項/9999 件)
- [x] Header 報價車數量 badge
- [x] `/quote`:品項編輯(數量/備註/移除)、聯絡表單、Zod 前端驗證
- [x] `/api/quote`:Zod、32KB 上限、IP rate limit(5 次/分)、honeypot、RPC 原子寫入、無效品項回報並自動移除
- [x] `/quote/success?ref=`:案件編號顯示
- [x] Resend 通知信(REST,無 SDK)+ `notification_status/error` 以 service client 回寫;開發環境無金鑰記為 skipped

## Stage 4 — 管理後台 ✅

- [x] `/admin/login` + Supabase Auth;`requireAdmin()` fail-closed(layout + 每個 action/route handler 雙重檢查;非管理者自動登出)
- [x] 儀表板:商品/詢價統計卡、通知失敗警示、最新 5 件詢價
- [x] 商品列表:搜尋、狀態篩選、分頁、批量上架/草稿/封存/刪除(刪除同步清 Storage)
- [x] 商品新增/編輯:Zod、slug 自動產生與衝突處理、規格動態列、多圖上傳(MIME/4MB/8 張)與排序/刪除
- [x] CSV 匯出(route handler、BOM、規格序列化)
- [x] CSV 匯入:批次+逐列記錄、成功列一律 draft、單列錯誤不中止、錯誤列 CSV 下載;品牌/分類不存在即報錯(不自動建立);圖片不在匯入範圍(授權考量)
- [x] 詢價管理:列表篩選(狀態/關鍵字)、詳情(客戶/品項快照)、狀態更新、內部備註(無公開 API 暴露)

## Stage 5 — SEO 與上線整備 ✅

- [x] 全站與商品頁 metadata、OG、canonical;成功頁/後台 noindex
- [x] `sitemap.ts`(只含 active 商品,上限 5000)、`robots.ts`(擋 /admin、/api)
- [x] `/about` 公司與詢價流程說明頁
- [x] `pnpm typecheck` ✅ / `pnpm lint` ✅ / `pnpm build` ✅(22 路由,build 不需 DB 連線)
- [x] 煙霧測試:robots 200;無環境變數時 `/` 與 `/admin` fail-closed(500,無示範資料)
- [x] 更新本檔與 Progress Log

## Stage 6 — 業主審查與真實資料上線(人工)🔶

- [ ] 業主審查 UI、文案、流程(`src/config/site.ts` 的統編/電話/地址/信箱為占位,需更換)
- [x] 開發 Supabase 專案連線資料已設定於 `.env.local`;建庫改為一鍵指令 `pnpm db:apply:seed` + `pnpm admin:create`(免開瀏覽器,待補 `SUPABASE_DB_URL` 後在本機執行)
- [ ] 正式環境:`pnpm db:apply`(不灌 seed)→ `pnpm admin:create` 建正式管理者
- [ ] 開發環境驗證種子資料流程後,正式環境匯入真實且已授權的商品(CSV → 草稿 → 審核上架)
- [ ] Vercel 環境變數、網域、Cloudflare DNS、Resend 寄件網域驗證
- [ ] 依 `.claude/skills/qa-release/` 完成權限/詢價/匯入/雙主題/RWD 端對端 QA

## 已知限制與第二階段候選

- Rate limit 為記憶體式(多 instance 各自計數);流量大後改集中式(Upstash 等)。
- 搜尋為 ILIKE + pg_trgm,不含規格欄位;中文檢索品質需求高時導入 Meilisearch。
- 商品圖片需在商品建立後於編輯頁上傳;CSV 不匯入圖片(授權控管)。
- 會員中心、線上付款(ECPay/NewebPay)、訂單物流、AI 客服 → 第二階段。

---

## Progress Log

| 日期       | 階段           | 紀錄                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | Stage 0        | 啟動重建:清除舊文件,確認技術棧 Next.js 15 + Supabase,完成全部新文件與 3 個 skills。                                                                                                                                                                                                                                                                                                                                                 |
| 2026-06-10 | Stage 1        | 專案骨架、集中設定、UI 元件、主題、佈局、migration(10 表+RLS+RPC)與 seed 完成;pnpm install 成功。                                                                                                                                                                                                                                                                                                                                   |
| 2026-06-10 | Stage 2        | 首頁/目錄/詳情/關於完成,伺服器端搜尋篩選分頁。                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-06-10 | Stage 3        | 報價車、/api/quote(原子 RPC+防濫用)、成功頁、Resend 通知與狀態回寫完成。                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-10 | Stage 4        | 登入與 fail-closed 守門、儀表板、商品 CRUD+圖片+批量、CSV 匯出入、詢價管理完成。                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-10 | Stage 5        | SEO/sitemap/robots、typecheck+lint+build 全綠、fail-closed 煙霧測試通過;交付業主審查(Stage 6)。                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-10 | Stage 6 前置   | 新增免瀏覽器建庫工具:`pnpm db:apply`(migration runner)、`pnpm admin:create`(建管理者);seed 擴充至 78 筆測試商品(+52,含 draft/archived 測試品);SQL 經 libpg_query 解析驗證、SKU/slug 無重複;`.env.local` 已寫入業主提供的 Supabase 連線金鑰(待補 DB 密碼)。                                                                                                                                                                          |
| 2026-06-10 | 巢狀分類       | 分類改巢狀最深 4 層(migration 0002:深度/循環 trigger、parent FK restrict);新增 `GET /api/categories`(Data Cache 5 分鐘 + CDN 快取),Header 選單改非同步取用;目錄頁麵包屑+子分類卡格、側欄遞迴樹、行動版手風琴;後台分類下拉依深度縮排、CSV 匯入分類重名改報錯提示用 slug;seed 改 4 層分類樹(39 分類、80 商品),pglast 驗證無重複、深度=4;**待本機跑 `pnpm typecheck && pnpm lint && pnpm build` 驗證**(沙盒磁碟滿無法執行)。           |
| 2026-06-10 | 巢狀分類修正   | 執行期 `controller[kState].transformAlgorithm is not a function`(Node 20.16+/22 webstreams vs Next fetch 攔截,vercel/next.js#68319/#75995):移除 `unstable_cache`,`fetchAllCategories` 改自製記憶體 TTL 快取(5 分鐘、in-flight 去重、失敗不快取,`invalidateCategoriesCache()` 可手動失效);docs/02 與 database skill 已記入「禁用 unstable_cache 包 Supabase 查詢」。                                                                 |
| 2026-06-10 | 巢狀分類修正 2 | 瀏覽商品仍報 `transformAlgorithm` + Auth 429:根因是公開型錄用 cookie-aware client,訪客帶過期 admin cookie 時每個請求(含 prefetch)觸發 token refresh,refresh 回應再撞 Node webstreams bug 被當網路錯誤重試 → 打爆 Auth API。修正:公開路徑(queries.ts、sitemap、/api/quote)全改 `lib/supabase/public.ts`(無 cookie);三個 client fetch 一律 `cache:'no-store'` 繞開 patched fetch;middleware 無 sb- cookie 直接導登入頁不打 Auth API。 |
| 2026-06-10 | 巢狀分類 UI | 目錄側欄分類樹改 client 元件 `category-sidebar-tree.tsx`:有子分類的節點顯示箭頭(展開時旋轉 90°),點箭頭就地展開/收合、點名稱導航;預設仍沿選取路徑展開,路由切換重設手動狀態。 |
| 2026-06-10 | 安全升級       | Vercel 因 React2Shell(CVE-2025-66478 等)擋部署:next 15.3.3→15.3.8→16.2.6、react/react-dom 19.1.0→19.2.6、eslint-config-next 16.2.6;`next lint` 已被 16 移除,lint script 改 `eslint .`;Next 16 起 build 預設 Turbopack;`middleware.ts` 暫保留(16 標記棄用、改名 proxy.ts 會轉 Node runtime,留待日後 codemod);CLAUDE.md/docs-02 技術棧同步改 16。**待本機 `pnpm install` 更新 lockfile + `pnpm typecheck && pnpm lint && pnpm build` 驗證**(沙盒磁碟滿)。 |
| 2026-06-10 | proxy 遷移     | 依 16 棄用警告將 middleware 遷至 `src/proxy.ts`(`proxy` 具名匯出,matcher 不變;runtime 由 edge 轉 Node.js,updateSession 相容);**`src/middleware.ts` 須手動刪除**(沙盒無 shell,兩檔並存會使 build 失敗)。`Experiments: serverActions` 提示為 bodySizeLimit 所致,屬資訊性、無需處理。 |
| 2026-06-10 | 按鈕與表單 UX  | (1)全站按鈕 hover 手掌游標:globals.css `@layer base` button/role=button/summary 規則 + Button 基底 `cursor-pointer`、loading 時 `aria-busy`。(2)按鈕防抖:加入報價車(卡片+詳情)點擊後回饋期 `disabled`(`disabled:opacity-100` 保持「已加入」可讀);後台商品批量操作改逐鈕 `loading` spinner;其餘 mutation 按鈕原本即有 `loading={pending}`。(3)新增共用 `<FormField>`(`ui/form-field.tsx`):自動注入 `aria-invalid`+`aria-describedby`,紅框由 Input/Textarea/Select 的 `aria-invalid:border-destructive` 樣式觸發(globals.css 補 `@custom-variant aria-invalid`,**非 Tailwind 內建 variant**),錯誤訊息 role=alert 顯示於欄位下方。(4)後台商品表單 `noValidate` 停用瀏覽器預設驗證;`parseProductForm` 改回傳 `fieldErrors`(specs.* 收斂至 specs 鍵),前端送出前以同一 Zod schema 驗證、聚焦第一個錯誤欄位,server action 驗證失敗同步回傳 fieldErrors 走相同顯示路徑;`/quote` 聯絡表單改用 FormField 取得一致紅框;ui-design skill 規則 5-7 同步更新。**待本機 `pnpm typecheck && pnpm lint && pnpm build` 驗證**(沙盒磁碟滿,bash 無法啟動)。 |
| 2026-06-10 | 公司資訊更新   | 品牌與公司資料改為正式資訊(來源:業主提供 + FB 粉專 SanChun1986):`site.ts` name/shortName/fullName/logoAlt 改「山強電訊資材(有限公司)」,header logo 文字、footer 品牌、admin 標題、SEO title 經 siteConfig 自動套用;電話 04-22927373、地址 40616 台中市北屯區安順北一街72號;新增 `links.facebook`,footer 與關於頁聯絡卡加上 FB 連結。統編、傳真、Email 仍為 TODO 佔位待業主提供。內部識別(console `[SC1986]`、localStorage `sc1986_*`、CSV 檔名)維持不動。**待本機 `pnpm typecheck && pnpm lint && pnpm build` 驗證**(沙盒磁碟滿)。 |
| 2026-06-10 | 測試站提醒     | 前台加兩處測試期提醒(文案集中 `site.ts notice.testing`,皆標註正式上線時移除):(1)`TestModeBanner` 置於 (site)/layout 最上方(destructive 色提示列);(2)`TestModeNotice` 首次進站 popup(client,Esc/背景點擊/按鈕可關閉,關閉寫入 localStorage `sc1986_test_notice_dismissed`,key 集中 `storage.ts`;localStorage 不可用時仍顯示)。僅前台,不含 /admin。**待本機 `pnpm typecheck && pnpm lint && pnpm build` 驗證**(沙盒磁碟滿)。 |
| 2026-06-10 | 即時重新驗證   | 已顯示錯誤的欄位在輸入時即時重新驗證(`<form onChange>` 事件委派重跑共用 Zod schema):修正即移除紅框與提示、仍未通過則更新訊息、輸入途中不新增新錯誤;合併規則抽成 `pruneFieldErrors`(`ui/form-field.tsx`)。商品表單:伺服器 fieldErrors 改經 useEffect 同步進本地 state(因此也可被即時清除);規格列為 controlled+hidden specs_json,change 當下值未更新,規格錯誤改於 specsJson effect 重驗。`/quote` 表單同步套用(payload 組裝與 Zod 錯誤拆解抽成 `buildPayload`/`extractQuoteErrors`;`FieldErrors` 改 type alias 以取得隱含 index signature)。ui-design skill 規則 7 同步更新。**待本機 `pnpm typecheck && pnpm lint && pnpm build` 驗證**(沙盒磁碟滿)。 |
