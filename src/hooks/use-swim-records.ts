import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SwimRecord } from "@/types/extended";

const KEY = "swim-records";

export function useSwimRecords() {
  return useQuery<{ data: SwimRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/swim-records").then((r) => r.json()),
  });
}

export function useCreateSwimRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SwimRecord>) =>
      fetch("/api/v1/swim-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
