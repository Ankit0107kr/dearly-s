"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { brand, navigation } from "@/data/site";
import { useTaxonomy } from "@/components/taxonomy/TaxonomyProvider";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Motif } from "@/components/ui/Motif";
import { X } from "lucide-react";

export function Header() {
  const { categories, occasions } = useTaxonomy();
  const router = useRouter();
  const { count, openDrawer, hydrated } = useCart();
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/products?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-out-expo ${
        scrolled ? "bg-cream/85 shadow-soft backdrop-blur-lg" : "bg-cream"
      }`}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="group flex items-center gap-2" aria-label={`${brand.name} home`}>
          <BrandLogo
            priority
            className="h-14 w-auto transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <div key={item.label} onMouseEnter={() => setOpenMenu(item.columns ? item.label : null)}>
              <Link
                href={item.href}
                className="relative rounded-xs px-4 py-2 text-sm font-medium transition hover:bg-ink/5"
              >
                {item.label}
                {item.columns && <span className="ml-1 text-2xs opacity-60">▾</span>}
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search gifts"
            className="grid size-10 place-items-center transition-colors duration-500 ease-out-expo hover:text-accent-600"
          >
            <Search className="size-5" strokeWidth={1.4} aria-hidden />
          </button>
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              aria-label="Account"
              className="grid size-10 place-items-center transition-colors duration-500 ease-out-expo hover:text-accent-600"
            >
              <User className="size-5" strokeWidth={1.4} aria-hidden />
            </button>
            {accountOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-line bg-cream p-2 shadow-lift"
                onMouseLeave={() => setAccountOpen(false)}
              >
                {user ? (
                  <>
                    <p className="px-3 py-2 text-xs text-ink-soft">
                      Hi, {user.firstName}
                    </p>
                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xs px-3 py-2 text-sm hover:bg-ink/5"
                    >
                      My profile
                    </Link>
                    <Link
                      href="/account?tab=orders"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xs px-3 py-2 text-sm hover:bg-ink/5"
                    >
                      My orders
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-xs px-3 py-2 text-sm hover:bg-ink/5"
                      >
                        Admin portal
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setAccountOpen(false);
                        await logout();
                      }}
                      className="block w-full rounded-xs px-3 py-2 text-left text-sm hover:bg-ink/5"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xs px-3 py-2 text-sm hover:bg-ink/5"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xs px-3 py-2 text-sm hover:bg-ink/5"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Cart, ${count} items`}
            className="relative grid size-10 place-items-center transition-colors duration-500 ease-out-expo hover:text-accent-600"
          >
            <ShoppingBag className="size-5" strokeWidth={1.4} aria-hidden />
            {hydrated && count > 0 && (
              <span className="animate-fade absolute top-0 right-0 grid min-w-5 place-items-center rounded-full bg-accent-600 px-1 text-2xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid size-10 place-items-center transition-colors duration-500 ease-out-expo hover:text-accent-600 lg:hidden"
          >
            <Menu className="size-5" strokeWidth={1.4} aria-hidden />
          </button>
        </div>
      </div>

      {/* mega menu */}
      {navigation.map((item) =>
        item.columns && openMenu === item.label ? (
          <div
            key={item.label}
            className="animate-rise absolute inset-x-0 top-full hidden border-t border-line bg-cream/95 shadow-lift backdrop-blur-lg lg:block"
            onMouseLeave={() => setOpenMenu(null)}
          >
            <div className="shell grid grid-cols-[repeat(3,1fr)_1.1fr] gap-8 py-8">
              {item.columns.map((col) => (
                <div key={col.heading}>
                  <p className="mb-4 text-2xs font-bold tracking-[0.15em] text-ink-faint uppercase">
                    {col.heading}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          onClick={() => setOpenMenu(null)}
                          className="inline-block text-sm text-ink-soft transition hover:translate-x-1 hover:text-accent-600"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {item.feature && (
                <Link
                  href={item.feature.href}
                  onClick={() => setOpenMenu(null)}
                  className="group relative overflow-hidden rounded-lg bg-ink p-6 text-white"
                >
                  <Motif name={item.feature.motif} className="size-8" />
                  <p className="mt-3 text-lg font-bold">{item.feature.title}</p>
                  <p className="mt-1 text-xs opacity-90">{item.feature.copy}</p>
                  <span className="mt-4 inline-block text-xs font-semibold underline underline-offset-4">
                    Shop now →
                  </span>
                  <Motif
                    name={item.feature.motif}
                    className="absolute -right-6 -bottom-6 size-32 opacity-20 transition-transform duration-700 group-hover:scale-110"
                  />
                </Link>
              )}
            </div>
          </div>
        ) : null,
      )}

      {/* search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div
            className="animate-rise shell mt-[12vh] rounded-lg bg-cream p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submitSearch}>
              <label htmlFor="site-search" className="text-2xs font-bold tracking-[0.15em] text-ink-faint uppercase">
                Search the shop
              </label>
              <div className="mt-3 flex items-center gap-3 border-b-2 border-ink/20 pb-3 focus-within:border-accent-600">
                <Search className="size-6" strokeWidth={1.4} aria-hidden />
                <input
                  id="site-search"
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Try “chocolate”, “engraved”, “under 1000”…"
                  className="w-full bg-transparent text-xl outline-none placeholder:text-ink-faint"
                />
                <button type="submit" className="rounded-xs gradient-accent px-5 py-2 text-xs font-bold text-cream">
                  Go
                </button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {["chocolate", "engraved", "candle", "hamper", "headphones", "diwali"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(`/products?q=${s}`);
                  }}
                  className="rounded-xs border border-ink/15 px-4 py-2 text-xs transition hover:border-accent-600 hover:text-accent-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="animate-rise absolute inset-y-0 right-0 flex w-[88vw] max-w-md flex-col overflow-y-auto bg-cream p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Menu</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-xl"><X className="size-4" strokeWidth={1.6} aria-hidden /></button>
            </div>

            <form onSubmit={submitSearch} className="mt-6 flex items-center gap-2 rounded-xs border border-ink/15 bg-white px-4 py-3">
              <Search className="size-4 text-ink-faint" strokeWidth={1.4} aria-hidden />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search gifts"
                className="w-full bg-transparent text-sm outline-none"
              />
            </form>

            <p className="mt-8 text-2xs font-bold tracking-[0.15em] text-ink-faint uppercase">Categories</p>
            <ul className="mt-3 flex flex-col gap-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?category=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition hover:bg-white"
                  >
                    <Motif name={c.motif} className="size-5 text-ink-faint" />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-2xs font-bold tracking-[0.15em] text-ink-faint uppercase">Occasions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {occasions.map((o) => (
                <Link
                  key={o.id}
                  href={`/products?occasion=${o.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xs border border-ink/15 bg-white px-4 py-2 text-xs font-medium"
                >
                  <Motif name={o.motif} className="size-4 text-ink-faint" /> {o.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 border-t border-line pt-6 text-sm">
              {user ? (
                <>
                  <p className="text-ink-soft">Signed in as {user.firstName}</p>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="mt-2 block font-medium">
                    My profile
                  </Link>
                  <Link href="/account?tab=orders" onClick={() => setMobileOpen(false)} className="mt-2 block font-medium">
                    My orders
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="mt-2 block font-medium">
                      Admin portal
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mt-2 font-medium text-accent-700"
                    onClick={async () => {
                      setMobileOpen(false);
                      await logout();
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-4">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>Register</Link>
                </div>
              )}
            </div>

            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="mt-6 rounded-xs gradient-accent px-6 py-4 text-center text-sm font-bold text-white"
            >
              Shop all gifts
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
