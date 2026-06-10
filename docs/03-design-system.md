# 03 設計系統 — 業務型工業材料商城模板

定位:資訊密度高、規格優先、信任感強的 B2B 業務型版面。版面骨架對標廣華電子商城,品牌色取自 SC1986 紅色三角 Logo。**只參考版型與資訊架構,不複製其文案、圖片、icon。**

## 品牌

- Logo:`public/brand/logo.png`(紅色三角 SC 標誌,深色模式下放於白色圓角底或直接使用,紅色在深底可讀)。
- 品牌紅 `#D7373F`(hsl 357 65% 53%)。hover 加深 `#B92B33`。
- 輔助:深炭 `zinc` 中性階、現貨綠、預訂琥珀、停產灰。

## 語意 Token(globals.css 定義,元件只准用 token)

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | 近白 `hsl(0 0% 98%)` | `hsl(240 6% 7%)` |
| `--card` | 白 | `hsl(240 5% 10%)` |
| `--foreground` | `hsl(240 6% 10%)` | `hsl(0 0% 95%)` |
| `--muted` / `--muted-foreground` | 淺灰 / 中灰 | 深灰 / 淺灰 |
| `--primary` / `--primary-foreground` | 品牌紅 / 白 | 品牌紅(亮 5%)/ 白 |
| `--secondary` | 淺灰底 | 深灰底 |
| `--accent` | 淺紅底(badge/hover) | 暗紅底 |
| `--destructive` | 紅 600 | 紅 500 |
| `--border` / `--input` / `--ring` | 灰 200 / 灰 300 / 品牌紅 | 灰 800 / 灰 700 / 品牌紅 |

成功/警示等狀態色用 Tailwind 原生 `green-*`、`amber-*`,但必須同時給 light/dark 兩套(`text-green-700 dark:text-green-400` 形式)。

## 字體與排版

- 系統字體棧:`ui-sans-serif, -apple-system, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif`(不經 next/font 下載,zh-TW 最穩)。
- 數字與 SKU:`tabular-nums`;SKU 用 `font-mono` 小字。
- 尺度:頁面標題 `text-2xl font-bold`、區塊標題 `text-lg/xl font-bold`、內文 `text-sm`、輔助 `text-xs text-muted-foreground`。
- 容器:`mx-auto max-w-7xl px-4`。

## 全站骨架(廣華式)

1. **頂部資訊列**(深色細條):服務時間、聯絡電話、「標示價格均為含稅參考價 TWD」。
2. **Header**(sticky):Logo、大型搜尋框(置中,placeholder「搜尋 SKU、品名、規格…」)、右側「報價車」按鈕含數量 badge、主題切換。
3. **分類導覽列**:桌面為「產品目錄」觸發的下拉/橫向頂層分類;行動版漢堡開抽屜樹。
4. **Footer**:四欄 — 品牌+統計數字(現貨品項/商品筆數)、產品服務連結、服務台連結、公司聯絡資訊(統編、電話、地址、營業時間),最下版權列。

## 頁面模板

### 首頁
品牌紅漸層 Hero(標語+搜尋導流+「瀏覽全部商品 / 直接詢價」雙 CTA)→ 分類捷徑卡(icon+名稱,8 格)→ 本月新品(商品卡 grid + more)→ 品牌牆(文字 chip 連到品牌篩選)→ 服務特色帶(詢價流程 3 步驟說明)。

### 商品卡(核心元件,所有列表共用)
```text
[圖 1:1, object-contain, bg-white 圓角]
[現貨 badge 疊左上(綠);停產=灰]
SKU(mono, muted, text-xs)
品名(text-sm, 2行截斷, hover 變 primary)
價格列:NT$1,234(粗體) | 「$詢價」(primary 粗體) | 「報價後提供」(muted)
[加入報價車] 小按鈕
```

### 目錄頁 `/products`
桌面:左 sidebar(w-64,分類樹可展開 + 篩選群)+ 右內容(結果數與排序列、4 欄商品卡 grid、分頁)。行動:sidebar 收成「篩選」按鈕展開面板。空結果:給清除篩選引導,不留白。

### 詳情頁 `/products/[slug]`
麵包屑(首頁/分類/品名)→ 左圖庫(主圖+縮圖列,client 切換)→ 右資訊(品名、SKU、品牌連結、庫存 badge、價格區、數量 stepper+加入報價車、訂購說明卡)→ 下方:規格表(striped table)、商品介紹(段落)、相關商品(同分類 4 筆,真實查詢)。

### 報價車 `/quote`
品項表(圖、SKU/名、數量 stepper、備註 input、刪除)→ 聯絡表單卡(姓名*、公司、Email*、電話、需求說明)→ 送出。空車狀態給「去逛商品」CTA。

### 後台
左側固定深色 sidebar(儀表板/商品/匯入/詢價/登出),內容區 `max-w-6xl`。表格密集、操作按鈕小尺寸、狀態用彩色 badge(draft 灰、active 綠、archived 黃;new 紅、reviewing 藍、quoted 紫、closed 綠、cancelled 灰)。

## 互動規範

- 所有互動元件有 hover、focus-visible ring(`ring-ring`)、disabled 樣式。
- 表單:label 必有、必填星號、欄位下錯誤訊息(紅字 text-xs)、送出中 disabled+spinner。
- 圖片一律含 alt;商品圖白底容器避免透明圖在 dark mode 消失。
- 每次 UI 變更必須同時目視 light 與 dark。

## 文案語氣

繁體中文、台灣用語、B2B 簡潔:「加入報價車」「送出詢價」「需確認交期」「停產品,可洽詢替代料」。價格一律標示「含稅參考價」。不用驚嘆號促銷腔。
