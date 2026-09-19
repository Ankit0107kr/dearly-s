# Dearly's Backend

Production-oriented Express + MongoDB API for the Dearly's gifting platform.

## Quick start

```bash
cd Backend
cp .env.example .env
# Set MONGODB_URI / MONGO_URI, JWT_SECRET, CLOUDINARY_URL (or CLOUDINARY_*), Razorpay keys, PORT
npm install
npm run seed
npm run dev    # nodemon — restarts on file changes
```

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

- `POST /api/v1/payments/create` — create Razorpay order for an existing app order
- `POST /api/v1/payments/verify` — signature verification (backend only)
- `POST /api/v1/payments/webhook` — raw body webhook (configure in Razorpay dashboard)

Orders can be created without Razorpay keys; payment stays `PENDING` until keys are added.

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
| GET | `/categories` |
| GET | `/categories/tree` |
| GET | `/products` — query: `page`, `limit`, `search`, `category`, `subCategory`, `minPrice`, `maxPrice`, `rating`, `featured`, `sort` (`price_asc`, `price_desc`, `rating_desc`, `newest`) |
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

**Coupons:** `POST /coupons/validate` (public)

**Reviews:** `PATCH|DELETE /reviews/:id`

### Admin

`GET /admin/dashboard`, `GET /admin/users`, `POST /admin/uploads`

**Categories:** `GET /admin/categories?includeInactive=true`, `POST /admin/categories`, `PATCH /admin/categories/:id`, `DELETE /admin/categories/:id`

**Products:** `GET /admin/products`, `POST /admin/products` (JSON or multipart + `images`), `PATCH /admin/products/:id`, `DELETE /admin/products/:id` (soft deactivate)

**Coupons / orders:** CRUD under `/admin/coupons`, `GET /admin/orders`, `PATCH /admin/orders/:id/status`

> Note: `authenticate` / `authorizeAdmin` may be commented out on admin routes during local dev — enable before production.

## Frontend

Set in `Frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

Use `Frontend/src/lib/api.ts` (`authApi`, `userApi`, `orderApi`, `catalogApi`, etc.) with cookies via `credentials: 'include'`.

## Architecture

Routes → middlewares → controllers → services → models → MongoDB

Business rules enforced server-side: pricing, discounts, inventory, payments, coupon validation, and order snapshots.
