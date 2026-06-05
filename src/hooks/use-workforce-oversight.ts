"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WorkforceOversight } from "@/lib/oversight/workforce-oversight";
import type { WorkforceEvidencePack } from "@/lib/oversight/workforce-evidence";

export type { WorkforceOversight } from "@/lib/oversight/workforce-oversight";
export type { WorkforceEvidencePack } from "@/lib/oversight/workforce-evidence";

export function useWorkforceOversight(periodDays?: number) {
  return useQuery({
    queryKey: ["workforce-oversight", periodDays ?? 7],
    queryFn: async () =>
      (await api.get<{ data: WorkforceOversight }>(`/workforce-oversight${periodDays ? `?period=${periodDays}` : ""}`)).data,
    staleTime: 15_000,
  });
}

/** Fetch the evidence pack on demand (for export). */
export async function fetchWorkforceEvidence(periodDays?: number): Promise<WorkforceEvidencePack> {
  return (await api.get<{ data: WorkforceEvidencePack }>(`/workforce-oversight/evidence${periodDays ? `?period=${periodDays}` : ""}`)).data;
}
