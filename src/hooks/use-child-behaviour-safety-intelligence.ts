import { useQuery } from "@tanstack/react-query";
import type { ChildBehaviourSafetyResult } from "@/lib/engines/child-behaviour-safety-intelligence-engine";

export function useChildBehaviourSafetyIntelligence(childId: string | null) {
  return useQuery<{ data: ChildBehaviourSafetyResult }>({
    queryKey: ["child-behaviour-safety-intelligence", childId],
    queryFn: () =>
      fetch(`/api/v1/child-behaviour-safety-intelligence?childId=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
