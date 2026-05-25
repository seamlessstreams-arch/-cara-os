"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEETINGS & CHILDREN'S VOICE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/meetings-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { MeetingsIntelligenceResult } from "@/lib/engines/meetings-intelligence-engine";

interface MeetingsIntelligenceResponse {
  data: MeetingsIntelligenceResult;
}

export function useMeetingsIntelligence() {
  return useQuery({
    queryKey: ["meetings-intelligence"],
    queryFn: () => api.get<MeetingsIntelligenceResponse>("/meetings-intelligence"),
    refetchInterval: 60_000,
  });
}
