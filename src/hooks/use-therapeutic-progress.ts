import { useQuery } from "@tanstack/react-query";
import type { TherapeuticProgressResult } from "@/lib/engines/therapeutic-progress-intelligence-engine";

export function useTherapeuticProgress(childId: string | null) {
  return useQuery<{ data: TherapeuticProgressResult }>({
    queryKey: ["therapeutic-progress-intelligence", childId],
    queryFn: () =>
      fetch(`/api/v1/therapeutic-progress-intelligence?childId=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
