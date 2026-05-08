import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IndependentTravelRecord } from "@/types/extended";

const KEY = "independent-travel-records";

export function useIndependentTravelRecords(childId?: string) {
  return useQuery<{ data: IndependentTravelRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(childId ? `/api/v1/independent-travel-records?child_id=${childId}` : "/api/v1/independent-travel-records").then((r) => r.json()),
  });
}

export function useCreateIndependentTravelRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IndependentTravelRecord>) =>
      fetch("/api/v1/independent-travel-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
