import { products } from "@/data/products";
import { categoryBySlug, occasionBySlug, subcategories } from "@/data/taxonomy";
import type { Product } from "@/lib/types";

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

export type CatalogQuery = {
  category?: string;
  subcategory?: string;
  occasion?: string;
  min?: number;
  max?: number;
  q?: string;
  sort?: SortKey;
  personalised?: boolean;
};

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
  { key: "newest", label: "Newest" },
];

export const priceBands = [
  { label: "Under ₹1,000", min: 0, max: 100000 },
  { label: "₹1,000 – ₹2,500", min: 100000, max: 250000 },
  { label: "₹2,500 – ₹5,000", min: 250000, max: 500000 },
  { label: "Above ₹5,000", min: 500000, max: Number.MAX_SAFE_INTEGER },
];

/** Pure catalog query — runs on the server for PLP, and in memory for search. */
export function queryProducts(query: CatalogQuery): Product[] {
  const category = query.category ? categoryBySlug.get(query.category) : undefined;
  const occasion = query.occasion ? occasionBySlug.get(query.occasion) : undefined;
  const subcategory = query.subcategory
    ? subcategories.find((s) => s.slug === query.subcategory)
    : undefined;
  const needle = query.q?.trim().toLowerCase();

  const result = products.filter((p) => {
    if (category && p.categoryId !== category.id) return false;
    if (subcategory && p.subcategoryId !== subcategory.id) return false;
    if (occasion && !p.occasionIds.includes(occasion.id)) return false;
    if (query.min !== undefined && p.price < query.min) return false;
    if (query.max !== undefined && p.price > query.max) return false;
    if (query.personalised && !p.personalisable) return false;
    if (needle) {
      const haystack = `${p.name} ${p.tagline} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  switch (query.sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "rating":
      return result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "newest":
      return result.sort((a, b) => b.id.localeCompare(a.id));
    default:
      return result.sort(
        (a, b) =>
          Number(Boolean(b.badge)) - Number(Boolean(a.badge)) ||
          b.rating * b.reviewCount - a.rating * a.reviewCount,
      );
  }
}

export const trending = () =>
  [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);

export const onSale = () => products.filter((p) => p.compareAt).slice(0, 8);

export const newArrivals = () => [...products].reverse().slice(0, 8);

export const byOccasion = (occasionId: string, limit = 8) =>
  products.filter((p) => p.occasionIds.includes(occasionId)).slice(0, limit);

export const parseCatalogQuery = (
  sp: Record<string, string | string[] | undefined>,
): CatalogQuery => {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = one(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    category: one("category"),
    subcategory: one("subcategory"),
    occasion: one("occasion"),
    min: num("min"),
    max: num("max"),
    q: one("q"),
    sort: (one("sort") as SortKey) ?? "featured",
    personalised: one("personalised") === "1",
  };
};
