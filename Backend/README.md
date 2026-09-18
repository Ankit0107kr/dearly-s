# Dearly's Backend

Production-oriented Express + MongoDB API for the Dearly's gifting platform.

## Quick start

```bash
cd Backend
cp .env.example .env
# Set MONGODB_URI / MONGO_URI, JWT_SECRET, CLOUDINARY_URL (or CLOUDINARY_*), Razorpay keys
npm install
npm run seed
npm run dev
```

- Health: `GET /health`
- Base path: `/api/v1`
- Cookies: send `credentials: 'include'` from the browser

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

Admin image upload: `POST /api/v1/admin/uploads` (multipart field `image`, admin cookie required).

## Razorpay

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

- `POST /api/v1/payments/create` — create Razorpay order for an existing app order
- `POST /api/v1/payments/verify` — signature verification (backend only)
- `POST /api/v1/payments/webhook` — raw body webhook (configure in Razorpay dashboard)

Orders can be created without Razorpay keys; payment stays `PENDING` until keys are added.

## API overview

### Auth
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`

### Catalog
- `GET /categories`, `GET /categories/tree`
- `GET /products` (pagination, search, filters, sort)
- `GET /products/featured`, `GET /products/slug/:slug`, `GET /products/:id`
- `GET /products/:productId/reviews`

### Customer (auth required)
- Cart: `GET|DELETE /cart`, `POST /cart/items`, `PATCH|DELETE /cart/items/:itemId`
- Wishlist: `GET /wishlist`, `POST|DELETE /wishlist/:productId`
- Addresses: CRUD `/addresses`
- Orders: `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel`
- Coupons: `POST /coupons/validate`
- Reviews: `POST /products/:productId/reviews`, `PATCH|DELETE /reviews/:id`

### Admin (admin role)
- `GET /admin/dashboard`, `GET /admin/users`
- `POST /admin/uploads`
- Categories / products / coupons CRUD under `/admin/...`
- `GET /admin/orders`, `PATCH /admin/orders/:id/status`

## Frontend

Set in `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Use `Frontend/src/lib/api.ts` for typed fetch helpers with cookies.

## Architecture

Routes → middlewares → controllers → services → models → MongoDB

Business rules enforced server-side: pricing, discounts, inventory, payments, coupon validation, and order snapshots.
