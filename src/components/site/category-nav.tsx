"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutGrid, Menu, X } from "lucide-react";
import { routes, productsUrl } from "@/config/routes";
import type { CategoryNode } from "@/types";
import { cn } from "@/lib/utils";

/**
 * 分類導覽列:桌面下拉「產品目錄」+ 行動版抽屜(廣華式)。
 * 分類樹改由 GET /api/categories 非同步取得(CDN + Data Cache 雙層快取),
 * 新增分類後選單自動更新,無須重新部署;載入完成前僅顯示固定連結。
 */
export function CategoryNav() {
  const [tree, setTree] = React.useState<CategoryNode[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 掛載後非同步載入分類樹;失敗時保留 null(僅顯示固定連結,不擋瀏覽)
  React.useEffect(() => {
    let cancelled = false;
    fetch(routes.api.categories)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { categories: CategoryNode[] }) => {
        if (!cancelled && Array.isArray(data.categories)) setTree(data.categories);
      })
      .catch(() => {
        /* 分類選單載入失敗不阻斷頁面,目錄頁側欄仍可瀏覽分類 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 路由變化時關閉選單
  React.useEffect(() => {
    setOpen(false);
    setDrawer(false);
  }, [pathname, searchParams]);

  return (
    <nav aria-label="商品分類" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
        {/* 桌面:產品目錄下拉(顯示前兩層,深層分類於目錄頁側欄瀏覽) */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex h-11 items-center gap-1.5 px-3 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            產品目錄
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open ? (
            <>
              <div className="fixed inset-0 z-30" aria-hidden onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-40 grid w-[640px] grid-cols-2 gap-x-6 gap-y-4 rounded-b-lg border border-border bg-card p-5 shadow-lg lg:w-[760px]">
                {(tree ?? []).map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={productsUrl({ category: cat.slug })}
                      className="text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={productsUrl({ category: child.slug })}
                            className="inline-flex items-center text-xs text-muted-foreground hover:text-primary"
                          >
                            {child.name}
                            {child.children.length > 0 ? (
                              <ChevronRight className="size-3 opacity-60" aria-hidden />
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {tree === null ? (
                  <p className="col-span-2 py-2 text-sm text-muted-foreground">分類載入中…</p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        {/* 行動版:抽屜按鈕 */}
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="inline-flex h-11 items-center gap-1.5 px-1 text-sm font-medium text-foreground md:hidden"
          aria-label="開啟分類選單"
        >
          <Menu className="size-4 text-primary" aria-hidden />
          產品目錄
        </button>

        {/* 頂層快速連結 */}
        <div className="ml-1 flex items-center gap-1 overflow-x-auto">
          <NavLink href={routes.products}>全部商品</NavLink>
          {(tree ?? []).slice(0, 5).map((cat) => (
            <NavLink key={cat.id} href={productsUrl({ category: cat.slug })} className="hidden lg:inline-flex">
              {cat.name}
            </NavLink>
          ))}
          <NavLink href={routes.about}>關於我們</NavLink>
        </div>
      </div>

      {/* 行動版抽屜:遞迴手風琴,支援至深層分類 */}
      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">產品目錄</span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="關閉選單"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Link
                href={routes.products}
                className="block rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                全部商品
              </Link>
              {tree === null ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">分類載入中…</p>
              ) : (
                <DrawerTree nodes={tree} depth={0} />
              )}
              <Link
                href={routes.about}
                className="mt-1 block rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                關於我們
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

/** 抽屜內的遞迴分類列表:有子分類的節點可展開/收合 */
function DrawerTree({ nodes, depth }: { nodes: CategoryNode[]; depth: number }) {
  return (
    <>
      {nodes.map((node) => (
        <DrawerNode key={node.id} node={node} depth={depth} />
      ))}
    </>
  );
}

function DrawerNode({ node, depth }: { node: CategoryNode; depth: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className={cn(depth === 0 && "mt-1")}>
      <div className="flex items-center">
        <Link
          href={productsUrl({ category: node.slug })}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          className={cn(
            "block flex-1 rounded-md py-2 pr-2 text-sm hover:bg-muted",
            depth === 0 ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {node.name}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? `收合 ${node.name}` : `展開 ${node.name}`}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} aria-hidden />
          </button>
        ) : null}
      </div>
      {hasChildren && expanded ? <DrawerTree nodes={node.children} depth={depth + 1} /> : null}
    </div>
  );
}

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 shrink-0 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
}
