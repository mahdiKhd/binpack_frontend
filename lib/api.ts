import type { ApiErrorEnvelope } from "@/types/api";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/notifications/";

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = "api_error",
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return typeof window === "undefined" ? null : sessionStorage.getItem("packlab.refresh");
}

export function setTokens(access: string, refresh?: string) {
  accessToken = access;
  if (typeof window !== "undefined" && refresh) sessionStorage.setItem("packlab.refresh", refresh);
}

export function clearTokens() {
  accessToken = null;
  if (typeof window !== "undefined") sessionStorage.removeItem("packlab.refresh");
}

export function hasRefreshToken() {
  return typeof window !== "undefined" && Boolean(sessionStorage.getItem("packlab.refresh"));
}

async function parseError(response: Response) {
  let payload: ApiErrorEnvelope = {};
  try {
    payload = await response.json();
  } catch {
    // A proxy or server can return a non-JSON error page.
  }
  return new ApiError(
    payload.error?.message ?? `Request failed (${response.status}).`,
    response.status,
    payload.error?.code,
    payload.error?.details,
  );
}

async function refreshAccessToken() {
  if (typeof window === "undefined") return null;
  const refresh = sessionStorage.getItem("packlab.refresh");
  if (!refresh) return null;
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then(async (response) => {
        if (!response.ok) throw await parseError(response);
        const tokens = (await response.json()) as { access: string; refresh?: string };
        setTokens(tokens.access, tokens.refresh);
        return tokens.access;
      })
      .catch(() => {
        clearTokens();
        window.dispatchEvent(new Event("packlab:auth-expired"));
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && hasRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, init, false);
  }
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function publicApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function jsonBody(value: unknown): Pick<RequestInit, "body"> {
  return { body: JSON.stringify(value) };
}
