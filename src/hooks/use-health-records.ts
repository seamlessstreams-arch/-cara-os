"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";

export interface HealthRecord {
  id: string;
  child_id: string;
  record_type: "appointment" | "assessment" | "immunisation" | "allergy" | "action_plan" | "medication_change";
  title: string;
  date: string;
  provider?: string;
  outcome?: string;
  follow_up_date?: string;
  notes?: string;
  staff_id: string;
  status: "scheduled" | "completed" | "cancelled" | "overdue";
  home_id?: string;
  created_at?: string;
}

type ListResponse = { data: HealthRecord[]; meta: { total: number; overdue: number; upcoming_7d: number } };
type SingleResponse = { data: HealthRecord };

export function useHealthRecords(params?: { childId?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  if (params?.type) qs.set("type", params.type);
  return useQuery({
    queryKey: ["health-records", params],
    queryFn: () => api.get<ListResponse>(`/health-records?${qs.toString()}`),
  });
}

export function useCreateHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthRecord>) =>
      api.post<SingleResponse>("/health-records", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-records"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<HealthRecord>) =>
      api.patch<SingleResponse>(`/health-records/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-records"] });
    },
  });
}
