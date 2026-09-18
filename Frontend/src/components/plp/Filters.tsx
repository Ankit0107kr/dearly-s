"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { categories, occasions, subcategoriesFor } from "@/data/taxonomy";
import { priceBands } from "@/lib/catalog";
import { X } from "lucide-react";
import { Motif } from "@/components/ui/Motif";

function useFacetUrl() {
  const router = useRouter();
  const params = useSearchParams();

  const build = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      return qs ? `/products?${qs}` : "/products";
    },
    [params],
  );

  const apply = useCallback(
    (patch: Record<string, string | undefined>) => {
      router.push(build(patch), { scroll: false });
    },
    [build, router],
  );

  return { params, apply };
}

function FacetShell({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-2xs font-bold tracking-[0.15em] uppercase">{title}</span>
        <span
          aria-hidden
          className={`text-xs text-ink-faint transition-transform duration-500 ease-out-expo ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      <div
        className={`grid transition-all duration-400 ease-out-expo ${
          open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function Filters({ onDone }: { onDone?: () => void }) {
  const { params, apply } = useFacetUrl();
  const activeCategory = params.get("category");
  const activeSub = params.get("subcategory");
  const activeOccasion = params.get("occasion");
  const activeMin = params.get("min");
  const activeMax = params.get("max");
  const personalised = params.get("personalised") === "1";

  const pick = (patch: Record<string, string | undefined>) => {
    apply(patch);
    onDone?.();
  };

  return (
    <div className="flex flex-col">
      <FacetShell title="Category">
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => pick({ category: undefined, subcategory: undefined })}
              className={`w-full rounded-sm px-3 py-2 text-left text-sm transition ${
                !activeCategory ? "bg-ink text-cream" : "hover:bg-white"
              }`}
            >
              All categories
            </button>
          </li>
          {categories.map((c) => {
            const isActive = activeCategory === c.slug;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick({ category: c.slug, subcategory: undefined })}
                  className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-ink text-cream" : "hover:bg-white"
                  }`}
                >
                  <Motif name={c.motif} className="size-4" />
                  {c.name}
                </button>

                {isActive && (
                  <ul className="animate-rise mt-1 ml-4 flex flex-col gap-1 border-l border-line pl-3">
                    {subcategoriesFor(c.id).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() =>
                            pick({
                              category: c.slug,
                              subcategory: activeSub === s.slug ? undefined : s.slug,
                            })
                          }
                          className={`w-full rounded-sm px-3 py-2 text-left text-xs transition ${
                            activeSub === s.slug
                              ? "bg-accent-100 font-bold text-accent-700"
                              : "text-ink-soft hover:bg-white"
                          }`}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </FacetShell>

      <FacetShell title="Occasion">
        <div className="flex flex-wrap gap-2">
          {occasions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() =>
                pick({ occasion: activeOccasion === o.slug ? undefined : o.slug })
              }
              className={`rounded-xs border px-4 py-2 text-xs font-medium transition ${
                activeOccasion === o.slug
                  ? "border-transparent bg-ink text-cream"
                  : "border-ink/15 bg-white hover:border-ink/40"
              }`}
            >
              <Motif name={o.motif} className="mr-1 inline size-3.5" />
              {o.name}
            </button>
          ))}
        </div>
      </FacetShell>

      <FacetShell title="Price">
        <ul className="flex flex-col gap-1">
          {priceBands.map((b) => {
            const isActive =
              activeMin === String(b.min) ||
              (b.min === 0 && !activeMin && activeMax === String(b.max));
            return (
              <li key={b.label}>
                <button
                  type="button"
                  onClick={() =>
                    pick({
                      min: b.min === 0 ? undefined : String(b.min),
                      max:
                        b.max === Number.MAX_SAFE_INTEGER ? undefined : String(b.max),
                    })
                  }
                  className={`w-full rounded-sm px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-ink text-cream" : "hover:bg-white"
                  }`}
                >
                  {b.label}
                </button>
              </li>
            );
          })}
          {(activeMin || activeMax) && (
            <li>
              <button
                type="button"
                onClick={() => pick({ min: undefined, max: undefined })}
                className="px-3 py-2 text-xs text-accent-600 underline underline-offset-2"
              >
                Clear price
              </button>
            </li>
          )}
        </ul>
      </FacetShell>

      <FacetShell title="Options">
        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={personalised}
            onChange={(e) => pick({ personalised: e.target.checked ? "1" : undefined })}
            className="size-4 accent-[var(--color-accent-600)]"
          />
          Can be personalised
        </label>
      </FacetShell>

      <button
        type="button"
        onClick={() => {
          apply({
            category: undefined,
            subcategory: undefined,
            occasion: undefined,
            min: undefined,
            max: undefined,
            personalised: undefined,
            q: undefined,
          });
          onDone?.();
        }}
        className="mt-5 rounded-xs border border-ink/15 px-5 py-3 text-xs font-bold transition hover:border-ink hover:gradient-accent hover:text-cream"
      >
        Clear all filters
      </button>
    </div>
  );
}

export function MobileFilters({ resultCount }: { resultCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xs border border-ink/15 bg-white px-5 py-3 text-xs font-bold lg:hidden"
      >
        Filters
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="animate-rise absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-cream p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-semibold">Filters</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="text-xl"><X className="size-4" strokeWidth={1.6} aria-hidden /></button>
            </div>
            <Filters onDone={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xs gradient-accent px-6 py-4 text-sm font-bold text-white"
            >
              Show {resultCount} gifts
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect() {
  const { params, apply } = useFacetUrl();
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-ink-faint">Sort</span>
      <select
        value={params.get("sort") ?? "featured"}
        onChange={(e) => apply({ sort: e.target.value })}
        className="rounded-xs border border-ink/15 bg-white px-4 py-3 text-xs font-semibold outline-none"
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  );
}

export function ActiveChips() {
  const { params, apply } = useFacetUrl();
  const chips: { key: string; label: string }[] = [];
  const category = params.get("category");
  const subcategory = params.get("subcategory");
  const occasion = params.get("occasion");
  const q = params.get("q");

  if (category) chips.push({ key: "category", label: categories.find((c) => c.slug === category)?.name ?? category });
  if (subcategory) chips.push({ key: "subcategory", label: subcategory.replace(/-/g, " ") });
  if (occasion) chips.push({ key: "occasion", label: occasions.find((o) => o.slug === occasion)?.name ?? occasion });
  if (q) chips.push({ key: "q", label: `“${q}”` });
  if (params.get("personalised") === "1") chips.push({ key: "personalised", label: "Personalised" });
  if (params.get("min") || params.get("max")) chips.push({ key: "price", label: "Price filtered" });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() =>
            apply(
              c.key === "price"
                ? { min: undefined, max: undefined }
                : c.key === "category"
                  ? { category: undefined, subcategory: undefined }
                  : { [c.key]: undefined },
            )
          }
          className="inline-flex items-center gap-2 rounded-xs bg-ink px-4 py-2 text-2xs font-semibold text-cream capitalize"
        >
          {c.label}
          <X className="size-3" strokeWidth={2} aria-hidden />
        </button>
      ))}
    </div>
  );
}
