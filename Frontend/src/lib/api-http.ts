import { API_BASE_URL } from "@/lib/api-config";
import { beginApiLoading, endApiLoading } from "@/lib/api-loading";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

type ApiFetchOptions = RequestInit & {
  /** Client: cookies + loading bar. Server: ISR, no loading bar. */
  context?: "client" | "server";
  revalidate?: number;
};

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(response.ok ? "Invalid response" : "Request failed");
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const { context = "client", revalidate = 30, ...init } = options;
  const isClient = context === "client";
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (isClient) beginApiLoading();
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: isClient ? "include" : init.credentials,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(init.headers || {}),
      },
      ...(isClient ? {} : { next: { revalidate } }),
    });

    const payload = await readApiResponse<T>(response);
    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }
    return payload;
  } finally {
    if (isClient) endApiLoading();
  }
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: BodyInit | null) {
  return apiFetch<T>(path, { method: "POST", body });
}

export function apiPatch<T>(path: string, body?: BodyInit | null) {
  return apiFetch<T>(path, { method: "PATCH", body });
}

export function apiDelete<T>(path: string) {
  return apiFetch<T>(path, { method: "DELETE" });
}

export function serverGet<T>(path: string, revalidate = 30) {
  return apiFetch<T>(path, { method: "GET", context: "server", revalidate });
}
