import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoneWorkingRecord } from "@/types/extended";

const KEY = "lone-working-records";

export function useLoneWorkingRecords() {
  return useQuery<{ data: LoneWorkingRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/lone-working-records").then((r) => r.json()),
  });
}

export function useCreateLoneWorkingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LoneWorkingRecord>) =>
      fetch("/api/v1/lone-working-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLoneWorkingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LoneWorkingRecord> & { id: string }) =>
      fetch("/api/v1/lone-working-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
