"use client";

import { useQuery } from "@tanstack/react-query";
import type { TraumaTherapyResult } from "@/lib/engines/home-trauma-therapy-intelligence-engine";

export function useHomeTraumaTherapyIntelligence() {
  return useQuery<TraumaTherapyResult>({
    queryKey: ["home-trauma-therapy-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-trauma-therapy-intelligence");
      if (!res.ok) throw new Error("Failed to fetch trauma therapy intelligence");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });
}
