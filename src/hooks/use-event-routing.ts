"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT ROUTING HOOK
// React Query wrapper for /api/v1/event-routing
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { EventRoutingResult } from "@/lib/event-routing/event-routing-engine";

interface EventRoutingResponse {
  data: EventRoutingResult;
}

export function useEventRouting() {
  return useQuery({
    queryKey: ["event-routing"],
    queryFn: () => api.get<EventRoutingResponse>("/event-routing"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
