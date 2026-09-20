"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { wishlistApi } from "@/lib/api";
import type { ApiProduct } from "@/lib/api-types";
import { formatRupees } from "@/lib/money";
import {
  EmptyState,
  ErrorNote,
  Panel,
  Skeleton,
} from "@/components/account/AccountUI";

export function AccountWishlist() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await wishlistApi.get();
        if (!cancelled) setProducts(res.data?.wishlist?.products ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your wishlist");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (productId: string) => {
    setBusyId(productId);
    setError("");
    try {
      const res = await wishlistApi.remove(productId);
      setProducts(res.data?.wishlist?.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the item");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Panel title="Wishlist" description="Gifts you have saved for later.">
      <div className="grid gap-4">
        {error && <ErrorNote>{error}</ErrorNote>}

        {loading ? (
          <Skeleton rows={2} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Heart className="size-5" strokeWidth={1.5} />}
            title="Nothing saved yet"
            body="Tap the heart on any gift to keep it here while you decide."
            cta={{ href: "/products", label: "Browse gifts" }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => {
              const onSale = p.discountPrice != null && p.discountPrice < p.price;
              return (
                <li
                  key={p._id}
                  className="flex gap-4 rounded-md border border-line bg-cream p-3 transition-shadow duration-300 ease-out-expo hover:shadow-soft"
                >
                  <Link
                    href={`/products/${p.slug}`}
                    className="size-20 shrink-0 overflow-hidden rounded-xs bg-accent-50"
                  >
                    {p.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt={p.images[0].alt || p.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-accent-300">
                        <Heart className="size-6" strokeWidth={1.4} aria-hidden />
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${p.slug}`}
                      className="link-sweep self-start font-medium text-ink"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 text-sm tabular-nums text-ink-soft">
                      {formatRupees(onSale ? p.discountPrice! : p.price)}
                      {onSale && (
                        <span className="ml-2 text-xs text-ink-faint line-through">
                          {formatRupees(p.price)}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(p._id)}
                      disabled={busyId === p._id}
                      className="mt-auto inline-flex items-center gap-1.5 self-start text-2xs font-semibold text-ink-faint transition hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="size-3" strokeWidth={1.6} aria-hidden />
                      {busyId === p._id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
