import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConsequenceRecord } from "@/types/extended";

const KEY = "consequence-records";

export function useConsequenceRecords() {
  return useQuery<{ data: ConsequenceRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/consequence-records").then((r) => r.json()),
  });
}

export function useCreateConsequenceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ConsequenceRecord>) =>
      fetch("/api/v1/consequence-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
