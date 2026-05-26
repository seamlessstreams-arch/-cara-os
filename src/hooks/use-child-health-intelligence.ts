import { useQuery } from "@tanstack/react-query";
import type { ChildHealthIntelligenceResult } from "@/lib/engines/child-health-intelligence-engine";

export function useChildHealthIntelligence(childId: string | null) {
  return useQuery<{ data: ChildHealthIntelligenceResult }>({
    queryKey: ["child-health-intelligence", childId],
    queryFn: () =>
      fetch(`/api/v1/child-health-intelligence?childId=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
