"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  CaraSafeguardingPattern,
  CaraEarlyWarning,
} from "@/types/cara-studio";

interface PatternListResponse {
  data: CaraSafeguardingPattern[];
  meta: { total: number; open: number; critical: number; high: number };
}

interface WarningListResponse {
  data: CaraEarlyWarning[];
  meta: { total: number; active: number; critical: number };
}

interface ScanResponse {
  data: {
    patterns: CaraSafeguardingPattern[];
    warnings: CaraEarlyWarning[];
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
    queryKey: ["cara-safeguarding-patterns", homeId ?? null, status ?? null],
    queryFn: () =>
      api.get<PatternListResponse>(
        `/cara-studio/safeguarding-patterns${qs ? `?${qs}` : ""}`,
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
    queryKey: ["cara-early-warnings", homeId ?? null, status ?? null],
    queryFn: () =>
      api.get<WarningListResponse>(
        `/cara-studio/early-warnings${qs ? `?${qs}` : ""}`,
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
      api.post<ScanResponse>("/cara-studio/safeguarding-patterns", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-safeguarding-patterns"] });
      qc.invalidateQueries({ queryKey: ["cara-early-warnings"] });
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
      api.patch<{ data: CaraSafeguardingPattern }>(
        "/cara-studio/safeguarding-patterns",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-safeguarding-patterns"] });
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
      api.patch<{ data: CaraEarlyWarning }>(
        "/cara-studio/early-warnings",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-early-warnings"] });
    },
  });
}
