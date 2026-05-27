"use client";

import { useQuery } from "@tanstack/react-query";
import type { HolidayExperiencesResult } from "@/lib/engines/home-holiday-enriching-experiences-intelligence-engine";

interface HolidayExperiencesResponse { data: HolidayExperiencesResult; }

export function useHomeHolidayEnrichingExperiencesIntelligence() {
  return useQuery<HolidayExperiencesResponse>({
    queryKey: ["home-holiday-enriching-experiences-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-holiday-enriching-experiences-intelligence");
      if (!res.ok) throw new Error("Failed to fetch holiday & enriching experiences intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
