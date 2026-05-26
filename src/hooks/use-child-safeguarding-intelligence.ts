import { useQuery } from "@tanstack/react-query";
import type { ChildSafeguardingResult } from "@/lib/engines/child-safeguarding-intelligence-engine";

export function useChildSafeguardingIntelligence(childId: string | null) {
  return useQuery<{ data: ChildSafeguardingResult }>({
    queryKey: ["child-safeguarding-intelligence", childId],
    queryFn: () =>
      fetch(`/api/v1/child-safeguarding-intelligence?childId=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
