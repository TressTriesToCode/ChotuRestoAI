const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("chotu_auth_token", token);
    } else {
      localStorage.removeItem("chotu_auth_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("chotu_auth_token");
  }
  return null;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ msg?: string; loc?: string[] }>;
  message?: string;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (typeof errData.detail === "string") {
        errorMessage = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        errorMessage = errData.detail[0].msg || JSON.stringify(errData.detail);
      } else if (errData.message) {
        errorMessage = errData.message;
      }
    } catch {
      // Body is not json
    }
    throw new Error(errorMessage);
  }

  // Handle empty 204 or non-json responses
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  return data as T;
}
