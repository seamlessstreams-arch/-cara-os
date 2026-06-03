"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — UNIFIED EVENT STREAM HOOK
// React Query wrapper for /api/v1/event-stream
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { EventStreamResult } from "@/lib/event-stream/event-projector";

interface EventStreamResponse {
  data: EventStreamResult;
}

export function useEventStream() {
  return useQuery({
    queryKey: ["event-stream"],
    queryFn: () => api.get<EventStreamResponse>("/event-stream"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
