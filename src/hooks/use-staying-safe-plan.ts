"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  SafePlanOverview,
  SafePlanAnalysis,
} from "@/lib/staying-safe-plan/staying-safe-plan-engine";
import type { StayingSafePlan } from "@/lib/staying-safe-plan/types";

/** Whole-home Staying Safe Plan overview + alerts. */
export function useStayingSafePlanOverview() {
  return useQuery({
    queryKey: ["staying-safe-plan", "overview"],
    queryFn: async () => (await api.get<{ data: SafePlanOverview }>(`/staying-safe-plan`)).data,
  });
}

export interface ChildSafePlan {
  childId: string;
  childName: string;
  plan: StayingSafePlan | null;
  analysis: SafePlanAnalysis | null;
}

/** A single child's Staying Safe Plan + analysis (or null if none yet). */
export function useChildStayingSafePlan(childId: string | undefined) {
  return useQuery({
    queryKey: ["staying-safe-plan", "child", childId],
    enabled: !!childId,
    queryFn: async () =>
      (await api.get<{ data: ChildSafePlan }>(`/staying-safe-plan?child_id=${encodeURIComponent(childId!)}`)).data,
  });
}

export function useCreateStayingSafePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { child_id: string } & Partial<StayingSafePlan>) =>
      (await api.post<{ data: { plan: StayingSafePlan; analysis: SafePlanAnalysis } }>(`/staying-safe-plan`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staying-safe-plan"] }),
  });
}

export function useUpdateStayingSafePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; approve?: boolean } & Partial<StayingSafePlan>) =>
      (await api.patch<{ data: { plan: StayingSafePlan; analysis: SafePlanAnalysis } }>(`/staying-safe-plan`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staying-safe-plan"] }),
  });
}
