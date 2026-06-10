"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { productsUrl } from "@/config/routes";
import type { CategoryNode } from "@/types";
import { cn } from "@/lib/utils";

interface CategorySidebarTreeProps {
  nodes: CategoryNode[];
  base: { q?: string; sort?: string };
  activeSlug?: string;
  /** 預設展開的節點 id(選取分類的祖先 + 自身),其餘由使用者點箭頭展開 */
  defaultExpandedIds: string[];
}

/**
 * 目錄側欄分類樹(client):
 * - 點分類名稱 → 導航至該分類
 * - 有子分類的節點顯示箭頭,點箭頭 → 就地展開/收合(不導航)
 * - 路由切換時重設手動展開狀態,回到「沿選取路徑展開」
 */
export function CategorySidebarTree({
  nodes,
  base,
  activeSlug,
  defaultExpandedIds,
}: CategorySidebarTreeProps) {
  const defaults = React.useMemo(
    () => new Set(defaultExpandedIds),
    [defaultExpandedIds],
  );
  const [overrides, setOverrides] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setOverrides({});
  }, [activeSlug]);

  const isExpanded = (id: string) => overrides[id] ?? defaults.has(id);
  const toggle = (id: string) =>
    setOverrides((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? defaults.has(id)),
    }));

  return (
    <TreeItems
      nodes={nodes}
      base={base}
      activeSlug={activeSlug}
      isExpanded={isExpanded}
      toggle={toggle}
    />
  );
}

function TreeItems({
  nodes,
  base,
  activeSlug,
  isExpanded,
  toggle,
}: {
  nodes: CategoryNode[];
  base: { q?: string; sort?: string };
  activeSlug?: string;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const isActive = activeSlug === node.slug;
        const hasChildren = node.children.length > 0;
        const expanded = hasChildren && isExpanded(node.id);
        return (
          <li key={node.id}>
            <div className="flex items-center gap-0.5">
              <Link
                href={productsUrl({ ...base, category: node.slug })}
                className={cn(
                  "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {node.name}
              </Link>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  aria-expanded={expanded}
                  aria-label={expanded ? `收合 ${node.name}` : `展開 ${node.name}`}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight
                    className={cn(
                      "size-3.5 transition-transform",
                      expanded && "rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
              ) : null}
            </div>
            {expanded ? (
              <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                <TreeItems
                  nodes={node.children}
                  base={base}
                  activeSlug={activeSlug}
                  isExpanded={isExpanded}
                  toggle={toggle}
                />
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
  );
}
