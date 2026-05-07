import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DigitalPlan } from "@/types/extended";

const KEY = "digital-plans";

export function useDigitalPlans() {
  return useQuery<{ data: DigitalPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/digital-plans").then((r) => r.json()),
  });
}

export function useCreateDigitalPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DigitalPlan>) =>
      fetch("/api/v1/digital-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
