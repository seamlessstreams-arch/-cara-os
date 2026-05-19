import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ChronologyEntry } from "@/types/extended";

export function useChronologyEntries(childId?: string) {
  const params = new URLSearchParams();
  if (childId) params.set("child_id", childId);
  const qs = params.toString();

  return useQuery({
    queryKey: ["chronology-entries", childId],
    queryFn: () =>
      api.get<{ data: ChronologyEntry[] }>(`/api/v1/chronology-entries${qs ? `?${qs}` : ""}`),
    staleTime: 30_000,
  });
}
