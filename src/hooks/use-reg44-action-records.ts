import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reg44ActionRecord } from "@/types/extended";

export function useReg44ActionRecords() {
  return useQuery<Reg44ActionRecord[]>({
    queryKey: ["reg44-action-records"],
    queryFn: () => fetch("/api/v1/reg44-action-records").then((r) => r.json()),
  });
}

export function useCreateReg44ActionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reg44ActionRecord>) =>
      fetch("/api/v1/reg44-action-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reg44-action-records"] }),
  });
}
