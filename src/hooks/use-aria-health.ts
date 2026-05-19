"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useAriaHealth — client hook for ARIA diagnostics
//
// Fetches from GET /api/v1/aria/health.
// Results are stale after 5 minutes; refetch manually for deep tests.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Re-export types that the UI needs (client-safe — they contain no server code)
export type AriaOverallStatus =
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

export interface AriaHealthStatus {
  overallStatus: AriaOverallStatus;
  openai: ProviderHealth;
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

const QUERY_KEY = ["aria", "health"] as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchAriaHealth(deep = false): Promise<AriaHealthStatus> {
  const url = `/api/v1/aria/health${deep ? "?deep=true" : ""}`;
  const res = await fetch(url, {
    headers: {
      // These headers are populated from the auth context in the UI wrapper.
      // The component must pass them or the route returns 403.
      "x-aria-role": sessionStorage.getItem("aria_role") ?? "",
      "x-aria-user-id": sessionStorage.getItem("aria_user_id") ?? "",
    },
    cache: "no-store",
  });

  if (res.status === 403) {
    throw new Error("Access denied: insufficient role for ARIA health diagnostics");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Health check failed" }));
    throw new Error(err.error ?? `Health check failed with status ${res.status}`);
  }

  return res.json() as Promise<AriaHealthStatus>;
}

export function useAriaHealth(role?: string, userId?: string) {
  // Store credentials so the fetch helper can read them
  if (typeof window !== "undefined" && role && userId) {
    sessionStorage.setItem("aria_role", role);
    sessionStorage.setItem("aria_user_id", userId);
  }

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchAriaHealth(false),
    staleTime: STALE_TIME,
    retry: 1,
    // Don't auto-fetch if we clearly don't have auth
    enabled: Boolean(role && userId),
  });
}

export function useAriaHealthDeepTest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => fetchAriaHealth(true),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
    },
  });
}
