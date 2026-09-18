import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActiveChips, Filters, MobileFilters, SortSelect } from "@/components/plp/Filters";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { categoryBySlug, occasionBySlug, occasions, subcategories } from "@/data/taxonomy";
import { parseCatalogQuery, queryProducts } from "@/lib/catalog";
import { Motif } from "@/components/ui/Motif";

export const metadata: Metadata = {
  title: "Shop all gifts",
  description: "Filter by category, subcategory, occasion and price.",
};

export default async function ProductListPage(props: PageProps<"/products">) {
  const sp = await props.searchParams;
  const query = parseCatalogQuery(sp);
  const results = queryProducts(query);

  const category = query.category ? categoryBySlug.get(query.category) : undefined;
  const occasion = query.occasion ? occasionBySlug.get(query.occasion) : undefined;
  const subcategory = query.subcategory
    ? subcategories.find((s) => s.slug === query.subcategory)
    : undefined;

  const heading = subcategory?.name ?? category?.name ?? occasion?.name ?? "Every gift we make";
  const blurb =
    category?.blurb ??
    (occasion ? `Gifts chosen for ${occasion.name.toLowerCase()} — ${occasion.window.toLowerCase()}.` : undefined) ?? "Twenty-four curated gifts, filterable by who it is for and what the occasion is.";

  return (
    <>
      {/* PLP hero */}
      <section className="gradient-surface border-b border-line">
        <div className="shell py-[6vh]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-2xs text-ink-faint">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/products" className="hover:text-ink">
              Shop
            </Link>
            {category && (
              <>
                <span aria-hidden>/</span>
                <Link href={`/products?category=${category.slug}`} className="hover:text-ink">
                  {category.name}
                </Link>
              </>
            )}
            {subcategory && (
              <>
                <span aria-hidden>/</span>
                <span className="text-ink">{subcategory.name}</span>
              </>
            )}
          </nav>

          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.03em] text-balance">
            {heading}
          </h1>
          <p className="mt-3 max-w-[56ch] text-base text-ink-soft text-pretty">{blurb}</p>

          {/* occasion quick rail */}
          <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">
            {occasions.map((o) => {
              const active = query.occasion === o.slug;
              return (
                <Link
                  key={o.id}
                  href={active ? "/products" : `/products?occasion=${o.slug}`}
                  className={`flex shrink-0 items-center gap-2 rounded-xs border px-5 py-3 text-xs font-semibold transition ${
                    active
                      ? "border-transparent bg-ink text-cream"
                      : "border-ink/12 bg-white/80 backdrop-blur hover:border-ink/40"
                  }`}
                >
                  <Motif name={o.motif} className="size-4" />
                  {o.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="shell grid gap-8 py-[5vh] lg:grid-cols-[18vw_1fr] lg:items-start">
        <aside className="sticky top-[12vh] hidden max-h-[80vh] overflow-y-auto pr-2 lg:block">
          <Suspense fallback={null}>
            <Filters />
          </Suspense>
        </aside>

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              <span className="font-bold text-ink">{results.length}</span>{" "}
              {results.length === 1 ? "gift" : "gifts"}
            </p>
            <div className="flex items-center gap-3">
              <Suspense fallback={null}>
                <MobileFilters resultCount={results.length} />
              </Suspense>
              <Suspense fallback={null}>
                <SortSelect />
              </Suspense>
            </div>
          </div>

          <div className="mb-6">
            <Suspense fallback={null}>
              <ActiveChips />
            </Suspense>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line bg-white py-[10vh] text-center">
              <Motif name="search" className="size-14 text-ink-faint" strokeWidth={1.2} />
              <p className="text-xl font-bold">Nothing matches that combination</p>
              <p className="max-w-[44ch] text-sm text-ink-soft">
                Try removing a filter, or browse everything and narrow down from there.
              </p>
              <Link
                href="/products"
                className="rounded-xs gradient-accent px-6 py-3 text-sm font-bold text-cream"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 8) * 50}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
