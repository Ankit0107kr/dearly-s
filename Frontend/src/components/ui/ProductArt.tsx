import type { ProductArt as Art } from "@/lib/types";
import { Motif } from "@/components/ui/Motif";

const patterns: Record<NonNullable<Art["pattern"]>, string> = {
  dots: "radial-gradient(rgba(25,18,49,0.07) 7%, transparent 8%)",
  rings:
    "repeating-radial-gradient(circle at 50% 50%, rgba(25,18,49,0.05) 0 0.1vh, transparent 0.1vh 3.4vh)",
  confetti:
    "repeating-linear-gradient(45deg, rgba(25,18,49,0.045) 0 0.15vh, transparent 0.15vh 2.6vh)",
  waves:
    "repeating-linear-gradient(-18deg, rgba(25,18,49,0.04) 0 0.2vh, transparent 0.2vh 3.2vh)",
};

type Props = {
  art: Art;
  /** Sizing classes only. The wrapper is position:relative, so passing
   *  `absolute` here will not win against it — size the parent instead. */
  className?: string;
  /** Sizing classes for the icon itself. */
  motifClass?: string;
};

/**
 * Catalog imagery is generated from each product's art tokens, so the CMS stays
 * text-only and every card renders instantly with no layout shift.
 * Motifs are desaturated and tinted into the brass accent so the grid reads as
 * one material rather than a wall of competing colour.
 */
export function ProductArt({ art, className = "", motifClass = "size-16" }: Props) {
  const pattern = patterns[art.pattern ?? "dots"];
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={{ background: `linear-gradient(158deg, ${art.from}, ${art.to})` }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: pattern, backgroundSize: "2.2vh 2.2vh" }}
      />
      <div className="absolute inset-0 ring-1 ring-ink/8 ring-inset" />
      <div className="absolute inset-0 grid place-items-center">
        <Motif name={art.motif} className={motifClass} strokeWidth={1.1} />
      </div>
    </div>
  );
}
