import type { CategoryNode, CategoryOption, CategoryRow } from "@/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * 分類快取:自製記憶體 TTL 快取(每個 server instance 一份)。
 *
 * 不用 `unstable_cache`:其 fetch 攔截管線在 Node 20.16+/22 會觸發
 * `controller[kState].transformAlgorithm is not a function`(webstreams 內部重構,
 * 見 vercel/next.js#68319 / #75995),Supabase 查詢走 fetch stream 正中此 bug。
 * 記憶體快取無此問題、無框架耦合;搭配 /api/categories 的 CDN 快取已足夠。
 */
const CATEGORIES_TTL_MS = 5 * 60 * 1000;

let categoriesCache: { rows: CategoryRow[]; expiresAt: number } | null = null;
let categoriesInflight: Promise<CategoryRow[]> | null = null;

async function fetchCategoryRowsUncached(): Promise<CategoryRow[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`讀取分類失敗:${error.message}`);
  return (data ?? []) as CategoryRow[];
}

/**
 * 全量分類(記憶體快取 5 分鐘,同時間併發請求共用同一個 in-flight Promise)。
 * 分類是小表(數百筆內),策略為全量讀取 + 記憶體組樹,不做逐層查詢。
 * 失敗不快取(fail-closed,下次請求重試)。
 */
export async function fetchAllCategories(): Promise<CategoryRow[]> {
  if (categoriesCache && categoriesCache.expiresAt > Date.now()) {
    return categoriesCache.rows;
  }
  if (categoriesInflight) return categoriesInflight;
  categoriesInflight = fetchCategoryRowsUncached()
    .then((rows) => {
      categoriesCache = { rows, expiresAt: Date.now() + CATEGORIES_TTL_MS };
      return rows;
    })
    .finally(() => {
      categoriesInflight = null;
    });
  return categoriesInflight;
}

/** 後台異動分類後呼叫,讓本 instance 立即失效(其他 instance 等 TTL 到期) */
export function invalidateCategoriesCache(): void {
  categoriesCache = null;
}

/** 把扁平分類組成樹(rows 已依 sort_order、name 排序,組樹後順序不變) */
export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/** 取得某分類(slug)與其所有子孫的 id;找不到回傳 null */
export function categoryDescendantIds(rows: CategoryRow[], slug: string): string[] | null {
  const target = rows.find((r) => r.slug === slug);
  if (!target) return null;
  const childrenOf = new Map<string | null, CategoryRow[]>();
  rows.forEach((r) => {
    const list = childrenOf.get(r.parent_id) ?? [];
    list.push(r);
    childrenOf.set(r.parent_id, list);
  });
  const ids: string[] = [];
  const stack = [target];
  while (stack.length) {
    const cur = stack.pop()!;
    ids.push(cur.id);
    (childrenOf.get(cur.id) ?? []).forEach((c) => stack.push(c));
  }
  return ids;
}

/** 由頂層到目標分類的完整路徑(含自身),麵包屑用;找不到回傳 null */
export function categoryPathById(rows: CategoryRow[], id: string): CategoryRow[] | null {
  const byId = new Map(rows.map((r) => [r.id, r]));
  let cur = byId.get(id);
  if (!cur) return null;
  const path: CategoryRow[] = [];
  const visited = new Set<string>();
  while (cur) {
    if (visited.has(cur.id)) break; // 防資料異常造成的循環
    visited.add(cur.id);
    path.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return path;
}

/** 同上,以 slug 查 */
export function categoryPathBySlug(rows: CategoryRow[], slug: string): CategoryRow[] | null {
  const target = rows.find((r) => r.slug === slug);
  return target ? categoryPathById(rows, target.id) : null;
}

/** DFS 攤平分類樹並附深度(後台下拉選單、CSV 對照表用) */
export function flattenCategoryTree(tree: CategoryNode[]): CategoryOption[] {
  const out: CategoryOption[] = [];
  const walk = (nodes: CategoryNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ id: n.id, name: n.name, slug: n.slug, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(tree, 0);
  return out;
}

/** 在樹中找節點(slug),回傳節點與其祖先 id 集合(側欄展開判斷用) */
export function findNodeBySlug(
  tree: CategoryNode[],
  slug: string,
): { node: CategoryNode; ancestorIds: Set<string> } | null {
  const walk = (
    nodes: CategoryNode[],
    ancestors: string[],
  ): { node: CategoryNode; ancestorIds: Set<string> } | null => {
    for (const n of nodes) {
      if (n.slug === slug) return { node: n, ancestorIds: new Set(ancestors) };
      const found = walk(n.children, [...ancestors, n.id]);
      if (found) return found;
    }
    return null;
  };
  return walk(tree, []);
}
