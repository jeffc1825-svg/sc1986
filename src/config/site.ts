/**
 * 站台資訊集中設定 — 公司資料、聯絡方式、導覽、SEO 預設。
 * 全站文案中的公司資訊一律 import 自此檔,不得散落硬編。
 */
export const siteConfig = {
  name: "SC1986 工業電子材料",
  shortName: "SC1986",
  description:
    "SC1986 工業電子材料商城 — 電子零件、線材連接器、電源控制、感測自動化、工具耗材專業供應。線上整理需求、快速詢價,業務專人報價。",
  keywords: [
    "電子零件",
    "工業電子材料",
    "連接器",
    "端子",
    "電源供應器",
    "感測器",
    "自動控制",
    "焊接工具",
    "詢價",
  ],
  company: {
    fullName: "SC1986 工業電子材料有限公司",
    taxId: "00000000", // TODO: 上線前填入正式統編
    phone: "04-0000-0000",
    fax: "04-0000-0001",
    email: "sales@sc1986.example.com", // TODO: 上線前更換正式信箱
    address: "臺中市西屯區範例路 19 號 8 6", // TODO: 上線前填入正式地址
    hours: ["週一 ~ 週五 08:30 ~ 18:00", "週六 08:30 ~ 12:00", "星期例假日全休"],
  },
  notice: {
    pricing: "標示價格均為含稅參考價 TWD,正式價格以業務報價為準",
    topBar: "線上詢價免登入,業務將於 1 個工作天內回覆",
  },
  brand: {
    logo: "/brand/logo.png",
    logoAlt: "SC1986 商標",
  },
} as const;

export type SiteConfig = typeof siteConfig;
