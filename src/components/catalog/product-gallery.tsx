"use client";

import * as React from "react";
import Image from "next/image";
import { assets } from "@/config/storage";
import type { ProductImageRow } from "@/types";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: ProductImageRow[]; name: string }) {
  const [index, setIndex] = React.useState(0);
  const current = images[index];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
        <Image
          src={current?.public_url || assets.productPlaceholder}
          alt={current?.alt || name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-contain p-4"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`查看第 ${i + 1} 張圖片`}
              aria-current={i === index}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === index ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50",
              )}
            >
              <Image
                src={img.public_url || assets.productPlaceholder}
                alt={img.alt || `${name} 圖 ${i + 1}`}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
