"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import {
  ProductDetailLoadingSkeleton,
  ProductsListLoadingSkeleton,
} from "@/components/catalog/product-loading-skeletons";

export default function ProductsLoading() {
  const pathname = usePathname() ?? routes.products;
  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const isDetailPath = normalizedPath.startsWith(`${routes.products}/`);

  return isDetailPath ? <ProductDetailLoadingSkeleton /> : <ProductsListLoadingSkeleton />;
}
