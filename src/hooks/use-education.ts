"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";

export interface EducationRecord {
  id: string;
  child_id: string;
  record_type: "attendance" | "exclusion" | "pep_meeting" | "achievement" | "concern" | "placement_change";
  title: string;
  date: string;
  school?: string;
  details?: string;
  outcome?: string;
  follow_up_date?: string;
  staff_id: string;
  status: "open" | "resolved" | "monitoring";
  home_id?: string;
  created_at?: string;
}

type ListResponse = { data: EducationRecord[]; meta: { total: number; exclusions_term: number; attendance_pct: number } };
type SingleResponse = { data: EducationRecord };

export function useEducationRecords(params?: { childId?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  if (params?.type) qs.set("type", params.type);
  return useQuery({
    queryKey: ["education-records", params],
    queryFn: () => api.get<ListResponse>(`/education-records?${qs.toString()}`),
  });
}

export function useCreateEducationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EducationRecord>) =>
      api.post<SingleResponse>("/education-records", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["education-records"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateEducationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<EducationRecord>) =>
      api.patch<SingleResponse>(`/education-records/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["education-records"] });
    },
  });
}
