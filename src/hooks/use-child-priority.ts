"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PRIORITY (UNIFIED RISK) HOOK
// React Query wrapper for /api/v1/child-priority
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ChildPriorityResult } from "@/lib/child-priority/child-priority-engine";

interface ChildPriorityResponse {
  data: ChildPriorityResult;
}

export function useChildPriority() {
  return useQuery({
    queryKey: ["child-priority"],
    queryFn: () => api.get<ChildPriorityResponse>("/child-priority"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
