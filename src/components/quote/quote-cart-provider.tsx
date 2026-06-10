"use client";

import * as React from "react";
import { storageKeys, quoteCartLimits } from "@/config/storage";
import type { QuoteCartItem } from "@/types";

interface QuoteCartContextValue {
  items: QuoteCartItem[];
  /** hydration 完成前為 false,避免 SSR/CSR 不一致 */
  ready: boolean;
  count: number;
  addItem: (item: Omit<QuoteCartItem, "quantity" | "note">, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNote: (productId: string, note: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const QuoteCartContext = React.createContext<QuoteCartContextValue | null>(null);

function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(quoteCartLimits.maxQuantity, Math.max(1, Math.round(q)));
}

/** 驗證 localStorage 內容;損壞資料直接丟棄 */
function parseStored(raw: string | null): QuoteCartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: QuoteCartItem[] = [];
    for (const it of parsed) {
      if (
        typeof it === "object" &&
        it !== null &&
        typeof (it as QuoteCartItem).productId === "string" &&
        typeof (it as QuoteCartItem).sku === "string" &&
        typeof (it as QuoteCartItem).name === "string" &&
        typeof (it as QuoteCartItem).slug === "string" &&
        typeof (it as QuoteCartItem).quantity === "number"
      ) {
        items.push({
          productId: (it as QuoteCartItem).productId,
          sku: (it as QuoteCartItem).sku,
          name: (it as QuoteCartItem).name,
          slug: (it as QuoteCartItem).slug,
          quantity: clampQuantity((it as QuoteCartItem).quantity),
          note:
            typeof (it as QuoteCartItem).note === "string"
              ? (it as QuoteCartItem).note.slice(0, quoteCartLimits.maxNoteLength)
              : "",
        });
      }
      if (items.length >= quoteCartLimits.maxItems) break;
    }
    return items;
  } catch {
    return [];
  }
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<QuoteCartItem[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setItems(parseStored(window.localStorage.getItem(storageKeys.quoteCart)));
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKeys.quoteCart, JSON.stringify(items));
    } catch {
      // localStorage 不可用(隱私模式等)時仍允許當次操作
    }
  }, [items, ready]);

  const addItem = React.useCallback(
    (item: Omit<QuoteCartItem, "quantity" | "note">, quantity = 1): boolean => {
      let ok = true;
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: clampQuantity(i.quantity + quantity) }
              : i,
          );
        }
        if (prev.length >= quoteCartLimits.maxItems) {
          ok = false;
          return prev;
        }
        return [...prev, { ...item, quantity: clampQuantity(quantity), note: "" }];
      });
      return ok;
    },
    [],
  );

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(quantity) } : i)),
    );
  }, []);

  const updateNote = React.useCallback((productId: string, note: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, note: note.slice(0, quoteCartLimits.maxNoteLength) }
          : i,
      ),
    );
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const value = React.useMemo<QuoteCartContextValue>(
    () => ({
      items,
      ready,
      count: items.length,
      addItem,
      updateQuantity,
      updateNote,
      removeItem,
      clear,
    }),
    [items, ready, addItem, updateQuantity, updateNote, removeItem, clear],
  );

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>;
}

export function useQuoteCart(): QuoteCartContextValue {
  const ctx = React.useContext(QuoteCartContext);
  if (!ctx) throw new Error("useQuoteCart 必須在 QuoteCartProvider 內使用");
  return ctx;
}
