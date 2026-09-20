
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
