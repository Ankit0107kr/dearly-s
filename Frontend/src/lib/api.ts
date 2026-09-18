import { beginApiLoading, endApiLoading } from '@/lib/api-loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  beginApiLoading();
  try {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    });

    let payload: ApiResponse<T>;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error(response.ok ? 'Invalid response' : 'Request failed');
    }

    if (!response.ok) {
      throw new Error(payload.message || 'Request failed');
    }
    return payload;
  } finally {
    endApiLoading();
  }
}

export const authApi = {
  register: (body: Record<string, string>) =>
    apiRequest<{ user: unknown }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: Record<string, string>) =>
    apiRequest<{ user: unknown }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest<{ user: unknown }>('/auth/me'),
};

export const catalogApi = {
  products: (query = '') => apiRequest(`/products${query ? `?${query}` : ''}`),
  productBySlug: (slug: string) => apiRequest(`/products/slug/${slug}`),
  featured: () => apiRequest('/products/featured'),
  categories: () => apiRequest('/categories/tree'),
};

export type AdminCategory = {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: { _id: string; name: string; slug: string } | string | null;
};

export const adminApi = {
  categories: () =>
    apiRequest<{ categories: AdminCategory[] }>('/admin/categories'),
  products: (query = '') =>
    apiRequest<{ items: unknown[]; pagination?: unknown }>(
      `/admin/products${query ? `?${query}` : ''}`
    ),
  createProduct: (formData: FormData) =>
    apiRequest<{ product: unknown }>('/admin/products', {
      method: 'POST',
      body: formData,
    }),
  deleteProduct: (id: string) =>
    apiRequest(`/admin/products/${id}`, { method: 'DELETE' }),
};

export { API_BASE_URL };
