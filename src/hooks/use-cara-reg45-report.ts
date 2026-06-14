"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CaraReg45Report, CaraReg45Theme } from "@/types/cara-studio";

interface ListResponse {
  data: CaraReg45Report[];
}
interface OneResponse {
  data: CaraReg45Report;
}

export function useReg45Reports(homeId?: string) {
  const qs = homeId ? `?home_id=${encodeURIComponent(homeId)}` : "";
  return useQuery({
    queryKey: ["cara-reg45-report", homeId ?? null],
    queryFn: () => api.get<ListResponse>(`/cara-studio/reg45-reports${qs}`),
    refetchInterval: 60000,
  });
}

export function useBuildReg45Report() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      period_start?: string;
      period_end?: string;
      title?: string;
      actor_id?: string;
      actor_role?: string;
    }) => api.post<OneResponse>("/cara-studio/reg45-reports", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg45-report"] });
    },
  });
}

export function useEditReg45Report() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      title?: string;
      executive_summary?: string;
      section_narratives?: Partial<Record<CaraReg45Theme, string>>;
      actor_id?: string;
      actor_role?: string;
    }) => api.patch<OneResponse>("/cara-studio/reg45-reports", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg45-report"] });
    },
  });
}

export function useSetReg45ReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: CaraReg45Report["status"];
      note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) => api.patch<OneResponse>("/cara-studio/reg45-reports", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg45-report"] });
      // a lock promotes evidence chips to included_in_report
      qc.invalidateQueries({ queryKey: ["cara-reg45-evidence"] });
      qc.invalidateQueries({ queryKey: ["cara-annex-a-snapshot"] });
    },
  });
}
