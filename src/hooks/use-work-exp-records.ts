import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkExpRecord } from "@/types/extended";

const KEY = "work-exp-records";

export function useWorkExpRecords() {
  return useQuery<{ data: WorkExpRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/work-exp-records").then((r) => r.json()),
  });
}

export function useCreateWorkExpRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WorkExpRecord>) =>
      fetch("/api/v1/work-exp-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
