import { Hero } from "@/components/home/Hero";
import {
  JournalList,
  OccasionIndex,
  StatementBand,
  UspLine,
  VoiceQuote,
} from "@/components/home/Editorial";
import {
  CategoryRail,
  MakersStrip,
  PersonalisedBanner,
  ProductRail,
  PromoBand,
  ShopByBudget,
  ShopByRecipient,
} from "@/components/home/Sections";
import { catalogServer } from "@/lib/api";
import { mapApiProductToProduct, type ApiProductListResult } from "@/lib/product-catalog";
import type { Product } from "@/lib/types";
import { loadBanners } from "@/lib/banners";

async function rail(query: string): Promise<Product[]> {
  try {
    const res = await catalogServer.products<ApiProductListResult>(query);
    return (res.data?.items ?? []).map(mapApiProductToProduct);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [trending, onSale, newArrivals, personalised, heroBanners, promoBanners] =
    await Promise.all([
      rail("limit=8&sort=rating_desc"),
      rail("limit=8&onSale=true"),
      rail("limit=8&sort=newest"),
      rail("limit=1&personalised=true&sort=rating_desc"),
      loadBanners("HOME_HERO"),
      loadBanners("HOME_PROMO"),
    ]);
  const featured = personalised[0];

  return (
    <>
      <Hero banners={heroBanners} />
      <UspLine />
      <CategoryRail />
      <ProductRail
        eyebrow="Trending now"
        title="What everyone is sending this week"
        copy="Ranked by orders in the last seven days, refreshed every morning."
        href="/products?sort=rating"
        items={trending}
      />
      <ShopByRecipient />
      <OccasionIndex />
      <PromoBand banner={promoBanners[0]} />
      <ShopByBudget />
      <StatementBand />
      {featured && <PersonalisedBanner product={featured} />}
      <ProductRail
        eyebrow="On offer"
        title="Reduced, not remaindered"
        copy="End-of-run pieces and festive overstock, while they last."
        href="/products?sort=price-asc"
        items={onSale}
      />
      <MakersStrip />
      <VoiceQuote />
      <ProductRail
        eyebrow="Just landed"
        title="New in the shop"
        href="/products?sort=newest"
        items={newArrivals}
      />
      <JournalList />
    </>
  );
}
