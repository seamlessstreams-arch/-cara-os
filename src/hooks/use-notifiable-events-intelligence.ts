"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NOTIFIABLE EVENTS INTELLIGENCE HOOK
// React Query wrapper for /api/v1/notifiable-events-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { NotifiableEventsIntelligenceResult } from "@/lib/engines/notifiable-events-intelligence-engine";

interface NotifiableEventsIntelligenceResponse {
  data: NotifiableEventsIntelligenceResult;
}

export function useNotifiableEventsIntelligence() {
  return useQuery({
    queryKey: ["notifiable-events-intelligence"],
    queryFn: () => api.get<NotifiableEventsIntelligenceResponse>("/notifiable-events-intelligence"),
    refetchInterval: 60_000,
  });
}
