"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "./use-api";

export interface Referral {
  id: string;
  child_name: string;
  age: number;
  gender: string;
  local_authority: string;
  referral_source: string;
  status: "new" | "under_assessment" | "impact_assessment" | "panel_decision" | "accepted" | "declined" | "withdrawn" | "placed";
  referral_date: string;
  presenting_needs: string[];
  risk_factors: string[];
  placement_type?: string;
  social_worker?: string;
  notes?: string;
  staff_id: string;
  home_id?: string;
  created_at?: string;
}

type ListResponse = { data: Referral[]; meta: { total: number; active: number; placed_this_year: number } };
type SingleResponse = { data: Referral };

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
    mutationFn: (data: Partial<Referral>) =>
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
    mutationFn: ({ id, ...data }: { id: string } & Partial<Referral>) =>
      api.patch<SingleResponse>(`/admissions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
    },
  });
}
