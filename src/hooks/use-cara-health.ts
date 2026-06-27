"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useCaraHealth — client hook for Cara diagnostics
//
// Fetches from GET /api/v1/cara/health.
// Results are stale after 5 minutes; refetch manually for deep tests.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Re-export types that the UI needs (client-safe — they contain no server code)
export type CaraOverallStatus =
  | "full_capacity"
  | "partial"
  | "not_configured"
  | "degraded"
  | "error";

export type ProviderTestStatus = "ok" | "failed" | "skipped" | "not_configured";

export interface ProviderHealth {
  configured: boolean;
  keyEnvVar: string;
  testCallStatus: ProviderTestStatus;
  latencyMs?: number;
  model?: string;
  errorMessage?: string;
  lastUsedAt?: string;
  requestsToday?: number;
}

export interface PersistenceHealth {
  connected: boolean;
  tablesPresent: boolean;
  missingTables: string[];
  errorMessage?: string;
  lastWriteAt?: string;
}

export interface AuditHealth {
  writable: boolean;
  lastEventAt?: string;
  totalEventsToday?: number;
  errorMessage?: string;
}

export interface ApprovalHealth {
  pendingCount: number;
  oldestPendingAt?: string;
  overdueCount: number;
  recentRejectionCount: number;
}

export interface CommandRegistryHealth {
  totalCommands: number;
  commandsByModule: Record<string, number>;
  hasGeneralCommands: boolean;
}

export interface ModuleCoverageHealth {
  totalModules: number;
  modulesWithCommands: number;
  coveragePercent: number;
  modulesWithoutDedicatedCommands: string[];
}

export interface CaraHealthStatus {
  overallStatus: CaraOverallStatus;
  anthropic: ProviderHealth;
  supabase: PersistenceHealth;
  audit: AuditHealth;
  approvals: ApprovalHealth;
  commandRegistry: CommandRegistryHealth;
  moduleCoverage: ModuleCoverageHealth;
  lastGeneratedAt?: string;
  lastFailedAt?: string;
  failedPersistenceCount?: number;
  lastCheckedAt: string;
  recommendations: string[];
}

const QUERY_KEY = ["cara", "health"] as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchCaraHealth(deep = false): Promise<CaraHealthStatus> {
  const url = `/api/v1/cara/health${deep ? "?deep=true" : ""}`;
  const res = await fetch(url, {
    headers: {
      // These headers are populated from the auth context in the UI wrapper.
      // The component must pass them or the route returns 403.
      // Read the cara_* keys; fall back to the legacy cara_* keys for any
      // session that set them before the rename (graceful, transient).
      "x-cara-role": sessionStorage.getItem("cara_role") ?? sessionStorage.getItem("cara_role") ?? "",
      "x-cara-user-id": sessionStorage.getItem("cara_user_id") ?? sessionStorage.getItem("cara_user_id") ?? "",
    },
    cache: "no-store",
  });

  if (res.status === 403) {
    throw new Error("Access denied: insufficient role for Cara health diagnostics");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Health check failed" }));
    throw new Error(err.error ?? `Health check failed with status ${res.status}`);
  }

  return res.json() as Promise<CaraHealthStatus>;
}

export function useCaraHealth(role?: string, userId?: string) {
  // Store credentials so the fetch helper can read them
  if (typeof window !== "undefined" && role && userId) {
    sessionStorage.setItem("cara_role", role);
    sessionStorage.setItem("cara_user_id", userId);
  }

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchCaraHealth(false),
    staleTime: STALE_TIME,
    retry: 1,
    // Don't auto-fetch if we clearly don't have auth
    enabled: Boolean(role && userId),
  });
}

export function useCaraHealthDeepTest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => fetchCaraHealth(true),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
    },
  });
}
