export function AuthDivider() {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-line" />
      </div>
      <p className="relative mx-auto w-fit bg-cream px-3 text-2xs font-semibold uppercase tracking-wider text-ink-faint">
        or
      </p>
    </div>
  );
}
