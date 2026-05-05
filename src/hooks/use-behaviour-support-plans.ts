"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { BehaviourSupportPlan } from "@/types/extended";

interface BSPResponse {
  data: BehaviourSupportPlan[];
  meta: { total: number; active: number; overdue_reviews: number };
}

export function useBehaviourSupportPlans(params?: { childId?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  return useQuery({
    queryKey: ["behaviour-support-plans", params?.childId],
    queryFn: () => api.get<BSPResponse>(`/behaviour-support-plans?${qs.toString()}`),
    staleTime: 30_000,
  });
}

export function useCreateBSP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BehaviourSupportPlan>) => api.post<{ data: BehaviourSupportPlan }>("/behaviour-support-plans", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["behaviour-support-plans"] }),
  });
}

export function useUpdateBSP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<BehaviourSupportPlan>) => api.patch<{ data: BehaviourSupportPlan }>("/behaviour-support-plans", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["behaviour-support-plans"] }),
  });
}
