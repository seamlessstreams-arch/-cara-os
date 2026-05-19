"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaReg40Triage, Reg40TriageStatus } from "@/types/aria-studio";

interface ListResponse {
  data: AriaReg40Triage[];
}

interface DecisionResponse {
  data: AriaReg40Triage;
}

interface ScanResponse {
  data: { created: AriaReg40Triage[] };
}

export function useReg40Queue(homeId: string, status?: Reg40TriageStatus) {
  return useQuery({
    queryKey: ["aria-reg40-queue", homeId, status ?? "all"],
    queryFn: () => {
      const qs = new URLSearchParams({ home_id: homeId });
      if (status) qs.set("status", status);
      return api.get<ListResponse>(
        `/api/v1/aria-studio/reg40-triage?${qs.toString()}`,
      );
    },
    refetchInterval: 30000,
  });
}

export function useScanReg40() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { home_id: string; actor_id?: string; actor_role?: string }) =>
      api.post<ScanResponse>("/api/v1/aria-studio/reg40-triage", {
        ...input,
        action: "scan",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg40-queue"] });
      qc.invalidateQueries({ queryKey: ["aria-management-oversight"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
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
    }) => api.post<DecisionResponse>("/api/v1/aria-studio/reg40-triage", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg40-queue"] });
      qc.invalidateQueries({ queryKey: ["aria-management-oversight"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
