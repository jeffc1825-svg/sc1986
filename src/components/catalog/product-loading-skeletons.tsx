import { Skeleton } from "@/components/ui/skeleton";

export function ProductsListLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-5 h-8 w-44" />
      <div className="flex gap-6">
        <aside className="hidden w-60 shrink-0 space-y-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-4 h-11 w-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="mt-3 h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
                <Skeleton className="mt-3 h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="mt-3 flex gap-2 overflow-hidden pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-16 shrink-0 rounded-md" />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-8 w-full max-w-xl" />
          <Skeleton className="mt-2 h-8 w-3/4 max-w-lg" />

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="mt-3 h-3 w-52" />
            <Skeleton className="mt-2 h-3 w-full max-w-lg" />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-11 w-40" />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <Skeleton className="mb-3 h-6 w-28" />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[9rem_1fr] gap-3 border-b border-border px-3 py-3 last:border-b-0 sm:grid-cols-[12rem_1fr]"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <Skeleton className="mb-3 h-6 w-28" />
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      </section>

      <section className="mt-10">
        <Skeleton className="mb-3 h-6 w-28" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-3 h-3 w-16" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-2/3" />
              <Skeleton className="mt-3 h-8 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
