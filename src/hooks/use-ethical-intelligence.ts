"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ethical Intelligence hook (client)
// GET /api/v1/ethical-intelligence → source-linked learning events on the
// Experience→Insight→Decision→Impact→Learning→Integration cycle, each with its
// computed cycle status.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { EthicalCycleStatus, EthicalIntelligenceEvent } from "@/lib/ethical-intelligence/types";

export interface EthicalEventWithStatus {
  event: EthicalIntelligenceEvent;
  status: EthicalCycleStatus;
}
interface EthicalIntelligenceResponse {
  data: EthicalEventWithStatus[];
  meta: { total: number };
}

export function useEthicalIntelligence(filter?: { childId?: string; triggerRecordId?: string }) {
  const params = new URLSearchParams();
  if (filter?.childId) params.set("childId", filter.childId);
  if (filter?.triggerRecordId) params.set("triggerRecordId", filter.triggerRecordId);
  const qs = params.toString();

  return useQuery({
    queryKey: ["ethical-intelligence", filter?.childId ?? "", filter?.triggerRecordId ?? ""],
    queryFn: () => api.get<EthicalIntelligenceResponse>(`/ethical-intelligence${qs ? `?${qs}` : ""}`),
    staleTime: 30 * 1000,
  });
}
