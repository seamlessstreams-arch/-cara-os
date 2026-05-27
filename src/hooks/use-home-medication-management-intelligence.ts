"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeMedicationManagementResult } from "@/lib/engines/home-medication-management-intelligence-engine";

interface HomeMedicationManagementResponse {
  data: HomeMedicationManagementResult;
}

export function useHomeMedicationManagementIntelligence() {
  return useQuery<HomeMedicationManagementResponse>({
    queryKey: ["home-medication-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-medication-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home medication management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
