# Dearly's Backend

Production-oriented Express + MongoDB API for the Dearly's gifting platform.

## Quick start

```bash
cd Backend
cp .env.example .env
# Set MONGODB_URI / MONGO_URI, JWT_SECRET, CLOUDINARY_URL (or CLOUDINARY_*), Razorpay keys, PORT
npm install
npm run seed
npm run dev     # nodemon — restarts on file changes
npm test        # vitest against an in-memory replica set
```

Upgrading an existing database? Run `npm run migrate:money` once — money moved from
BSON doubles to `Decimal128`. The script is idempotent.

`npm run seed` is idempotent too: it upserts the full demo catalogue from
`scripts/seed-data.json` (6 categories, 18 subcategories, 8 occasions, 24 products with
variants, customisation fields, specs and highlights, plus 5 banners), backfills
`kind` and `effectivePrice` on older rows, and creates the admin user. Variant `_id`s are
preserved across re-seeds so live carts keep their selection.

- Health: `GET /health`
- Base path: `/api/v1`
- Cookies: send `credentials: 'include'` from the browser

**Postman:** import `postman/Dearlys-API.postman_collection.json` and `postman/Dearlys-Local.postman_environment.json`.

## Seeded admin (after `npm run seed`)

- Email: `admin@dearlys.com`
- Password: `Admin@12345`

Change this password immediately in production.

## Cloudinary

Set either:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

or individual `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Admin image upload: `POST /api/v1/admin/uploads` (multipart field `image`, max 5MB).

Product create/update can upload images in the same request: `POST|PATCH /api/v1/admin/products` with multipart field `images` (up to 10 files).

## Razorpay

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

- `POST /api/v1/payments/create` — create a Razorpay order for an existing app order
- `POST /api/v1/payments/verify` — HMAC signature verification (server-side only)
- `POST /api/v1/payments/webhook` — raw-body webhook (configure in the Razorpay dashboard)

Orders can be created without Razorpay keys; payment stays `PENDING` until keys are added.

### Checkout flow

```
browser                         server
  |  POST /cart/items  (productId, variantId, quantity — never a price)
  |  POST /orders      (addressId, deliveryType, couponCode)
  |                    + Idempotency-Key header
  |                          -> prices the cart, reserves stock, creates the
  |                             order in a transaction, returns a payment intent
  |  Razorpay modal    (keyId + razorpayOrderId from that intent)
  |  POST /payments/verify   -> checks the HMAC, marks the order paid,
  |                             reduces stock, emails confirmation
```

The browser never sends an amount. Totals are computed from the server's own
catalogue, so a tampered cart cannot change what is charged. The publishable
`keyId` reaches the client only in the `/payments/create` response; the secret
never leaves the server.

Set the webhook in the Razorpay dashboard to `POST <api>/payments/webhook` for
`payment.captured` and `payment.failed`. It is idempotent: a retried delivery
racing the client's verify collides on the unique `providerOrderId` instead of
capturing twice. `payment.failed` releases the reserved stock.

### Pricing

One rule set, applied server-side and mirrored in the storefront only so the cart
preview matches the charge:

| | |
|---|---|
| Delivery | Standard ₹99 · Express ₹199 · Scheduled/Same-day ₹349 |
| Free delivery | on goods value (after coupon) of ₹1,499 or more |
| Tax | 18% on the discounted goods value, not on delivery |
| Total | `(subtotal − discount) + delivery + tax` |

### Refunds

Cancelling a paid order — by the customer or through the admin status route —
restores stock, releases any coupon redemption and calls the Razorpay refund API
**after** the transaction commits. A gateway failure there leaves the order
refunded with the money unmoved, so it is logged at error level with the order id
for manual follow-up rather than silently swallowed.

## API overview

All JSON responses: `{ "success": boolean, "message": string, "data"?: object, "error"?: ... }`.

Auth uses HTTP-only cookie `access_token` (set by register/login).

### Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| POST | `/auth/logout` | Yes |
| GET | `/auth/me` | Yes |

### Users

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/me` | Yes |
| PATCH | `/users/me` | Yes |
| GET | `/users/me/addresses` | Yes |
| POST | `/users/me/addresses` | Yes |
| PATCH | `/users/me/addresses/:id` | Yes |
| PATCH | `/users/me/addresses/:id/default` | Yes |
| DELETE | `/users/me/addresses/:id` | Yes |

Address body fields: `fullName`, `phone`, `addressLine1`, `addressLine2`, `landmark`, `city`, `state`, `country`, `postalCode`, `addressType` (`HOME`|`WORK`|`OTHER`), `isDefault`.

- First address for a user is saved as **default** automatically.
- Setting `isDefault: true` clears default on other addresses.
- Deleting the default promotes the newest remaining address.

The same address operations are available under `/addresses` (alias paths).

### Catalog

| Method | Path |
|--------|------|
| GET | `/categories` — query: `kind` (`CATEGORY`\|`OCCASION`), `includeInactive` |
| GET | `/categories/tree` — nested categories only; occasions are excluded |
| GET | `/occasions` — the occasion taxonomy (birthday, diwali, corporate, …) |
| GET | `/banners` — query: `placement` (`HOME_HERO`\|`HOME_PROMO`\|`PLP_TOP`) |
| GET | `/products` — query: `page`, `limit`, `search`, `category`, `subCategory`, `occasion`, `tags`, `personalised`, `onSale`, `minPrice`, `maxPrice`, `rating`, `featured`, `sort` (`price_asc`, `price_desc`, `rating_desc`, `newest`) |
| GET | `/products/featured` |
| GET | `/products/slug/:slug` |
| GET | `/products/category/:categoryId` |
| GET | `/products/:id` |
| GET | `/products/:productId/reviews` |
| POST | `/products/:productId/reviews` (auth) |

### Customer (auth required unless noted)

**Cart:** `GET|DELETE /cart`, `POST /cart/items`, `PATCH|DELETE /cart/items/:itemId`

**Wishlist:** `GET /wishlist`, `POST|DELETE /wishlist/:productId`

**Orders:**

| Method | Path | Body |
|--------|------|------|
| POST | `/orders` | `addressId` (required), `couponCode`, `deliveryType`, `deliveryDate`, `deliverySlot` |
| GET | `/orders` | |
| GET | `/orders/:id` | |
| PATCH | `/orders/:id/cancel` | |

`addressId` must belong to the authenticated user. Order is built from the **server cart**.

- Send an `Idempotency-Key` header on `POST /orders`; a repeat with the same key returns
  the original order (`data.replayed: true`) instead of placing a second one.
- Each order gets a customer-facing `orderNumber` (`DRL-000123`) and a `statusHistory[]`
  of `{status, at, by, note}` appended on every transition.
- Checkout reserves stock for 30 minutes. An order that isn't paid in that window is
  swept every 5 minutes: stock and any coupon redemption are released and the order
  moves to `FAILED`.
- A coupon can be used once per customer; cancelling or letting the order expire
  returns it.

**Coupons:** `POST /coupons/validate` (auth) — body is `{ "code": "..." }`; the cart and
its eligible subtotal are read server-side, so the client cannot propose a total.

**Reviews:** `PATCH|DELETE /reviews/:id`

`category`, `subCategory` and `occasion` accept **either an ObjectId or a slug**, so a client
can filter straight from the URL without first fetching the taxonomy. A slug that matches
nothing returns an empty page rather than silently dropping the filter. Filtering by a parent
category also matches products filed only under one of its subcategories.

`minPrice`/`maxPrice` and the price sorts read `effectivePrice` — `discountPrice` when the
product is on offer, otherwise `price` — so a discounted item sorts and filters by what the
customer actually pays. It is maintained by the model, never written by a client.

### Taxonomy

Categories and occasions share the `categories` collection, separated by `kind`. A
subcategory is simply a category with a `parentCategory`. Presentation fields (`blurb`,
`note`, `window`, `motif`, `accent`, `image`, `sortOrder`) drive the storefront rails.

### Admin

`GET /admin/dashboard`, `GET /admin/users`, `POST /admin/uploads`

**Categories:** `GET /admin/categories?includeInactive=true`, `POST /admin/categories`, `PATCH /admin/categories/:id`, `DELETE /admin/categories/:id`

**Products:** `GET /admin/products`, `POST /admin/products` (JSON or multipart + `images`), `PATCH /admin/products/:id`, `DELETE /admin/products/:id` (soft deactivate)

**Coupons / orders:** CRUD under `/admin/coupons`, `GET /admin/orders`, `PATCH /admin/orders/:id/status`

`PATCH /admin/orders/:id/status` takes `{ orderStatus, note? }` and is checked against the
transition table in `src/utils/constants.js` — an order cannot skip payment, and moving one
to `CANCELLED`/`REFUNDED` runs the same stock and refund side effects as a customer
cancellation.

**Reviews:** `GET /admin/reviews?isApproved=false`, `PATCH /admin/reviews/:id` with
`{ isApproved }`. Hiding a review recalculates the product rating.

**Banners:** `GET|POST /admin/banners`, `PATCH|DELETE /admin/banners/:id`. Banners carry an
optional `startsAt`/`endsAt` window; the public route only returns those currently live.

## Frontend

Set in `Frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

Use `Frontend/src/lib/api.ts` (`authApi`, `userApi`, `orderApi`, `catalogApi`, etc.) with cookies via `credentials: 'include'`.

## Architecture

Routes → middlewares → controllers → services → models → MongoDB

Business rules enforced server-side: pricing, discounts, inventory, payments, coupon validation, and order snapshots.

**Money** is stored as `Decimal128` and computed through `src/utils/money.js` — every
derived amount is rounded to 2dp before it is stored, and the Razorpay amount is built
from the stored value. The API still serialises money as plain rupee numbers, so clients
are unaffected.

**Concurrency** — checkout, cancellation, payment capture and the reservation sweep all run
in MongoDB transactions, so the server needs a replica set (Atlas provides one).
Coupon limits are enforced in the same write that increments them, and
`Payment.providerOrderId` is unique so a retried webhook cannot double-capture.

**Rate limits** — 600 requests / 15 min across `/api/v1`, 30 on `/auth`, 60 on order
creation, coupon validation and admin uploads.
