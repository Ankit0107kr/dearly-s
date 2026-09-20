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

// Strict Mode mounts twice in dev, so identical in-flight GETs share one request.
// Nothing is kept once settled (no staleness); client-only, a server map leaks across users.
const inFlight = new Map<string, Promise<ApiResponse<unknown>>>();

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const { context = "client", revalidate = 30, ...init } = options;
  const isClient = context === "client";
  const method = (init.method || "GET").toUpperCase();

  if (isClient && method === "GET") {
    const shared = inFlight.get(path);
    if (shared) return shared as Promise<ApiResponse<T>>;

    const request = runFetch<T>(path, init, isClient, revalidate).finally(() => {
      inFlight.delete(path);
    });
    inFlight.set(path, request as Promise<ApiResponse<unknown>>);
    return request;
  }

  return runFetch<T>(path, init, isClient, revalidate);
}

async function runFetch<T>(
  path: string,
  init: RequestInit,
  isClient: boolean,
  revalidate: number,
): Promise<ApiResponse<T>> {
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
