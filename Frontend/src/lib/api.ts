import { API_PATHS, withQuery } from "@/lib/api-config";
import { apiDelete, apiGet, apiPost, serverGet } from "@/lib/api-http";

export type { ApiResponse } from "@/lib/api-http";
export { API_BASE_URL, API_PATHS, withQuery } from "@/lib/api-config";
export { apiFetch, apiGet, apiPost, apiPatch, apiDelete, serverGet } from "@/lib/api-http";

export const authApi = {
  register: (body: Record<string, string>) =>
    apiPost<{ user: unknown }>(API_PATHS.auth.register, JSON.stringify(body)),
  login: (body: Record<string, string>) =>
    apiPost<{ user: unknown }>(API_PATHS.auth.login, JSON.stringify(body)),
  logout: () => apiPost(API_PATHS.auth.logout),
  me: () => apiGet<{ user: unknown }>(API_PATHS.auth.me),
};

export const catalogApi = {
  products: (query = "") =>
    apiGet(withQuery(API_PATHS.products.list, query)),
  productBySlug: (slug: string) =>
    apiGet(API_PATHS.products.slug(slug)),
  featured: () => apiGet(API_PATHS.products.featured),
  categories: () => apiGet(API_PATHS.categories.tree),
};

/** Server Components (same routes as `catalogApi`). */
export const catalogServer = {
  products: <T>(query: string) => serverGet<T>(withQuery(API_PATHS.products.list, query)),
  categories: <T>() => serverGet<T>(API_PATHS.categories.tree),
};

export type AdminCategory = {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: { _id: string; name: string; slug: string } | string | null;
};

export const adminApi = {
  categories: () =>
    apiGet<{ categories: AdminCategory[] }>(API_PATHS.admin.categories),
  products: (query = "") =>
    apiGet<{ items: unknown[]; pagination?: unknown }>(
      withQuery(API_PATHS.admin.products, query),
    ),
  createProduct: (formData: FormData) =>
    apiPost<{ product: unknown }>(API_PATHS.admin.products, formData),
  deleteProduct: (id: string) => apiDelete(API_PATHS.admin.product(id)),
};
