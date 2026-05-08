import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FirstRelationshipRecord } from "@/types/extended";

const KEY = "first-relationship-records";

export function useFirstRelationshipRecords() {
  return useQuery<{ data: FirstRelationshipRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/first-relationship-records").then((r) => r.json()),
  });
}

export function useCreateFirstRelationshipRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FirstRelationshipRecord>) =>
      fetch("/api/v1/first-relationship-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
