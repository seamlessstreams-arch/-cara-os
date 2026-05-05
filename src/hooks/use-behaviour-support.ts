"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";

export interface BehaviourSupportPlan {
  id: string;
  child_id: string;
  title: string;
  status: "draft" | "active" | "under_review" | "archived";
  created_date: string;
  review_date: string;
  triggers: string[];
  de_escalation_strategies: string[];
  positive_strategies: string[];
  safety_plan?: string;
  restrictive_interventions?: string;
  professional_input?: string;
  staff_id: string;
  approved_by?: string;
  home_id?: string;
  created_at?: string;
}

type ListResponse = { data: BehaviourSupportPlan[]; meta: { total: number; active: number; overdue_review: number } };
type SingleResponse = { data: BehaviourSupportPlan };

export function useBehaviourSupportPlans(params?: { childId?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  if (params?.status) qs.set("status", params.status);
  return useQuery({
    queryKey: ["behaviour-support-plans", params],
    queryFn: () => api.get<ListResponse>(`/behaviour-support-plans?${qs.toString()}`),
  });
}

export function useCreateBehaviourSupportPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BehaviourSupportPlan>) =>
      api.post<SingleResponse>("/behaviour-support-plans", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["behaviour-support-plans"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateBehaviourSupportPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<BehaviourSupportPlan>) =>
      api.patch<SingleResponse>(`/behaviour-support-plans/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["behaviour-support-plans"] });
    },
  });
}
