import type { CategoryNode, CategoryRow } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function fetchAllCategories(): Promise<CategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`讀取分類失敗:${error.message}`);
  return (data ?? []) as CategoryRow[];
}

/** 把扁平分類組成樹 */
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
