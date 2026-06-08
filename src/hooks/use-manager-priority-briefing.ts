"use client";

import { useQuery } from "@tanstack/react-query";
import type { PriorityBriefingResult } from "@/lib/engines/manager-priority-briefing-engine";

export function useManagerPriorityBriefing() {
  return useQuery<PriorityBriefingResult>({
    queryKey: ["manager-priority-briefing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/manager-priority-briefing");
      if (!res.ok) throw new Error("Failed to fetch manager priority briefing");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
