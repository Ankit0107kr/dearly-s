"use client";

import Image from "next/image";
import Link from "next/link";
import { Carousel } from "@/components/ui/Carousel";
import { ProductArt } from "@/components/ui/ProductArt";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { budgetBands, makers, promoBand, recipients } from "@/data/site";
import { categories } from "@/data/taxonomy";
import type { Product } from "@/lib/types";
import { useParallax } from "@/lib/useParallax";
import { Motif } from "@/components/ui/Motif";

export function SectionHead({
  eyebrow,
  title,
  copy,
  href,
  linkLabel = "View all",
  centered,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  href?: string;
  linkLabel?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <Reveal className="mb-10 flex flex-col items-center text-center">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-3 max-w-[22ch] text-3xl font-semibold text-balance">{title}</h2>
        {copy && <p className="mt-3 max-w-[56ch] text-sm text-ink-soft text-pretty">{copy}</p>}
        <span className="mt-6 h-px w-[8vw] min-w-16 bg-accent-600" />
      </Reveal>
    );
  }
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="text-2xs font-bold tracking-[0.18em] text-accent-600 uppercase">
          {eyebrow}
        </span>
        <h2 className="mt-2 max-w-[20ch] text-3xl font-semibold tracking-[-0.02em] text-balance">
          {title}
        </h2>
        {copy && <p className="mt-3 max-w-[52ch] text-sm text-ink-soft">{copy}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-xs border border-ink/15 px-5 py-3 text-xs font-bold transition hover:border-ink hover:gradient-accent hover:text-cream"
        >
          {linkLabel}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      )}
    </Reveal>
  );
}


export function CategoryRail() {
  return (
    <section className="shell py-[7vh]">
      <SectionHead
        eyebrow="Browse"
        title="Start with what kind of gift it is"
        copy="Six edits, each one curated by hand. Every category drills into subcategories on the next page."
        href="/products"
        linkLabel="All categories"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.id} delay={i * 90} y={5}>
            <Link
              href={`/products?category=${c.slug}`}
              className="group relative flex h-full min-h-[34vh] flex-col justify-end overflow-hidden border border-line p-6"
            >
              <Image
                src={c.image}
                alt=""
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                className="object-cover saturate-[0.72] transition-transform duration-[1200ms] ease-out-expo group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/60 to-accent-700/35 transition-opacity duration-700" />
              <span className="absolute top-5 right-5 text-cream/90">
                <Motif name={c.motif} className="size-7" />
              </span>
              <h3 className="relative text-xl font-semibold tracking-tight text-cream">
                {c.name}
              </h3>
              <p className="relative mt-2 max-w-[30ch] text-xs text-cream/75">{c.blurb}</p>
              <span className="relative mt-4 inline-flex items-center gap-2 text-2xs font-semibold tracking-wider text-cream uppercase">
                Explore
                <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}


export function ProductRail({
  eyebrow,
  title,
  copy,
  href,
  items,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  href: string;
  items: Product[];
}) {
  return (
    <section className="shell py-[7vh]">
      <SectionHead eyebrow={eyebrow} title={title} copy={copy} href={href} />
      <Reveal delay={120} y={5}>
        <Carousel ariaLabel={title}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Carousel>
      </Reveal>
    </section>
  );
}

export function PersonalisedBanner({ product }: { product: Product }) {
  return (
    <section className="shell py-[7vh]">
      <Reveal className="grid overflow-hidden rounded-xl border border-line bg-white lg:grid-cols-2">
        <div className="flex flex-col justify-center p-[5vw] lg:p-[3vw]">
          <span className="text-2xs font-bold tracking-[0.18em] text-accent-600 uppercase">
            Personalisation
          </span>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] text-balance">
            Put their name on it, free.
          </h2>
          <p className="mt-4 max-w-[46ch] text-sm text-ink-soft">
            Engraving, star maps plotted to a date, photo games printed from your camera roll. Add
            personalisation at checkout — it costs nothing and takes the gift somewhere else entirely.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[ "Up to 40 characters engraved at no charge", "Proof sent to you before anything is cut", "Made to order, dispatched in 5 working days",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <span className="mt-[0.2em] grid size-5 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                  <Motif name="check" className="size-3" strokeWidth={2.4} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/products?personalised=1"
            className="mt-8 w-fit rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-cream transition hover:brightness-110"
          >
            Shop personalised gifts
          </Link>
        </div>
        <Link href={`/products/${product.slug}`} className="group relative min-h-[40vh]">
          <ProductArt
            art={product.art}
            className="h-full w-full"
            motifClass="size-[18vh] transition-transform duration-700 ease-out-expo group-hover:scale-110"/>
          <span className="absolute bottom-6 left-6 rounded-xs bg-white/95 px-5 py-3 text-xs font-bold">
            {product.name} →
          </span>
        </Link>
      </Reveal>
    </section>
  );
}


/** Full-bleed offer band, linking straight through to the filtered list. */
export function PromoBand() {
  const { ref, offset } = useParallax<HTMLElement>(0.16);
  return (
    <section
      ref={ref}
      className="relative isolate my-[6vh] h-[62vh] min-h-[22rem] w-full overflow-hidden"
    >
      {/* image drifts against the scroll, hence the oversized frame */}
      <div
        className="absolute inset-x-0 -top-[12%] h-[124%] will-change-transform"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        <Image
          src={promoBand.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover saturate-[0.72]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/68 to-accent-700/40" />
      <Link href={promoBand.cta.href} aria-label={promoBand.title} className="absolute inset-0 z-10" />
      <div className="pointer-events-none relative z-20 flex h-full items-center">
        <div className="shell">
          <Reveal y={5} className="max-w-[48ch]">
            <p className="text-2xs font-semibold tracking-[0.24em] text-accent-300 uppercase">
              {promoBand.eyebrow}
            </p>
            <h2 className="mt-5 text-4xl font-normal text-cream text-balance">
              {promoBand.title}
            </h2>
            <p className="mt-5 text-base text-cream/80 text-pretty">{promoBand.copy}</p>
            <span className="gradient-accent mt-8 inline-flex items-center gap-3 px-9 py-4 text-2xs font-semibold tracking-[0.18em] text-cream uppercase">
              {promoBand.cta.label}
              <span aria-hidden>→</span>
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Recipient rail — a preset view of the list for each kind of person. */
export function ShopByRecipient() {
  return (
    <section className="shell py-[7vh]">
      <SectionHead
        centered
        eyebrow="Shop by recipient"
        title="Who is it for?"
        copy="Tell us the person and we will narrow two dozen gifts down to the handful that actually suit them."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipients.map((r, i) => (
          <Reveal key={r.id} delay={i * 80} y={4}>
            <Link
              href={r.href}
              className="group relative flex h-[26vh] min-h-[11rem] items-end overflow-hidden border border-line p-6"
            >
              <Image
                src={r.image}
                alt=""
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                className="object-cover saturate-[0.72] transition-transform duration-[1200ms] ease-out-expo group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/55 to-accent-700/30" />
              <span className="relative">
                <span className="font-display block text-2xl text-cream">{r.label}</span>
                <span className="mt-1 block text-2xs tracking-[0.12em] text-cream/70 uppercase">
                  {r.note}
                </span>
              </span>
              <span className="relative ml-auto text-cream transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Budget bands, typographic rather than photographic. */
export function ShopByBudget() {
  return (
    <section className="bg-cream-deep py-[7vh]">
      <div className="shell">
        <SectionHead
          centered
          eyebrow="Shop by budget"
          title="Pick a number, we will do the rest"
        />
        <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {budgetBands.map((b, i) => (
            <Reveal key={b.label} delay={i * 90} y={3}>
              <Link
                href={b.href}
                className="group flex h-full flex-col justify-between gap-8 bg-cream p-7 transition-colors duration-500 ease-out-expo hover:bg-accent-50"
              >
                <span className="font-display text-2xl">{b.label}</span>
                <span className="flex items-center justify-between gap-4">
                  <span className="text-2xs tracking-[0.12em] text-ink-faint uppercase">
                    {b.note}
                  </span>
                  <span className="text-accent-600 transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Makers marquee — scrolls continuously, pauses on hover. */
export function MakersStrip() {
  const strip = [...makers, ...makers];
  return (
    <section className="gradient-ink overflow-hidden py-[5vh] text-cream">
      <p className="shell mb-6 text-center text-2xs font-semibold tracking-[0.24em] text-accent-300 uppercase">
        The workshops behind the boxes
      </p>
      <div className="group relative flex overflow-hidden">
        <div className="animate-marquee flex w-max gap-14 group-hover:[animation-play-state:paused]">
          {strip.map((m, i) => (
            <span
              key={`${m.name}-${i}`}
              className="flex shrink-0 items-baseline gap-3 whitespace-nowrap"
            >
              <span className="font-display text-xl">{m.name}</span>
              <span className="text-2xs tracking-[0.18em] text-cream/50 uppercase">{m.craft}</span>
              <span className="text-2xs text-accent-300">{m.note}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

