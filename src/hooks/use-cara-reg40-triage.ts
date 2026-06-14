"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CaraReg40Triage, Reg40TriageStatus } from "@/types/cara-studio";

interface ListResponse {
  data: CaraReg40Triage[];
}

interface DecisionResponse {
  data: CaraReg40Triage;
}

interface ScanResponse {
  data: { created: CaraReg40Triage[] };
}

export function useReg40Queue(homeId: string, status?: Reg40TriageStatus) {
  return useQuery({
    queryKey: ["cara-reg40-queue", homeId, status ?? "all"],
    queryFn: () => {
      const qs = new URLSearchParams({ home_id: homeId });
      if (status) qs.set("status", status);
      return api.get<ListResponse>(
        `/cara-studio/reg40-triage?${qs.toString()}`,
      );
    },
    refetchInterval: 30000,
  });
}

export function useScanReg40() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { home_id: string; actor_id?: string; actor_role?: string }) =>
      api.post<ScanResponse>("/cara-studio/reg40-triage", {
        ...input,
        action: "scan",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg40-queue"] });
      qc.invalidateQueries({ queryKey: ["cara-management-oversight"] });
      qc.invalidateQueries({ queryKey: ["cara-audit-trail"] });
    },
  });
}

export function useDecideReg40() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      triage_id: string;
      action: "notify" | "dismiss" | "escalate";
      note?: string;
      notification_ref?: string;
      actor_id?: string;
      actor_role?: string;
    }) => api.post<DecisionResponse>("/cara-studio/reg40-triage", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg40-queue"] });
      qc.invalidateQueries({ queryKey: ["cara-management-oversight"] });
      qc.invalidateQueries({ queryKey: ["cara-audit-trail"] });
    },
  });
}
