type IconProps = { className?: string };

/** Serif monogram used in place of a logotype mark. */
export function Monogram({ className = "" }: IconProps) {
  return (
    <span
      className={`font-display grid place-items-center border border-ink text-lg leading-none ${className}`}
      aria-hidden
    >
      G
    </span>
  );
}
