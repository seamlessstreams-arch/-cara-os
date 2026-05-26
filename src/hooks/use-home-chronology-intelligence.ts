"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeChronologyResult } from "@/lib/engines/home-chronology-intelligence-engine";

interface HomeChronologyResponse {
  data: HomeChronologyResult;
}

export function useHomeChronologyIntelligence() {
  return useQuery<HomeChronologyResponse>({
    queryKey: ["home-chronology-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-chronology-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home chronology intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
