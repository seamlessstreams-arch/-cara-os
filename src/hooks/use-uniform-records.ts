import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UniformRecord } from "@/types/extended";

const KEY = "uniform-records";

export function useUniformRecords() {
  return useQuery<{ data: UniformRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/uniform-records").then((r) => r.json()),
  });
}

export function useCreateUniformRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UniformRecord>) =>
      fetch("/api/v1/uniform-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
