"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AdmissionReferral } from "@/types/extended";

export type { AdmissionReferral };

type ListResponse = { data: AdmissionReferral[]; meta: { total: number; active: number; placed_this_year: number } };
type SingleResponse = { data: AdmissionReferral };

export function useAdmissions(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  return useQuery({
    queryKey: ["admissions", params],
    queryFn: () => api.get<ListResponse>(`/admissions?${qs.toString()}`),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdmissionReferral>) =>
      api.post<SingleResponse>("/admissions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdmissionReferral>) =>
      api.patch<SingleResponse>(`/admissions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
    },
  });
}
