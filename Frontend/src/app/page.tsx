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
import { getProduct } from "@/data/products";
import { newArrivals, onSale, trending } from "@/lib/catalog";

export default function HomePage() {
  const featured = getProduct("constellation-map-print")!;

  return (
    <>
      <Hero />
      <UspLine />
      <CategoryRail />
      <ProductRail
        eyebrow="Trending now"
        title="What everyone is sending this week"
        copy="Ranked by orders in the last seven days, refreshed every morning."
        href="/products?sort=rating"
        items={trending()}
      />
      <ShopByRecipient />
      <OccasionIndex />
      <PromoBand />
      <ShopByBudget />
      <StatementBand />
      <PersonalisedBanner product={featured} />
      <ProductRail
        eyebrow="On offer"
        title="Reduced, not remaindered"
        copy="End-of-run pieces and festive overstock, while they last."
        href="/products?sort=price-asc"
        items={onSale()}
      />
      <MakersStrip />
      <VoiceQuote />
      <ProductRail
        eyebrow="Just landed"
        title="New in the shop"
        href="/products?sort=newest"
        items={newArrivals()}
      />
      <JournalList />
    </>
  );
}
