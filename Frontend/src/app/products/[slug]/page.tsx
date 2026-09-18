import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/product/ProductCard";
import { Carousel } from "@/components/ui/Carousel";
import { SectionHead } from "@/components/home/Sections";
import { getProduct, products, relatedProducts } from "@/data/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) return { title: "Gift not found" };
  return {
    title: product.name,
    description: product.tagline,
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = relatedProducts(product, 8);

  return (
    <>
      <ProductDetail product={product} />

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
    </>
  );
}
