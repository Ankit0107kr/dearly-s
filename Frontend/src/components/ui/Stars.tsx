import { Star } from "lucide-react";

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span
      className={`inline-flex items-center gap-[0.15em] ${className}`}
      aria-label={`Rated ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={1.4}
          className={`size-[1em] ${
            i <= rounded ? "fill-accent-600 text-accent-600" : "fill-none text-line"
          }`}
        />
      ))}
    </span>
  );
}
