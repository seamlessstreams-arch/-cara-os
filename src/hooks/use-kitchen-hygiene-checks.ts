import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { KitchenHygieneCheck } from "@/types/extended";

const KEY = "kitchen-hygiene-checks";

export function useKitchenHygieneChecks() {
  return useQuery<{ data: KitchenHygieneCheck[] }>({
    queryKey: [KEY],
    queryFn: () =>
      fetch("/api/v1/kitchen-hygiene-checks").then((r) => r.json()),
  });
}

export function useCreateKitchenHygieneCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KitchenHygieneCheck>) =>
      fetch("/api/v1/kitchen-hygiene-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateKitchenHygieneCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KitchenHygieneCheck> & { id: string }) =>
      fetch("/api/v1/kitchen-hygiene-checks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
