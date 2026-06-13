"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { SafeguardingOverviewResult } from "@/lib/engines/safeguarding-overview-engine";

/** Child-scoped open safeguarding picture (reuses the home-overview engine). */
export function useChildSafeguarding(childId: string) {
  return useQuery({
    queryKey: ["child-safeguarding", childId],
    queryFn: () => api.get<{ data: SafeguardingOverviewResult }>(`/safeguarding-overview?childId=${encodeURIComponent(childId)}`),
    enabled: !!childId,
    staleTime: 30_000,
  });
}
