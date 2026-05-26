"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeKeyWorkingResult } from "@/lib/engines/home-key-working-intelligence-engine";

interface HomeKeyWorkingResponse {
  data: HomeKeyWorkingResult;
}

export function useHomeKeyWorkingIntelligence() {
  return useQuery<HomeKeyWorkingResponse>({
    queryKey: ["home-key-working-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-key-working-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home key working intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
