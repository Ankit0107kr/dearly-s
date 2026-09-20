import { catalogServer } from "@/lib/api";

export type BannerPlacement = "HOME_HERO" | "HOME_PROMO" | "PLP_TOP";

/** Shaped to match the editorial slide/band props the home components already take. */
export type Banner = {
  id: string;
  placement: BannerPlacement;
  eyebrow: string;
  title: string;
  accent?: string;
  copy: string;
  image: string;
  cta: { label: string; href: string };
  altCta?: { label: string; href: string };
  motif: string;
  align: "left" | "center" | "right";
};

type ApiBanner = {
  _id: string;
  placement: BannerPlacement;
  eyebrow?: string;
  title: string;
  accent?: string;
  copy?: string;
  image?: { url?: string; alt?: string };
  ctaLabel?: string;
  ctaHref?: string;
  altCtaLabel?: string;
  altCtaHref?: string;
  motif?: string;
  align?: "left" | "center" | "right";
};

const toBanner = (b: ApiBanner): Banner => ({
  id: b._id,
  placement: b.placement,
  eyebrow: b.eyebrow ?? "",
  title: b.title,
  accent: b.accent,
  copy: b.copy ?? "",
  image: b.image?.url ?? "",
  cta: { label: b.ctaLabel ?? "Shop now", href: b.ctaHref ?? "/products" },
  altCta:
    b.altCtaLabel && b.altCtaHref ? { label: b.altCtaLabel, href: b.altCtaHref } : undefined,
  motif: b.motif ?? "gift",
  align: b.align ?? "left",
});

/** Server-side only. Returns [] on failure so a banner outage never blanks a page. */
export async function loadBanners(placement: BannerPlacement): Promise<Banner[]> {
  try {
    const res = await catalogServer.banners<{ banners: ApiBanner[] }>(placement);
    return (res.data?.banners ?? []).filter((b) => b.image?.url).map(toBanner);
  } catch {
    return [];
  }
}
