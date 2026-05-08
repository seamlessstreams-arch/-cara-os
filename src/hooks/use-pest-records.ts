import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PestRecord } from "@/types/extended";

const KEY = "pest-records";

export function usePestRecords() {
  return useQuery<{ data: PestRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/pest-records").then((r) => r.json()),
  });
}

export function useCreatePestRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PestRecord>) =>
      fetch("/api/v1/pest-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
