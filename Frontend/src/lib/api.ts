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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
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

export { API_BASE_URL };
