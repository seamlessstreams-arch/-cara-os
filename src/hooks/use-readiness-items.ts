import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReadinessItem } from "@/types/extended";

const KEY = "readiness-items";

export function useReadinessItems() {
  return useQuery<{ data: ReadinessItem[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/readiness-items").then((r) => r.json()),
  });
}

export function useCreateReadinessItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReadinessItem>) =>
      fetch("/api/v1/readiness-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
