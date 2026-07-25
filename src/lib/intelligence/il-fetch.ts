/**
 * Intelligence Layer Base Fetch Utility
 * Used by intelligence hooks for API communication with /api/intelligence/* endpoints
 */

const BASE = "/api/intelligence";

export async function ilFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}
