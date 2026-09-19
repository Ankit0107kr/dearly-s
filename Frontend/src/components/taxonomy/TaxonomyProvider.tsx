"use client";

import { createContext, useContext, useMemo } from "react";
import type { Taxonomy } from "@/lib/taxonomy-api";
import { emptyTaxonomy } from "@/lib/taxonomy-api";

type TaxonomyValue = Taxonomy & {
  categoryById: Map<string, Taxonomy["categories"][number]>;
  subcategoryById: Map<string, Taxonomy["subcategories"][number]>;
  occasionById: Map<string, Taxonomy["occasions"][number]>;
  categoryBySlug: Map<string, Taxonomy["categories"][number]>;
  occasionBySlug: Map<string, Taxonomy["occasions"][number]>;
  subcategoriesFor: (categoryId: string) => Taxonomy["subcategories"];
};

const build = (taxonomy: Taxonomy): TaxonomyValue => ({
  ...taxonomy,
  categoryById: new Map(taxonomy.categories.map((c) => [c.id, c])),
  subcategoryById: new Map(taxonomy.subcategories.map((s) => [s.id, s])),
  occasionById: new Map(taxonomy.occasions.map((o) => [o.id, o])),
  categoryBySlug: new Map(taxonomy.categories.map((c) => [c.slug, c])),
  occasionBySlug: new Map(taxonomy.occasions.map((o) => [o.slug, o])),
  subcategoriesFor: (categoryId) =>
    taxonomy.subcategories.filter((s) => s.categoryId === categoryId),
});

const TaxonomyContext = createContext<TaxonomyValue>(build(emptyTaxonomy));

export function TaxonomyProvider({
  taxonomy,
  children,
}: {
  taxonomy: Taxonomy;
  children: React.ReactNode;
}) {
  const value = useMemo(() => build(taxonomy), [taxonomy]);
  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}

export const useTaxonomy = () => useContext(TaxonomyContext);
