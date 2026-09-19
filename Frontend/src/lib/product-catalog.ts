import type { CatalogQuery } from "@/lib/catalog";
import type { Product, ProductArt } from "@/lib/types";

export type ApiCategoryNode = {
  _id: string;
  name: string;
  slug: string;
  children?: ApiCategoryNode[];
};

export type ApiProductListItem = {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  inventory?: { stock?: number };
  customizationFields?: unknown[];
  images?: { url: string; alt?: string }[];
  category?: { _id: string; name: string; slug: string };
  subCategory?: { _id: string; name: string; slug: string };
};

export type ApiProductListResult = {
  items: ApiProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function flattenCategories(nodes: ApiCategoryNode[]): ApiCategoryNode[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? flattenCategories(node.children) : []),
  ]);
}

export function findCategoryIdBySlug(
  tree: ApiCategoryNode[],
  slug: string,
): string | undefined {
  return flattenCategories(tree).find((c) => c.slug === slug)?._id;
}

function artFromSlug(slug: string): ProductArt {
  const hue = slug.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  return {
    from: `hsl(${hue} 48% 96%)`,
    to: `hsl(${hue} 52% 86%)`,
    motif: "gift",
    pattern: "dots",
  };
}

export function mapApiProductToProduct(item: ApiProductListItem): Product {
  const mrpPaise = Math.round(item.price * 100);
  const hasDiscount =
    item.discountPrice != null && item.discountPrice < item.price;
  const salePaise = hasDiscount
    ? Math.round(item.discountPrice! * 100)
    : mrpPaise;

  return {
    id: item._id,
    slug: item.slug,
    name: item.name,
    tagline: item.shortDescription || "",
    description: item.description || "",
    price: salePaise,
    compareAt: hasDiscount ? mrpPaise : undefined,
    categoryId: item.category?._id ?? "",
    subcategoryId: item.subCategory?._id ?? item.category?._id ?? "",
    occasionIds: [],
    tags: item.tags ?? [],
    rating: item.rating ?? 0,
    reviewCount: item.reviewCount ?? 0,
    stock: item.inventory?.stock ?? 0,
    badge: item.isFeatured ? "Featured" : undefined,
    art: artFromSlug(item.slug),
    highlights: [],
    specs: [],
    personalisable: (item.customizationFields?.length ?? 0) > 0,
    deliveryEta: "3–5 days",
    image: item.images?.[0]?.url,
  };
}

export function catalogQueryToApiParams(
  query: CatalogQuery,
  tree: ApiCategoryNode[],
): string {
  const params = new URLSearchParams();
  params.set("limit", "100");

  if (query.q) params.set("search", query.q);

  const subId = query.subcategory
    ? findCategoryIdBySlug(tree, query.subcategory)
    : undefined;
  const catId = query.category
    ? findCategoryIdBySlug(tree, query.category)
    : undefined;

  if (subId) params.set("subCategory", subId);
  else if (catId) params.set("category", catId);

  if (query.min != null) params.set("minPrice", String(query.min / 100));
  if (query.max != null) params.set("maxPrice", String(query.max / 100));

  switch (query.sort) {
    case "price-asc":
      params.set("sort", "price_asc");
      break;
    case "price-desc":
      params.set("sort", "price_desc");
      break;
    case "rating":
      params.set("sort", "rating_desc");
      break;
    case "newest":
      params.set("sort", "newest");
      break;
    case "featured":
      break;
    default:
      break;
  }

  return params.toString();
}

/** Filters the API does not support yet (occasion facets, etc.). */
export function applyCatalogClientFilters(
  items: Product[],
  query: CatalogQuery,
): Product[] {
  let result = items;

  if (query.personalised) {
    result = result.filter((p) => p.personalisable);
  }

  if (query.occasion) {
    const needle = query.occasion.replace(/-/g, " ").toLowerCase();
    result = result.filter(
      (p) =>
        p.tags.some((t) => t.toLowerCase().includes(needle)) ||
        p.name.toLowerCase().includes(needle),
    );
  }

  return result;
}

/** Client sort when the API has no matching sort (e.g. “featured” = boost, not filter). */
export function sortCatalogProducts(
  items: Product[],
  sort: CatalogQuery["sort"],
): Product[] {
  const list = [...items];
  if (sort === "featured") {
    return list.sort(
      (a, b) =>
        Number(Boolean(b.badge)) - Number(Boolean(a.badge)) ||
        b.rating - a.rating ||
        b.reviewCount - a.reviewCount,
    );
  }
  return list;
}
