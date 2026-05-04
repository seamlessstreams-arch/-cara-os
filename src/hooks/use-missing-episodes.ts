"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — USE MISSING EPISODES HOOK
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { MissingEpisode } from "@/types/extended";

type ListResponse<T> = {
  data: T[];
  meta: {
    total: number;
    active: number;
    this_month: number;
    this_year: number;
    contextual_risk: number;
    unresolved: number;
  };
  pattern_analysis: PatternAnalysis[];
};
type SingleResponse<T> = { data: T };

export interface PatternAnalysis {
  child_id: string;
  child_name: string;
  total_episodes: number;
  avg_duration_hours: number;
  highest_risk: string;
  contextual_risk: boolean;
  return_interview_outstanding: boolean;
  last_episode_date: string | null;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useMissingEpisodes(params: {
  homeId?: string;
  childId?: string;
  status?: "all" | "active" | "closed";
}) {
  const qs = new URLSearchParams();
  if (params.childId) qs.set("child_id", params.childId);
  if (params.status && params.status !== "all") qs.set("status", params.status);

  return useQuery({
    queryKey: ["missing-episodes", params],
    queryFn: () =>
      api.get<ListResponse<MissingEpisode>>(`/missing-episodes?${qs.toString()}`),
  });
}

export function useMissingEpisode(id: string) {
  return useQuery({
    queryKey: ["missing-episodes", id],
    queryFn: () => api.get<SingleResponse<MissingEpisode>>(`/missing-episodes/${id}`),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateMissingEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MissingEpisode>) =>
      api.post<SingleResponse<MissingEpisode>>("/missing-episodes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-episodes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["sidebar-counts"] });
    },
  });
}

export function useUpdateMissingEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MissingEpisode>) =>
      api.patch<SingleResponse<MissingEpisode>>(`/missing-episodes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-episodes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
