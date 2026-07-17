"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { EscalationQualityResult } from "@/lib/risk-escalation/escalation-quality-engine";

/** Decision-timeliness reads + findings over the escalation record. */
export function useEscalationQuality() {
  return useQuery({
    queryKey: ["escalation-quality"],
    queryFn: async () =>
      (await api.get<{ data: EscalationQualityResult }>(`/escalation-quality`)).data,
  });
}
