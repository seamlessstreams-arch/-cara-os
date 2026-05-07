import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChosenFamilyRecord } from "@/types/extended";

const KEY = "chosen-family-records";

export function useChosenFamilyRecords() {
  return useQuery<{ data: ChosenFamilyRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/chosen-family-records").then((r) => r.json()),
  });
}

export function useCreateChosenFamilyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChosenFamilyRecord>) =>
      fetch("/api/v1/chosen-family-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
