# SC1986 — 詢價型工業電子材料商城

RFQ 詢價優先的工業電子材料型錄網站。客戶免登入瀏覽商品、加入報價車、送出詢價;業務於後台管理商品與詢價案件。經營模式對標廣華電子商城。

技術:Next.js 15(App Router)・React 19・TypeScript・Tailwind CSS v4・Supabase(Postgres/Auth/Storage/RLS)・pnpm・Vercel + Cloudflare・Resend。

## 快速啟動

```bash
pnpm install
cp .env.example .env.local   # 填入 Supabase 專案的 URL 與 keys
pnpm dev                     # http://localhost:3000
```

Supabase 初始化(新專案):

1. 在 Supabase SQL Editor 依序執行 `supabase/migrations/*.sql`
2. 開發環境可再執行 `supabase/seed.sql` 取得示範分類/品牌/商品
3. Authentication 建立管理者帳號後:
   `insert into admin_users (auth_user_id, name, role, is_active) values ('<auth-uuid>', '管理者', 'owner', true);`
4. 後台入口:`/admin/login`

## 常用指令

```bash
pnpm dev / build / start
pnpm typecheck   # tsc --noEmit
pnpm lint
```

## 文件

- `PLAN.md` — 階段計畫與進度(唯一真相來源)
- `CLAUDE.md` — AI 協作工作指引
- `docs/01-business.md` 業務需求 / `02-architecture.md` 技術架構 / `03-design-system.md` 設計系統 / `04-operations.md` 部署營運
- `.claude/skills/` — ui-design・database・qa-release 工作技能
