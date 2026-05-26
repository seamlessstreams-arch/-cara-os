"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildMedicationResult } from "@/lib/engines/child-medication-intelligence-engine";

interface ChildMedicationResponse {
  data: ChildMedicationResult;
}

export function useChildMedicationIntelligence(childId: string) {
  return useQuery<ChildMedicationResponse>({
    queryKey: ["child-medication-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-medication-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child medication intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
