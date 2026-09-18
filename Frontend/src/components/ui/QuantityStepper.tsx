"use client";

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const pad = size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2 text-base";
  return (
    <div
      className="inline-flex items-center rounded-xs border border-ink/15 bg-white"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={`${pad} rounded-l-full font-semibold text-ink transition hover:bg-accent-50 disabled:opacity-30`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isFinite(next)) onChange(Math.min(Math.max(1, next), max));
        }}
        className={`${pad} w-[4.5ch] appearance-none border-x border-ink/10 bg-transparent text-center font-semibold [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${pad} rounded-r-full font-semibold text-ink transition hover:bg-accent-50 disabled:opacity-30`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
