import { useQuery } from "@tanstack/react-query";
import type { Child360Result } from "@/lib/engines/child-360-intelligence-engine";
import type { Cpie360Spine } from "@/lib/cpie/child-360-spine";

export function useChild360(childId: string | null) {
  return useQuery<{ data: Child360Result; cpie?: Cpie360Spine | null }>({
    queryKey: ["child-360-intelligence", childId],
    queryFn: () => fetch(`/api/v1/child-360-intelligence?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
