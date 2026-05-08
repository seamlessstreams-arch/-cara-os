"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "./use-api";
import type { HealthRecordEntry } from "@/types/extended";

export type { HealthRecordEntry };

type ListResponse = { data: HealthRecordEntry[]; meta: { total: number; overdue: number; upcoming_7d: number } };
type SingleResponse = { data: HealthRecordEntry };

export function useHealthRecords(params?: { childId?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  if (params?.type) qs.set("type", params.type);
  return useQuery({
    queryKey: ["health-records", params],
    queryFn: () => api.get<ListResponse>(`/health-records?${qs.toString()}`),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthRecordEntry>) =>
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
    mutationFn: ({ id, ...data }: { id: string } & Partial<HealthRecordEntry>) =>
      api.patch<SingleResponse>(`/health-records/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-records"] });
    },
  });
}
