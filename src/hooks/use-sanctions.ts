"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";

export interface SanctionRecord {
  id: string;
  child_id: string;
  record_type: "sanction" | "reward" | "consequence" | "restorative";
  title: string;
  date: string;
  description: string;
  linked_incident_id?: string;
  proportionate: boolean;
  child_informed: boolean;
  child_response?: string;
  outcome?: string;
  staff_id: string;
  reviewed_by?: string;
  status: "active" | "completed" | "appealed" | "withdrawn";
  home_id?: string;
  created_at?: string;
}

type ListResponse = { data: SanctionRecord[]; meta: { total: number; active: number; this_month: number } };
type SingleResponse = { data: SanctionRecord };

export function useSanctions(params?: { childId?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  if (params?.type) qs.set("type", params.type);
  return useQuery({
    queryKey: ["sanctions", params],
    queryFn: () => api.get<ListResponse>(`/sanctions?${qs.toString()}`),
  });
}

export function useCreateSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SanctionRecord>) =>
      api.post<SingleResponse>("/sanctions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sanctions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<SanctionRecord>) =>
      api.patch<SingleResponse>(`/sanctions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}
