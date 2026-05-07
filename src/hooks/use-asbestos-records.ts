import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AsbestosRecord } from "@/types/extended";

const KEY = "asbestos-records";

export function useAsbestosRecords() {
  return useQuery<{ data: AsbestosRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/asbestos-records").then((r) => r.json()),
  });
}

export function useCreateAsbestosRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AsbestosRecord>) =>
      fetch("/api/v1/asbestos-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
