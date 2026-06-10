/**
 * 站台資訊集中設定 — 公司資料、聯絡方式、導覽、SEO 預設。
 * 全站文案中的公司資訊一律 import 自此檔,不得散落硬編。
 */
export const siteConfig = {
  name: "山強電訊資材",
  shortName: "山強電訊資材",
  description:
    "山強電訊資材有限公司 — 電子零件、線材連接器、電源控制、感測自動化、工具耗材專業供應。線上整理需求、快速詢價,業務專人報價。",
  keywords: [
    "山強電訊資材",
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
    fullName: "山強電訊資材有限公司",
    taxId: "22224638",
    phone: "04-22927373",
    fax: "04-22920758",
    email: "sc22927373@gmail.com",
    address: "40616 台中市北屯區安順北一街72號",
    hours: ["週一 ~ 週五 08:30 ~ 18:00", "星期例假日全休"],
  },
  links: {
    facebook: "https://www.facebook.com/SanChun1986/",
  },
  notice: {
    pricing: "標示價格均為含稅參考價 TWD,正式價格以業務報價為準",
    topBar: "線上詢價免登入,業務將於 1 個工作天內回覆",
  },
  brand: {
    logo: "/brand/logo.png",
    logoAlt: "山強電訊資材商標",
  },
} as const;

export type SiteConfig = typeof siteConfig;
