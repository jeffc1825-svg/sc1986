"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  ClipboardList,
  Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SlideIcon = "quote" | "processing" | "catalog";

export type HomeCarouselSlide = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: SlideIcon;
};

const slideIcons = {
  quote: ClipboardList,
  processing: Factory,
  catalog: CircuitBoard,
} satisfies Record<SlideIcon, React.ComponentType<{ className?: string }>>;

export function HomeCarousel({
  slides,
  logo,
  logoAlt,
}: {
  slides: HomeCarouselSlide[];
  logo: string;
  logoAlt: string;
}) {
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (
      paused ||
      slides.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const show = (index: number) => {
    setActive(index);
  };

  const previous = () => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="重要資訊"
      className="relative overflow-hidden border-b border-border bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative min-h-[390px] sm:min-h-[360px]">
        {slides.map((slide, index) => {
          const Icon = slideIcons[slide.icon];
          const isActive = index === active;

          return (
            <div
              key={slide.title}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none",
                isActive ? "z-10 opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <div className="mx-auto grid min-h-[390px] max-w-7xl items-center gap-8 px-4 py-12 sm:min-h-[360px] sm:grid-cols-[minmax(0,1fr)_18rem] sm:py-14 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Icon className="size-4" aria-hidden />
                    <span>{slide.eyebrow}</span>
                  </div>
                  <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {slide.title}
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {slide.description}
                  </p>
                  <Link
                    href={slide.href}
                    tabIndex={isActive ? 0 : -1}
                    className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {slide.actionLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>

                <div className="hidden items-center justify-center sm:flex">
                  <div className="flex aspect-square w-full max-w-80 items-center justify-center rounded-lg border border-border bg-background p-10">
                    <Image
                      src={logo}
                      alt={logoAlt}
                      width={240}
                      height={240}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="上一則重要資訊"
            title="上一則"
            className="absolute left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="下一則重要資訊"
            title="下一則"
            className="absolute right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => show(index)}
                aria-label={`顯示第 ${index + 1} 則：${slide.eyebrow}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "h-2.5 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  index === active
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/70",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
