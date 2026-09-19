/** Backend REST base (includes `/api/v1`). Override with `NEXT_PUBLIC_API_URL`. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1"
).trim();

/** Relative paths under `API_BASE_URL`. */
export const API_PATHS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  users: {
    me: "/users/me",
    addresses: "/users/me/addresses",
    address: (id: string) => `/users/me/addresses/${id}`,
    addressDefault: (id: string) => `/users/me/addresses/${id}/default`,
  },
  orders: {
    list: "/orders",
    create: "/orders",
    detail: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
  products: {
    list: "/products",
    featured: "/products/featured",
    slug: (slug: string) => `/products/slug/${slug}`,
  },
  categories: {
    tree: "/categories/tree",
  },
  admin: {
    dashboard: "/admin/dashboard",
    orders: "/admin/orders",
    orderStatus: (id: string) => `/admin/orders/${id}/status`,
    categories: "/admin/categories",
    products: "/admin/products",
    product: (id: string) => `/admin/products/${id}`,
    coupons: "/admin/coupons",
    coupon: (id: string) => `/admin/coupons/${id}`,
  },
} as const;

export function withQuery(path: string, query: string) {
  return query ? `${path}?${query}` : path;
}
