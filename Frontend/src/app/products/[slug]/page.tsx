import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/product/ProductCard";
import { Carousel } from "@/components/ui/Carousel";
import { SectionHead } from "@/components/home/Sections";
import { catalogServer } from "@/lib/api";
import {
  mapApiProductToProduct,
  type ApiProductListItem,
  type ApiProductListResult,
} from "@/lib/product-catalog";
import type { Product } from "@/lib/types";

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    const res = await catalogServer.productBySlug<{ product: ApiProductListItem }>(slug);
    return res.data?.product ? mapApiProductToProduct(res.data.product) : null;
  } catch {
    return null;
  }
}

async function loadRelated(product: Product): Promise<Product[]> {
  if (!product.categoryId) return [];
  try {
    const query = new URLSearchParams({ limit: "12", category: product.categoryId });
    const res = await catalogServer.products<ApiProductListResult>(query.toString());
    return (res.data?.items ?? [])
      .map(mapApiProductToProduct)
      .filter((p) => p.id !== product.id)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Gift not found" };
  return {
    title: product.name,
    description: product.tagline || product.description.slice(0, 160),
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const related = await loadRelated(product);

  return (
    <>
      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="shell border-t border-line py-[6vh]">
          <SectionHead
            eyebrow="Pairs well with"
            title="People who bought this also considered"
            href="/products"
          />
          <Carousel ariaLabel="Related gifts">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Carousel>
        </section>
      )}
    </>
  );
}
