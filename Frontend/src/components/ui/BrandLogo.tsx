import Image from "next/image";

/**
 * Brand lockup, background removed. `cream` is the same artwork with the wordmark
 * and tagline lifted to read on dark grounds; the violet bow is kept in both.
 * Decorative — the wrapping link carries the accessible name.
 */
export function BrandLogo({
  tone = "ink",
  className = "",
  priority = false,
}: {
  tone?: "ink" | "cream";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/brand/dearlys-logo${tone === "cream" ? "-light" : ""}.png`}
      alt=""
      width={870}
      height={485}
      priority={priority}
      // Serves the source PNG as-is; the optimizer would re-encode it to WebP.
      unoptimized
      className={className}
    />
  );
}
