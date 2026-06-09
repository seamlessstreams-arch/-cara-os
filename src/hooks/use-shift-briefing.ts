"use client";

import { useQuery } from "@tanstack/react-query";
import type { ShiftBriefingResult } from "@/lib/engines/shift-briefing-engine";

export function useShiftBriefing() {
  return useQuery<ShiftBriefingResult>({
    queryKey: ["shift-briefing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/shift-briefing");
      if (!res.ok) throw new Error("Failed to fetch shift briefing");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
