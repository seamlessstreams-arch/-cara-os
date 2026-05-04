"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Complaint } from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, number> };
type SingleResponse<T> = { data: T };

export function useComplaints(params: { homeId: string; open?: boolean }) {
  const qs = `home_id=${params.homeId}${params.open ? "&open=true" : ""}`;
  return useQuery({
    queryKey: ["complaints", params.homeId, params.open],
    queryFn:  () => api.get<ListResponse<Complaint>>(`/complaints?${qs}`),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaints", id],
    queryFn:  () => api.get<SingleResponse<Complaint>>(`/complaints/${id}`),
    enabled:  !!id,
  });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Complaint>) =>
      api.post<SingleResponse<Complaint>>("/complaints", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Complaint> }) =>
      api.patch<SingleResponse<Complaint>>(`/complaints/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}
