"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin, Package } from "lucide-react";
import { orderApi, userApi, wishlistApi, type ApiAddress } from "@/lib/api";
import type { ApiOrder } from "@/lib/api-types";
import { formatRupees } from "@/lib/money";
import {
  ErrorNote,
  Panel,
  Skeleton,
  StatusPill,
  formatDate,
} from "@/components/account/AccountUI";

type TabId = "overview" | "orders" | "addresses" | "wishlist" | "details";

type Summary = {
  orders: ApiOrder[];
  orderCount: number;
  wishlistCount: number;
  addresses: ApiAddress[];
};

export function AccountOverview({
  onNavigate,
}: {
  onNavigate: (tab: TabId) => void;
}) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // One round trip per panel; a failure in any one should not blank the page.
        const [orders, wishlist, addresses] = await Promise.allSettled([
          orderApi.list({ page: 1, limit: 3 }),
          wishlistApi.get(),
          userApi.addresses(),
        ]);
        if (cancelled) return;
        setData({
          orders:
            orders.status === "fulfilled" ? (orders.value.data?.items ?? []) : [],
          orderCount:
            orders.status === "fulfilled"
              ? (orders.value.data?.pagination?.total ?? 0)
              : 0,
          wishlistCount:
            wishlist.status === "fulfilled"
              ? (wishlist.value.data?.wishlist?.products?.length ?? 0)
              : 0,
          addresses:
            addresses.status === "fulfilled"
              ? (addresses.value.data?.addresses ?? [])
              : [],
        });
        if (orders.status === "rejected") {
          setError("Some account details could not be loaded.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your account");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Panel title="Overview">
        <Skeleton rows={4} />
      </Panel>
    );
  }

  const defaultAddress = data?.addresses.find((a) => a.isDefault);

  const stats = [
    {
      id: "orders" as const,
      label: "Orders placed",
      value: data?.orderCount ?? 0,
      icon: Package,
    },
    {
      id: "wishlist" as const,
      label: "Saved gifts",
      value: data?.wishlistCount ?? 0,
      icon: Heart,
    },
    {
      id: "addresses" as const,
      label: "Addresses",
      value: data?.addresses.length ?? 0,
      icon: MapPin,
    },
  ];

  return (
    <div className="grid gap-4">
      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              type="button"
              onClick={() => onNavigate(stat.id)}
              className="group rounded-lg border border-line bg-white/70 p-5 text-left shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="grid size-9 place-items-center rounded-full bg-accent-50 text-accent-600">
                <Icon className="size-4" strokeWidth={1.6} aria-hidden />
              </span>
              <p className="mt-3 font-display text-2xl text-ink tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-ink-soft">{stat.label}</p>
            </button>
          );
        })}
      </div>

      <Panel
        title="Recent orders"
        action={
          <button
            type="button"
            onClick={() => onNavigate("orders")}
            className="link-sweep text-xs font-semibold text-accent-700"
          >
            View all
          </button>
        }
      >
        {!data || data.orders.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No orders yet — your most recent three will show up here.
          </p>
        ) : (
          <ul className="grid gap-2">
            {data.orders.map((order) => (
              <li
                key={order._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-cream px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {order.orderNumber ?? `Order ${order._id.slice(-8).toUpperCase()}`}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {formatDate(order.createdAt)} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={order.orderStatus} />
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatRupees(order.totalAmount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Default delivery address"
        action={
          <button
            type="button"
            onClick={() => onNavigate("addresses")}
            className="link-sweep text-xs font-semibold text-accent-700"
          >
            Manage
          </button>
        }
      >
        {defaultAddress ? (
          <address className="text-sm not-italic leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">{defaultAddress.fullName}</span>
            <br />
            {defaultAddress.addressLine1}
            {defaultAddress.addressLine2 && <>, {defaultAddress.addressLine2}</>}
            <br />
            {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
            <br />
            {defaultAddress.phone}
          </address>
        ) : (
          <p className="text-sm text-ink-soft">
            No default address set. Add one to speed up checkout.
          </p>
        )}
      </Panel>
    </div>
  );
}
