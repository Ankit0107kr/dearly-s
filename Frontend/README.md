# gifty

Frontend for **Gifty**, a full gifting e-commerce storefront built with [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript and Tailwind CSS v4.

Home page, PLP with category / subcategory / occasion filtering, PDP with variants and quantity, cart, a three-step checkout and Razorpay payments.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Checkout runs in **demo mode** until Razorpay keys are configured — the full flow works end to end, no card is charged.

## Razorpay

Copy `.env.example` to `.env.local` and add your keys from the
[Razorpay dashboard](https://dashboard.razorpay.com/app/keys):

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
```

| Route | Does |
| --- | --- |
| `POST /api/razorpay/order` | Recomputes the order total **server-side from the catalog** and creates a Razorpay order. Client-sent prices are ignored, so a tampered cart cannot change what is charged. |
| `POST /api/razorpay/verify` | Verifies the returned `razorpay_signature` with an HMAC-SHA256 timing-safe comparison before the order is treated as paid. |

With no keys present both routes return `demo: true`, the checkout completes without opening the gateway, and the confirmation page says so.

## Content (CMS)

All content lives in plain TypeScript under [src/data/](src/data/) — no database, no CMS account. Edit a file, save, done.

| File | Holds |
| --- | --- |
| [products.ts](src/data/products.ts) | The 24-product catalog: pricing, variants, highlights, specs, stock, ratings, art tokens |
| [taxonomy.ts](src/data/taxonomy.ts) | 6 categories, 18 subcategories, 8 occasions, plus lookup maps |
| [site.ts](src/data/site.ts) | Announcement bar, navigation and mega-menu, hero slides, USPs, testimonials, journal, footer, shipping methods, coupons, tax rate |

Prices are integers in **paise** so money math never touches floating point; they are formatted once at the edge in [money.ts](src/lib/money.ts).

Banner, category and promo photography are placeholders from Unsplash, declared in [site.ts](src/data/site.ts) and [taxonomy.ts](src/data/taxonomy.ts) and served through `next/image` (allow-listed in [next.config.ts](next.config.ts)). They are desaturated and violet-scrimmed so stock colour cannot break the theme — swap the URLs for your own CDN when real assets land.

Product imagery is **generated** from each product's `art` tokens (gradient, pattern, motif) by [ProductArt.tsx](src/components/ui/ProductArt.tsx), so the catalog ships with no binary assets and no layout shift. Swap that one component for `next/image` when real photography arrives.

## Design language

Sections alternate deliberately between **card grids** (products, categories, recipients — where a bounded tile helps scanning) and **continuous editorial flows** ([Editorial.tsx](src/components/home/Editorial.tsx)): the USP line, the numbered occasion index with a cursor-following preview, a single rotating pull-quote, the statement band and the journal reading list all run as one flow with hairline rules instead of boxes.


Classic and near-monochrome: a soft lilac base with **one accent hue — lavender**, carried through gradients rather than flat fills. Every colour in the app resolves to that single scale, defined in [globals.css](src/app/globals.css):

```css
--color-accent-600: #7a5ad6;   /* the theme colour — change this one token */
```

Three gradient utilities do the heavy lifting: `gradient-accent` (primary buttons), `gradient-surface` (page bands) and `gradient-ink` (announcement bar, occasions block, footer). The page itself sits on a fixed lilac gradient.

- **Type** — Playfair Display for all display headings (`h1`–`h3`), Geist for UI and body.
- **Shape** — squared edges and hairline rules; radii are near-zero, pills are reserved for true circles.
- **Icons** — no emoji anywhere. The CMS stores icon *keys* (`gift`, `candle`, `ring`), resolved through one registry ([Motif.tsx](src/components/ui/Motif.tsx)) onto a monochrome Lucide outline set that inherits `currentColor`. Stars, wishlist hearts, checks, arrows and close controls are the same set.
- **Product art** — tonal lilac gradients with a fine pattern, one deep violet panel every seventh product for rhythm.

### Animation

Simple transitions only — no bounce, spin or spring. One easing curve is used everywhere:

```css
--ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
```

- Scroll reveals fade in and rise `3–5vh` over 900ms, staggered ([Reveal.tsx](src/components/ui/Reveal.tsx)). Every home block is wrapped: headings, product rails, category tiles, occasions, promo band, reviews and journal. They **re-arm every time a section returns to view**, using a pair of observers for hysteresis — the reveal plays once the block is properly on screen, but only resets after it has left the viewport completely, so nothing fades out while it is still being read. Pass `once` to opt a block out.
- The hero image settles out of a slow 7s zoom while slides cross-fade over 1.2s; the announcement bar cross-fades one line at a time
- Hover states are colour, border and 1px-scale transitions over 500ms, plus a `link-sweep` rule that draws in from the left
- The promo band's image drifts against the scroll ([useParallax.ts](src/lib/useParallax.ts)), and the makers strip is a continuous marquee that pauses on hover — both disabled under `prefers-reduced-motion`

## Fully fluid sizing

The design system in [globals.css](src/app/globals.css) replaces Tailwind's base tokens with `clamp()` values driven by `vw`:

```css
--spacing: clamp(0.2rem, 0.165rem + 0.175vw, 0.3rem);
--text-3xl: clamp(1.7rem, 1.43rem + 1.3vw, 2.5rem);
```

Because every Tailwind spacing utility derives from `--spacing`, `p-6`, `gap-8`, `size-10` and `text-xl` are all viewport-relative — layouts scale continuously between breakpoints instead of stepping. Sections use `vh` padding, containers use `min(92vw, …)`, and radii and shadows are fluid too. Verified at 390 px and 1440 px with zero horizontal overflow.

## Routes

| Route | Rendering | Notes |
| --- | --- | --- |
| `/` | Static | Full-bleed hero banner, USP line, category rail, product rails, shop-by-recipient, occasion index, parallax promo band, shop-by-budget, statement band, makers marquee, pull-quote, journal list |
| `/products` | Dynamic | PLP — category, subcategory, occasion, price, personalised, search, sort; all URL-driven |
| `/products/[slug]` | SSG (24 pages) | PDP — gallery, variants, quantity, gift note, add to bag, buy now, tabs, related rail |
| `/cart` | Static | Full bag, quantity, per-item gift notes, coupons |
| `/checkout` | Static | Details → Delivery → Payment, with validation |
| `/checkout/success` | Static | Order confirmation |

## Cart

State lives in a module-level external store read through `useSyncExternalStore` ([cart.tsx](src/lib/cart.tsx)), persisted to `localStorage`. This keeps the SSR snapshot empty and hydrates on the client without a `setState`-in-effect cascade. Coupons `GIFTY10`, `FESTIVE500` and `FIRSTGIFT` are wired up.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
