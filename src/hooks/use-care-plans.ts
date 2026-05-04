"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { CarePlan } from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, number> };
type SingleResponse<T> = { data: T };

export function useCarePlans(params: { homeId: string }) {
  return useQuery({
    queryKey: ["care-plans", params.homeId],
    queryFn:  () =>
      api.get<ListResponse<CarePlan> & { meta: { total: number; attention_needed: number; lac_overdue: number } }>(
        `/care-plans?home_id=${params.homeId}`
      ),
  });
}

export function useCarePlan(id: string) {
  return useQuery({
    queryKey: ["care-plans", id],
    queryFn:  () => api.get<SingleResponse<CarePlan>>(`/care-plans/${id}`),
    enabled:  !!id,
  });
}

export function useCarePlanByChild(childId: string) {
  return useQuery({
    queryKey: ["care-plans", "child", childId],
    queryFn:  () => api.get<SingleResponse<CarePlan>>(`/care-plans?child_id=${childId}`),
    enabled:  !!childId,
  });
}

export function useUpdateCarePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CarePlan> }) =>
      api.patch<SingleResponse<CarePlan>>(`/care-plans/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care-plans"] });
    },
  });
}

export function useCreateCarePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CarePlan>) =>
      api.post<SingleResponse<CarePlan>>("/care-plans", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care-plans"] });
    },
  });
}
