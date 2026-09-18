"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { heroSlides } from "@/data/site";
import { ArrowLeft, ArrowRight } from "lucide-react";

const AUTOPLAY_MS = 7000;

/**
 * One full-bleed banner, not a split layout. The whole panel is a link through
 * to a filtered product list; the arrows sit above it so they stay clickable.
 */
export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = heroSlides[index];

  const go = useCallback(
    (next: number) => setIndex((next + heroSlides.length) % heroSlides.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [index, paused, go]);

  return (
    <section
      className="relative isolate h-[84vh] min-h-[30rem] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* images cross-fade and settle out of a slow zoom */}
      {heroSlides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== index}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out-expo"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt=""
            fill
            // `priority` is deprecated in Next 16; the docs recommend eager
            // loading + fetchPriority when only one image is the LCP candidate.
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            sizes="100vw"
            className="object-cover saturate-[0.72] transition-transform duration-[7000ms] ease-out"
            style={{ transform: i === index ? "scale(1.06)" : "scale(1)" }}
          />
        </div>
      ))}

      {/* scrim keeps the type legible whatever the photograph does */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/65 to-accent-700/40" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />

      {/* the banner itself is the link to the PLP */}
      <Link
        href={slide.cta.href}
        aria-label={`${slide.title} ${slide.accent} — ${slide.cta.label}`}
        className="absolute inset-0 z-10"
      />

      <div className="pointer-events-none relative z-20 flex h-full items-center">
        <div
          className={`shell ${slide.align === "center" ? "text-center" : "text-left"}`}
        >
          <div
            key={slide.id}
            className={`animate-rise max-w-[54ch] ${
              slide.align === "center" ? "mx-auto" : ""
            }`}
          >
            <p className="text-2xs font-semibold tracking-[0.24em] text-accent-300 uppercase">
              {slide.eyebrow}
            </p>

            <h1 className="mt-6 text-6xl font-normal text-cream text-balance">
              {slide.title}{" "}
              <em className="text-accent-300 not-italic">{slide.accent}</em>
            </h1>

            <p className="mt-6 max-w-[48ch] text-base text-cream/80 text-pretty">
              {slide.copy}
            </p>

            <div
              className={`mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 ${
                slide.align === "center" ? "justify-center" : ""
              }`}
            >
              {/* rendered as spans: the whole banner is already an anchor */}
              <span className="gradient-accent inline-flex items-center gap-3 px-9 py-4 text-2xs font-semibold tracking-[0.18em] text-cream uppercase">
                {slide.cta.label}
                <span aria-hidden><ArrowRight className="size-4" strokeWidth={1.5} aria-hidden /></span>
              </span>
              <Link
                href={slide.altCta.href}
                className="link-sweep pointer-events-auto relative z-30 text-2xs font-semibold tracking-[0.18em] text-cream uppercase"
              >
                {slide.altCta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* controls sit above the banner link */}
      <div className="shell pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-6 pb-[4vh]">
        <div className="pointer-events-auto flex flex-1 items-center gap-3">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className="h-[0.35vh] min-h-[3px] max-w-[8rem] flex-1 overflow-hidden bg-cream/30"
            >
              <span
                className="block h-full bg-cream transition-[width] ease-linear"
                style={{
                  width: i === index ? "100%" : "0%",
                  transitionDuration: i === index && !paused ? `${AUTOPLAY_MS}ms` : "400ms",
                }}
              />
            </button>
          ))}
          <span className="font-display ml-2 text-sm text-cream">
            {String(index + 1).padStart(2, "0")}
            <span className="text-cream/50"> / {String(heroSlides.length).padStart(2, "0")}</span>
          </span>
        </div>

        <div className="pointer-events-auto flex gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="grid size-11 place-items-center border border-cream/40 text-sm text-cream transition-colors duration-500 ease-out-expo hover:bg-cream hover:text-ink"
          ><ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden /></button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="grid size-11 place-items-center border border-cream/40 text-sm text-cream transition-colors duration-500 ease-out-expo hover:bg-cream hover:text-ink"
          ><ArrowRight className="size-4" strokeWidth={1.5} aria-hidden /></button>
        </div>
      </div>
    </section>
  );
}
