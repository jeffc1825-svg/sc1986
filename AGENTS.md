# AGENTS.md — SC1986 工作指引

SC1986 是「RFQ 詢價型工業電子材料商城」。大量 SKU 型錄 + 部分公開價 + 部分詢價,第一階段交易終點是「建立可追蹤的詢價案件」,不是線上付款。

## 開工流程

1. 先讀 `PLAN.md`,確認目前階段與未完成項目。
2. 需要業務脈絡 → `docs/01-business.md`;技術細節 → `docs/02-architecture.md`。
3. 動 UI 前先讀 skill `.Codex/skills/ui-design/`;動資料庫前先讀 `.Codex/skills/database/`;收尾驗證用 `.Codex/skills/qa-release/`。
4. 完成後更新 `PLAN.md` 的勾選與進度紀錄(Progress Log)。
5. 每次完成工作回報時,提供可直接用於 git commit 的 title 與 description。

## 技術棧(已核准,勿擅自更換)

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS v4(CSS-first,`src/app/globals.css` 內 `@theme`)
- 自製 shadcn 風格元件於 `src/components/ui/`(無 Radix 依賴)
- Supabase:PostgreSQL / Auth / Storage / RLS
- Zod 驗證、pnpm(只維護 `pnpm-lock.yaml`)
- 部署:Vercel + Cloudflare DNS;郵件:Resend

## 不可違反的產品規則

- 第一階段 RFQ 優先:不做付款、正式訂單、物流、發票。
- 訪客免登入可送詢價;`/admin` 全部功能必須登入且通過 `admin_users` 檢查。
- CSV 匯入、AI 產生或外部整理的商品,一律先建立為 `draft`,人工審核後才能 `active`。
- 公開價格顯示只依 `price_mode` 判斷,絕不能只看 `price` 是否為 null。
- 不複製競品的商品文案與圖片;只能參考其版面與經營模式。

## 不可違反的工程規則

- 路由集中於 `src/config/routes.ts`;storage key / bucket / 資產路徑集中於 `src/config/storage.ts`;站台資訊集中於 `src/config/site.ts`。頁面與元件內不得硬編 `/admin`、`/products`、`/quote`、`/api/*`、localStorage key、bucket 名稱。
- 詢價主檔與品項必須經 PostgreSQL RPC `create_quote_request` 原子寫入;伺服器重查 product id,不信任瀏覽器傳入的 SKU/品名。
- `/api/quote` 必備:Zod、payload 與品項數上限、rate limit、honeypot。
- 正式環境 fail-closed:缺環境變數或資料庫錯誤就顯示錯誤,不得退回示範資料。
- `SUPABASE_SERVICE_ROLE_KEY` 只能在伺服器端使用;管理端 mutation 一律先過 `requireAdmin()` 再執行。
- 所有 UI 同時支援 light / dark mode,只用語意 token(`bg-background`、`text-foreground`、`text-muted-foreground`、`border-border`...),不硬編色票。
- 商品列表的搜尋、篩選、分頁一律在伺服器端(Supabase 查詢)完成。
- 不提交 `.env*`(`.env.example` 除外)、金鑰、客戶個資。

## 驗證關卡(宣告完成前必須通過)

```bash
pnpm typecheck && pnpm lint && pnpm build
```

高風險變更(權限、詢價交易、草稿發布、匯入)另需依 `.Codex/skills/qa-release/` 的清單人工驗證主要流程。

## 文件地圖

| 檔案                       | 內容                                           |
| -------------------------- | ---------------------------------------------- |
| `PLAN.md`                  | 階段拆分、勾選清單、進度紀錄(唯一進度真相來源) |
| `docs/01-business.md`      | 業務定位、使用者、流程、範圍邊界               |
| `docs/02-architecture.md`  | 架構、資料模型、RLS、API、環境變數             |
| `docs/03-design-system.md` | 品牌、design token、版型模板                   |
| `docs/04-operations.md`    | 部署、備份、驗收清單                           |
| `.Codex/skills/*`         | ui-design / database / qa-release 三個工作技能 |

架構、資料模型、外部服務或產品範圍改變時,必須同步更新上述文件。

## Imported Claude Cowork project instructions
