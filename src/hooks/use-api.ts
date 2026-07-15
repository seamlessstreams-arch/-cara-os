"use client";
import { currentUserId } from "@/lib/auth/current-user";

// Base API client — all hooks use this
const BASE = "/api/v1";

/** Identity header from the demo session (localStorage). Server routes that need
 *  the acting user (e.g. Comms Centre access control) read `x-user-id`. */
function userHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return { "x-user-id": currentUserId() };
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...userHeader(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
