"use client";

import { useQuery } from "@tanstack/react-query";
import type { WhistleblowingResult } from "@/lib/engines/home-whistleblowing-transparency-intelligence-engine";

interface WhistleblowingResponse { data: WhistleblowingResult; }

export function useHomeWhistleblowingTransparencyIntelligence() {
  return useQuery<WhistleblowingResponse>({
    queryKey: ["home-whistleblowing-transparency-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-whistleblowing-transparency-intelligence");
      if (!res.ok) throw new Error("Failed to fetch whistleblowing & transparency intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
