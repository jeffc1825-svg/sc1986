import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額顯示:NT$ 1,234(無小數時不顯示小數) */
export function formatPrice(value: number): string {
  const hasDecimal = !Number.isInteger(value);
  return `NT$ ${value.toLocaleString("zh-TW", {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** 日期時間:YYYY-MM-DD HH:mm(台北時區) */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/** 日期:YYYY-MM-DD */
export function formatDate(iso: string): string {
  return formatDateTime(iso).slice(0, 10);
}

/** 由商品名稱產生 slug(中文保留,空白轉連字號) */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s/\\_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
