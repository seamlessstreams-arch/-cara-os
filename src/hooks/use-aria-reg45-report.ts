"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaReg45Report, AriaReg45Theme } from "@/types/aria-studio";

interface ListResponse {
  data: AriaReg45Report[];
}
interface OneResponse {
  data: AriaReg45Report;
}

export function useReg45Reports(homeId?: string) {
  const qs = homeId ? `?home_id=${encodeURIComponent(homeId)}` : "";
  return useQuery({
    queryKey: ["aria-reg45-report", homeId ?? null],
    queryFn: () => api.get<ListResponse>(`/api/v1/aria-studio/reg45-reports${qs}`),
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
    }) => api.post<OneResponse>("/api/v1/aria-studio/reg45-reports", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg45-report"] });
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
      section_narratives?: Partial<Record<AriaReg45Theme, string>>;
      actor_id?: string;
      actor_role?: string;
    }) => api.patch<OneResponse>("/api/v1/aria-studio/reg45-reports", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg45-report"] });
    },
  });
}

export function useSetReg45ReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: AriaReg45Report["status"];
      note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) => api.patch<OneResponse>("/api/v1/aria-studio/reg45-reports", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg45-report"] });
      // a lock promotes evidence chips to included_in_report
      qc.invalidateQueries({ queryKey: ["aria-reg45-evidence"] });
      qc.invalidateQueries({ queryKey: ["aria-annex-a-snapshot"] });
    },
  });
}
