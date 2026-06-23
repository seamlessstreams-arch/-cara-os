"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { InspectionReadiness } from "@/lib/inspection-intelligence/inspection-intelligence-engine";

/**
 * Fetch Inspection Intelligence — the home's evidence and gaps mapped to Ofsted's
 * three SCCIF judgement areas, with an evidence-strength signal per area. A
 * self-evaluation readiness view; it never predicts an Ofsted grade.
 */
export function useInspectionIntelligence() {
  return useQuery({
    queryKey: ["inspection-intelligence"],
    queryFn: async () =>
      (await api.get<{ data: InspectionReadiness }>(`/inspection-intelligence`)).data,
  });
}
