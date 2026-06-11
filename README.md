# SC1986 — 詢價型工業電子材料商城

RFQ 詢價優先的工業電子材料型錄網站。客戶免登入瀏覽商品、加入報價車、送出詢價;業務於後台管理商品與詢價案件。

技術:Next.js 16(App Router)・React 19・TypeScript・Tailwind CSS v4・Supabase(Postgres/Auth/Storage/RLS)・pnpm・Vercel + Cloudflare・Resend。

## 快速啟動

```bash
pnpm install
cp .env.example .env.local   # 填入 Supabase URL / keys / SUPABASE_DB_URL
pnpm db:apply:seed           # 自動建立資料庫 + 測試資料(78 筆商品),免開瀏覽器
pnpm admin:create -- --email you@example.com --password 'StrongPass123!' --name '管理者'
pnpm dev                     # http://localhost:3000;後台 /admin/login
```

Supabase 初始化全程不需進 Dashboard 貼 SQL:

1. `SUPABASE_DB_URL` 填資料庫連線字串(Dashboard → Connect → Session pooler;anon/service key 無法建表)
2. `pnpm db:apply` 套用 `supabase/migrations/*.sql`(以 `_migrations` 表追蹤,重跑自動跳過)
3. `pnpm db:apply:seed` 同時灌入開發測試資料;**正式環境只跑 `pnpm db:apply`,禁止灌 seed**
4. `pnpm admin:create` 以 service key 建立 Auth 使用者並寫入 `admin_users`

## 常用指令

```bash
pnpm dev / build / start
pnpm typecheck     # tsc --noEmit
pnpm lint
pnpm db:apply      # 套用 migrations(冪等)
pnpm db:apply:seed # migrations + 測試資料(products 已有資料會跳過;--force-seed 重灌)
pnpm admin:create  # 建立管理者(--email/--password/--name/--role)
```

## 文件

- `PLAN.md` — 階段計畫與進度(唯一真相來源)
- `CLAUDE.md` — AI 協作工作指引
- `docs/01-business.md` 業務需求 / `02-architecture.md` 技術架構 / `03-design-system.md` 設計系統 / `04-operations.md` 部署營運
- `.claude/skills/` — ui-design・database・qa-release 工作技能
