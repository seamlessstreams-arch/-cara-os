"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RiskAssessment } from "@/types/extended";

interface RAResponse {
  data: RiskAssessment[];
  meta: { total: number; current: number; high_very_high: number; overdue_reviews: number };
}

export function useRiskAssessments(params?: { childId?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  return useQuery({
    queryKey: ["risk-assessments", params?.childId],
    queryFn: () => api.get<RAResponse>(`/risk-assessments?${qs.toString()}`),
    staleTime: 30_000,
  });
}

export function useCreateRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiskAssessment>) => api.post<{ data: RiskAssessment }>("/risk-assessments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["risk-assessments"] }),
  });
}

export function useUpdateRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<RiskAssessment>) => api.patch<{ data: RiskAssessment }>("/risk-assessments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["risk-assessments"] }),
  });
}
