import { useQuery } from "@tanstack/react-query";
import type { ChildPlacementQualityResult } from "@/lib/engines/child-placement-quality-engine";

export function useChildPlacementQuality(childId: string | null) {
  return useQuery<{ data: ChildPlacementQualityResult }>({
    queryKey: ["child-placement-quality", childId],
    queryFn: () =>
      fetch(`/api/v1/child-placement-quality?childId=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
