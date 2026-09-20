"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  User as UserIcon,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AccountOverview } from "@/components/account/AccountOverview";
import { AccountOrders } from "@/components/account/AccountOrders";
import { AccountAddresses } from "@/components/account/AccountAddresses";
import { AccountWishlist } from "@/components/account/AccountWishlist";
import { AccountDetails } from "@/components/account/AccountDetails";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "My orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "details", label: "Profile details", icon: UserIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

const isTabId = (value: string | null): value is TabId =>
  TABS.some((t) => t.id === value);

export function AccountShell() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get("tab");
  const active: TabId = isTabId(raw) ? raw : "overview";

  useEffect(() => {
    if (loading || user) return;
    router.replace(`/login?next=${encodeURIComponent(pathname || "/account")}`);
  }, [user, loading, router, pathname]);

  // Tabs live in the URL so they survive refresh and the back button.
  const selectTab = useCallback(
    (id: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "overview") params.delete("tab");
      else params.set("tab", id);
      const query = params.toString();
      router.replace(query ? `/account?${query}` : "/account", { scroll: false });
    },
    [router, searchParams],
  );

  if (loading || !user) {
    return (
      <div className="shell grid min-h-[60vh] place-items-center text-sm text-ink-soft">
        Loading your account…
      </div>
    );
  }

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="shell py-[6vh]">
      <header className="flex flex-wrap items-center gap-5">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-full gradient-accent font-display text-xl text-cream"
        >
          {initials || <UserIcon className="size-6" strokeWidth={1.4} />}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">My account</p>
          <h1 className="font-display text-3xl text-ink">
            {user.firstName} {user.lastName}
          </h1>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-xs border border-ink/15 bg-white/70 px-4 py-2 text-xs font-semibold transition hover:border-ink/40 hover:bg-white"
            >
              Admin portal
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="inline-flex items-center gap-2 rounded-xs border border-ink/15 bg-white/70 px-4 py-2 text-xs font-semibold transition hover:border-ink/40 hover:bg-white"
          >
            <LogOut className="size-3.5" strokeWidth={1.6} aria-hidden />
            Log out
          </button>
        </div>
      </header>

      <div className="mt-[4vh] grid gap-6 lg:grid-cols-[14rem_1fr] lg:items-start">
        <nav
          aria-label="Account sections"
          className="no-scrollbar -mx-[4vw] flex gap-1 overflow-x-auto px-[4vw] lg:mx-0 lg:flex-col lg:px-0"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => selectTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xs px-4 py-2.5 text-sm whitespace-nowrap transition-all duration-300 ease-out-expo lg:w-full ${
                  selected
                    ? "bg-ink font-semibold text-cream shadow-soft"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="min-w-0">
          {active === "overview" && <AccountOverview onNavigate={selectTab} />}
          {active === "orders" && <AccountOrders />}
          {active === "addresses" && <AccountAddresses />}
          {active === "wishlist" && <AccountWishlist />}
          {active === "details" && <AccountDetails />}
        </section>
      </div>
    </div>
  );
}
