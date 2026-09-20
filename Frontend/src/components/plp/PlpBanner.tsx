import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@/lib/banners";

/** Compact strip above the grid — deliberately shorter than the home promo band. */
export function PlpBanner({ banner }: { banner: Banner }) {
  return (
    <Link
      href={banner.cta.href}
      className="group relative isolate mb-6 flex h-[18vh] min-h-[8rem] items-end overflow-hidden rounded-lg border border-line"
    >
      <Image
        src={banner.image}
        alt={banner.title}
        fill
        sizes="(max-width: 1024px) 100vw, 70vw"
        className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />
      <div className="relative z-10 p-6">
        {banner.eyebrow && (
          <p className="text-2xs font-semibold tracking-[0.24em] text-accent-300 uppercase">
            {banner.eyebrow}
          </p>
        )}
        <p className="font-display mt-2 text-2xl text-cream text-balance">{banner.title}</p>
        {banner.copy && <p className="mt-1 max-w-[52ch] text-sm text-cream/75">{banner.copy}</p>}
      </div>
    </Link>
  );
}
