"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  AriaSafeguardingPattern,
  AriaEarlyWarning,
} from "@/types/aria-studio";

interface PatternListResponse {
  data: AriaSafeguardingPattern[];
  meta: { total: number; open: number; critical: number; high: number };
}

interface WarningListResponse {
  data: AriaEarlyWarning[];
  meta: { total: number; active: number; critical: number };
}

interface ScanResponse {
  data: {
    patterns: AriaSafeguardingPattern[];
    warnings: AriaEarlyWarning[];
    inspected: {
      incidents: number;
      missing: number;
      restraints: number;
      window_start: string;
      window_end: string;
    };
  };
}

export function useSafeguardingPatterns(homeId?: string, status?: string) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (status) search.set("status", status);
  const qs = search.toString();
  return useQuery({
    queryKey: ["aria-safeguarding-patterns", homeId ?? null, status ?? null],
    queryFn: () =>
      api.get<PatternListResponse>(
        `/api/v1/aria-studio/safeguarding-patterns${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

export function useEarlyWarnings(homeId?: string, status?: string) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (status) search.set("status", status);
  const qs = search.toString();
  return useQuery({
    queryKey: ["aria-early-warnings", homeId ?? null, status ?? null],
    queryFn: () =>
      api.get<WarningListResponse>(
        `/api/v1/aria-studio/early-warnings${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

interface ScanInput {
  home_id?: string;
  lookback_days?: number;
  as_of?: string;
  actor_id?: string;
  actor_role?: string;
}

export function useRunSafeguardingScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ScanInput) =>
      api.post<ScanResponse>("/api/v1/aria-studio/safeguarding-patterns", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-safeguarding-patterns"] });
      qc.invalidateQueries({ queryKey: ["aria-early-warnings"] });
    },
  });
}

interface PatternUpdateInput {
  id: string;
  status: "open" | "acknowledged" | "actioned" | "dismissed";
  resolution_note?: string;
  actor_id?: string;
  actor_role?: string;
}

export function useUpdateSafeguardingPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatternUpdateInput) =>
      api.patch<{ data: AriaSafeguardingPattern }>(
        "/api/v1/aria-studio/safeguarding-patterns",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-safeguarding-patterns"] });
    },
  });
}

interface WarningUpdateInput {
  id: string;
  status: "active" | "acknowledged" | "escalated" | "closed";
  closure_note?: string;
  actor_id?: string;
  actor_role?: string;
}

export function useUpdateEarlyWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WarningUpdateInput) =>
      api.patch<{ data: AriaEarlyWarning }>(
        "/api/v1/aria-studio/early-warnings",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-early-warnings"] });
    },
  });
}
