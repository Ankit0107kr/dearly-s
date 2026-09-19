"use client";

import { useId } from "react";

const base =
  "mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors disabled:bg-ink/5 disabled:text-ink-faint";

export const fieldClass = (invalid?: boolean) =>
  `${base} ${invalid ? "border-red-400 focus:border-red-500" : "border-line focus:border-accent-600"}`;

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  error?: string | null;
  hint?: string;
  optional?: boolean;
  className?: string;
};

export function Field({ label, error, hint, optional, className = "", ...input }: Props) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <label className={`block text-sm ${className}`} htmlFor={id}>
      <span className="font-medium">
        {label}
        {optional && <span className="text-ink-faint"> (optional)</span>}
      </span>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={fieldClass(Boolean(error))}
        {...input}
      />
      {error ? (
        <span id={`${id}-err`} role="alert" className="mt-1 block text-xs text-red-700">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="mt-1 block text-xs text-ink-faint">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
