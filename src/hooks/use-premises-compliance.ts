"use client";

import { useQuery } from "@tanstack/react-query";
import type { PremisesComplianceResult } from "@/lib/engines/premises-compliance-engine";

export function usePremisesCompliance() {
  return useQuery<PremisesComplianceResult>({
    queryKey: ["premises-compliance"],
    queryFn: async () => {
      const res = await fetch("/api/v1/premises-compliance");
      if (!res.ok) throw new Error("Failed to fetch premises compliance");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
