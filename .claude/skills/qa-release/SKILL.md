---
name: qa-release
description: SC1986 完工驗證與發布前檢查技能。每個 Stage 收尾、宣告任務完成、或準備部署前必跑。涵蓋自動化關卡、高風險流程人工清單與 PLAN.md 更新規則。
---

# SC1986 QA 與發布技能

## 自動化關卡(全綠才算完成)

```bash
pnpm typecheck
pnpm lint
pnpm build
```

build 不需要連 Supabase(所有 DB 頁面 force-dynamic);若 build 要求環境變數即是退步,需修復。

## 高風險流程人工清單

依本次變更觸及範圍勾選:

### 權限
- [ ] 匿名開 `/admin`、`/admin/products`、`/admin/quotes` → 導向登入
- [ ] 非 admin_users 帳號登入 → 被拒並登出
- [ ] 直接 POST 管理 server action(無 session)→ 拒絕

### 詢價交易
- [ ] 正常送出 → 回 reference_code,DB 主檔+品項數一致
- [ ] 含一筆 draft/不存在商品 → 整筆失敗、無孤兒資料
- [ ] 51 筆品項 / 超大 payload / honeypot 有值 / 1 分鐘第 6 次 → 全被擋
- [ ] 寄信失敗時 `notification_status='failed'` 且 error 有記錄

### 商品可見性
- [ ] draft/archived 不出現在首頁、目錄、搜尋、sitemap、相關商品
- [ ] `quote_only` 有 price 值仍只顯示「$詢價」

### CSV 匯入
- [ ] 成功列全部 `draft`
- [ ] 錯誤列(缺 SKU、重複 SKU、非法 enum、負價格)被記錄且可下載
- [ ] 單列錯誤不中止整批

### UI
- [ ] light/dark/system 切換無破版、無不可讀文字
- [ ] 375px 行動版:選單抽屜、篩選面板、報價車可操作

## 收尾動作(必做)

1. 更新 `PLAN.md`:勾選完成項、更新階段狀態表、Progress Log 加一行(日期/階段/重點)。
2. 文件同步:本次若改了 schema/路由/環境變數/範圍,對應更新 `docs/02`、`docs/04`、`.env.example`。
3. 向業主回報:完成了什麼、怎麼驗證的、已知限制與下一步。
