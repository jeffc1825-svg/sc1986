---
name: ui-design
description: SC1986 前台與後台 UI 開發規範。新增或修改任何頁面、元件、樣式、主題前必讀。涵蓋設計 token、商品卡規格、light/dark 規則與文案語氣。
---

# SC1986 UI 設計技能

完整設計系統見 `docs/03-design-system.md`,本技能是動手寫 UI 時的操作規則。

## 硬規則

1. 顏色只用語意 token:`bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border`、`bg-primary`、`text-primary-foreground`、`bg-muted`、`ring-ring`。需要狀態色時成對寫:`text-green-700 dark:text-green-400`。
2. 禁止:硬編 hex、只調 light 不看 dark、用 `bg-white`/`bg-black` 表達語意背景(商品圖白底容器 `bg-white` 是唯一例外,因為產品照需要白底)。
3. 元件先找 `src/components/ui/` 既有的(button/input/select/badge/card/table/skeleton/pagination...),不重複造輪子;缺的元件補進 ui/ 而不是寫在頁面裡。
4. 路由與 storage key 一律 import 自 `src/config/`,JSX 內不得出現字串 `/products`、`/admin`、`sc1986_` 等硬編。
5. 互動元件必有 `hover:`、`focus-visible:ring-2 ring-ring`、`disabled:opacity-50` 三態。
6. 表單欄位:`<Label>` + 必填 `<span className="text-destructive">*</span>` + 錯誤訊息 `text-xs text-destructive`。
7. Client component 最小化:只有需要 state/事件的葉子元件標 `'use client'`,頁面骨架保持 Server Component。

## 版型速查

- 容器:`mx-auto max-w-7xl px-4`;後台內容 `max-w-6xl`。
- Header 順序:Logo → 搜尋框(flex-1, max-w-xl)→ 報價車按鈕(badge 數量)→ 主題切換。sticky top-0 z-40。
- 商品卡:白底圖容器(`aspect-square bg-white object-contain p-2`)+ 庫存 badge 左上 → mono SKU → 兩行截斷品名(`line-clamp-2`)→ 價格列 → 加入報價車鈕。
- 價格顯示一律走 `<PriceDisplay>` 元件,依 `price_mode` 分流:public_price=`NT$ 1,234`粗體 / quote_only=`$詢價` primary / login_or_quote=`報價後提供` muted。**禁止在頁面自行判斷 price 欄位。**
- 庫存 badge 走 `<StockBadge>`:in_stock 綠「現貨」、preorder 琥珀「可預訂」、quote_required 藍「需確認交期」、discontinued 灰「停產品」。
- 列表 grid:`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4`。
- 後台狀態 badge 色:draft 灰 / active 綠 / archived 琥珀;quote:new 紅 / reviewing 藍 / quoted 紫 / closed 綠 / cancelled 灰。

## 文案語氣

繁中台灣用語、B2B 簡潔不促銷:「加入報價車」「送出詢價」「含稅參考價」「停產品,可洽詢替代料」。金額格式 `NT$ 1,234`(千分位、無小數,有小數才顯示)。日期 `YYYY-MM-DD HH:mm`。

## 完成前自檢

- [ ] light 與 dark 都目視過(含 hover/focus/empty/error 狀態)
- [ ] 行動版 375px 與桌面 1280px 不破版
- [ ] 圖片有 alt、無圖走 placeholder
- [ ] 無硬編路由/色票/storage key
