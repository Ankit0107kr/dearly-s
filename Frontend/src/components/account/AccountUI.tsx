"use client";

import Link from "next/link";
import type { OrderStatus, PaymentStatus } from "@/lib/api-types";

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-white/70 p-6 shadow-soft ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-xl text-ink">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-ink-soft">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-md border border-dashed border-line px-6 py-[6vh] text-center">
      <span className="grid size-12 place-items-center rounded-full bg-accent-50 text-accent-600">
        {icon}
      </span>
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-soft">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-1 rounded-xs gradient-accent px-5 py-2.5 text-xs font-bold text-cream"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-ink/5" />
      ))}
    </div>
  );
}

/** Muted by default; only the states a shopper must notice get colour. */
const ORDER_TONES: Partial<Record<OrderStatus, string>> = {
  DELIVERED: "bg-green-50 text-green-800 border-green-200",
  CANCELLED: "bg-ink/5 text-ink-faint border-line",
  REFUNDED: "bg-ink/5 text-ink-faint border-line",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  SHIPPED: "bg-accent-50 text-accent-700 border-accent-100",
  OUT_FOR_DELIVERY: "bg-accent-50 text-accent-700 border-accent-100",
};

const PAYMENT_TONES: Partial<Record<PaymentStatus, string>> = {
  PAID: "bg-green-50 text-green-800 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-ink/5 text-ink-faint border-line",
};

const pretty = (status: string) =>
  status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export function StatusPill({
  status,
  kind = "order",
}: {
  status: string;
  kind?: "order" | "payment";
}) {
  const tones = kind === "order" ? ORDER_TONES : PAYMENT_TONES;
  const tone =
    (tones as Record<string, string | undefined>)[status] ??
    "bg-white text-ink-soft border-line";
  return (
    <span
      className={`inline-block rounded-xs border px-2.5 py-1 text-2xs font-semibold tracking-wide ${tone}`}
    >
      {pretty(status)}
    </span>
  );
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
