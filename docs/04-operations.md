# 04 部署、營運與驗收

## 服務開通順序

### 1. Supabase(全程免開 SQL Editor)
1. 建立專案(區域選 Tokyo/Singapore),記下 URL、anon/service_role key 與資料庫密碼。
2. `.env.local` 填入四個值(含 `SUPABASE_DB_URL`,用 Connect → Session pooler 連線字串)。
3. `pnpm db:apply` 自動套用 `supabase/migrations/*.sql`(`_migrations` 表追蹤、可重跑)並建立 Storage bucket `product-images`。
4. `pnpm admin:create -- --email <信箱> --password <強密碼> --name <名稱>` 建立管理者(Auth 使用者 + `admin_users`)。
5. 開發環境才執行 `pnpm db:apply:seed`(78 筆測試商品);**正式環境禁止灌 seed**。

### 2. Vercel
1. Import Git repo,Framework 自動偵測 Next.js,套件管理 pnpm。
2. 設定環境變數(見 `.env.example`;Production/Preview 分開填,金鑰不同)。
3. 部署後驗證 `/`、`/products`、`/admin/login`。

### 3. Cloudflare
DNS 指向 Vercel(CNAME `cname.vercel-dns.com`)、SSL Full、開啟基礎 WAF/Bot Fight Mode。

### 4. Resend
1. 建立 Resend 帳號,建議使用公司持有的帳號並開啟 2FA。
2. 加入公司自有網域或寄件子網域(例如 `mail.example.com`),把 Resend 提供的 SPF/DKIM DNS 紀錄加到 Cloudflare,等待狀態成為 Verified。
3. 建立僅供 SC1986 使用的 API key。
4. Vercel 填入 `RESEND_API_KEY`、`QUOTE_NOTIFICATION_FROM`(例如 `山強詢價 <quote@mail.example.com>`)與 `QUOTE_NOTIFICATION_EMAIL`(業務收件信箱)。
5. `QUOTE_NOTIFICATION_FROM` 必須使用已驗證網域;一般 Gmail 地址不可直接當作正式寄件網域。

### 5. Cloudflare Turnstile(報價車人機驗證)
1. Cloudflare Dashboard → Turnstile → Add widget,模式選 **Managed**(平常隱形,可疑流量才顯示互動驗證)。
2. Hostnames 填正式網域與 `*.vercel.app`(供 Preview 測試);本機開發可留空金鑰,會直接略過驗證。
3. Vercel 填入 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`(公開)與 `TURNSTILE_SECRET_KEY`(僅伺服器)。正式環境缺 secret 會 fail-closed,`/api/quote` 直接報錯。

### 6. Google Analytics 4
- 評估 ID `G-2QE7JNSK8Q` 集中於 `src/config/site.ts`(`analytics.ga4Id`),只在前台、production build 載入;後台 `/admin` 不追蹤。
- GA4 後台 → 資料串流 → 加強型評估:**關閉「依瀏覽器歷程記錄變更網頁瀏覽」**(page_view 由程式碼於路由變化送出,避免重複計數)。
- 詢價成功送 `generate_lead` 事件(參數 `reference_code`、`item_count`),建議在 GA4 標記為關鍵事件(轉換)。

## 金鑰與敏感資料

- 禁止提交:`.env.local`、service_role key、資料庫密碼、各平台 token、客戶個資。
- 正式與測試環境使用不同金鑰;主要服務以公司信箱持有並開啟 2FA。
- service_role key 只存在於 Vercel server env,絕不放 `NEXT_PUBLIC_*`。

## 備份與監控

- Supabase 每日自動備份(Pro);上線前手動匯出一次 schema+data 存檔。
- Vercel deployment 通知;Supabase Database 用量告警。
- 詢價通知失敗會記錄在 `quote_requests.notification_status='failed'`,後台儀表板可見,需人工補寄。

## 內容與授權

- 商品圖片與文案:只用自有、供應商授權或原廠正式資料,保留來源依據。
- AI 可整理公開規格事實,不可改寫競品整段文案;發布前人工確認型號、數值、單位、安全資訊。
- 草稿商品不得出現在前台、sitemap、公開 API。

## 上線驗收清單

- [ ] 匿名瀏覽:首頁/目錄/詳情正常,看不到 draft/archived 商品
- [ ] 搜尋、分類(含子分類)、篩選、分頁皆伺服器端生效
- [ ] `quote_only` 商品不顯示任何數字價格
- [ ] 詢價端對端:加入報價車 → 送出 → 取得案件編號 → DB 主檔+品項一致 → 通知信送達且 `notification_status='sent'`
- [ ] 詢價防護:超量品項、honeypot、連續送出被擋;Turnstile 無 token / 假 token 回 422,正常送出通過
- [ ] GA4 即時報表可見前台 page_view 與詢價 `generate_lead`;`/admin` 無追蹤
- [ ] 匿名直開 `/admin`、`/admin/products` → 被導向登入;非管理者登入 → 拒絕
- [ ] 商品 CRUD、圖片上傳/刪除(Storage 同步)、批量操作正常
- [ ] CSV 匯入:成功列皆 draft、錯誤列可下載、單列錯誤不中止
- [ ] CSV 匯出可開啟且欄位完整
- [ ] light/dark/system 三模式無破版;手機/桌面 RWD 正常
- [ ] sitemap 只含 active 商品;robots 擋 `/admin`、`/api`
- [ ] 移除環境變數後正式 build 直接報錯(fail-closed),無示範資料
