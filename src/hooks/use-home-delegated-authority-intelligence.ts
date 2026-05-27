"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeDelegatedAuthorityResult } from "@/lib/engines/home-delegated-authority-intelligence-engine";

interface HomeDelegatedAuthorityResponse {
  data: HomeDelegatedAuthorityResult;
}

export function useHomeDelegatedAuthorityIntelligence() {
  return useQuery<HomeDelegatedAuthorityResponse>({
    queryKey: ["home-delegated-authority-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-delegated-authority-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home delegated authority intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
