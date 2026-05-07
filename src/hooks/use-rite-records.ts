import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RiteRecord } from "@/types/extended";

const KEY = "rite-records";

export function useRiteRecords() {
  return useQuery<{ data: RiteRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/rite-records").then((r) => r.json()),
  });
}

export function useCreateRiteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiteRecord>) =>
      fetch("/api/v1/rite-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
