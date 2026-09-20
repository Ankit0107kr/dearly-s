import { catalogServer } from "@/lib/api";
import type { Category, Occasion, Subcategory } from "@/lib/types";

/** Shape returned by `/categories/tree` and `/occasions`. */
export type ApiTaxonomyNode = {
  _id: string;
  name: string;
  slug: string;
  blurb?: string;
  note?: string;
  window?: string;
  motif?: string;
  accent?: string;
  image?: { url?: string } | null;
  children?: ApiTaxonomyNode[];
};

export type Taxonomy = {
  categories: Category[];
  subcategories: Subcategory[];
  occasions: Occasion[];
};

export const emptyTaxonomy: Taxonomy = { categories: [], subcategories: [], occasions: [] };

const ACCENT = "var(--color-accent-600)";

const toCategory = (node: ApiTaxonomyNode): Category => ({
  id: node._id,
  name: node.name,
  slug: node.slug,
  blurb: node.blurb ?? "",
  motif: node.motif ?? "gift",
  accent: node.accent ?? ACCENT,
  image: node.image?.url ?? "",
});

const toOccasion = (node: ApiTaxonomyNode): Occasion => ({
  id: node._id,
  name: node.name,
  slug: node.slug,
  note: node.note ?? "",
  window: node.window ?? "All year",
  motif: node.motif ?? "gift",
  accent: node.accent ?? ACCENT,
  image: node.image?.url ?? "",
});

/** Server-side only: the taxonomy is injected once per request by the root layout. */
export async function loadTaxonomy(): Promise<Taxonomy> {
  try {
    const [treeRes, occasionRes] = await Promise.all([
      catalogServer.categories<{ categories: ApiTaxonomyNode[] }>(),
      catalogServer.occasions<{ occasions: ApiTaxonomyNode[] }>(),
    ]);

    const tree = treeRes.data?.categories ?? [];

    return {
      categories: tree.map(toCategory),
      subcategories: tree.flatMap((parent) =>
        (parent.children ?? []).map<Subcategory>((child) => ({
          id: child._id,
          name: child.name,
          slug: child.slug,
          categoryId: parent._id,
        })),
      ),
      occasions: (occasionRes.data?.occasions ?? []).map(toOccasion),
    };
  } catch {
    // A taxonomy outage must not take the whole page down; facets just render empty.
    return emptyTaxonomy;
  }
}
