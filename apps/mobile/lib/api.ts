import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, RevalidateResponse, LobbyListResponse } from "@jetlag/shared-types";
import { getApiBaseUrl, getToken } from "./storage";

// Default API base URL - can be overridden via storage
const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";

export type ApiRequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  apiBaseUrl?: string;
};

export async function apiRequest<T = unknown>(options: ApiRequestOptions): Promise<T> {
  const { method, path, body, headers, apiBaseUrl } = options;
  const storedBaseUrl = await getApiBaseUrl();
  const baseUrl = apiBaseUrl || storedBaseUrl || DEFAULT_API_BASE;
  const url = new URL(path, baseUrl).toString();

  const token = await getToken();
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("Authentication failed. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(
      typeof parsed === "string" && parsed.length > 0
        ? parsed
        : (parsed as { message?: string })?.message || `Request failed (${response.status})`,
    );
  }

  return parsed as T;
}

// Auth API methods
export async function login(data: LoginRequest, apiBaseUrl?: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>({
    method: "POST",
    path: "/api/auth/login",
    body: data,
    apiBaseUrl,
  });
}

export async function register(data: RegisterRequest, apiBaseUrl?: string): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>({
    method: "POST",
    path: "/api/auth/register",
    body: data,
    apiBaseUrl,
  });
}

export async function revalidate(apiBaseUrl?: string): Promise<RevalidateResponse> {
  return apiRequest<RevalidateResponse>({
    method: "POST",
    path: "/api/auth/revalidate",
    apiBaseUrl,
  });
}

// Lobby API methods
export async function getLobbyList(apiBaseUrl?: string): Promise<LobbyListResponse> {
  return apiRequest<LobbyListResponse>({
    method: "POST",
    path: "/api/lobby/list",
    apiBaseUrl,
  });
}
