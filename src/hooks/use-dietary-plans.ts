import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DietaryPlan } from "@/types/extended";

const KEY = "dietary-plans";

export function useDietaryPlans() {
  return useQuery<{ data: DietaryPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/dietary-plans").then((r) => r.json()),
  });
}

export function useCreateDietaryPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DietaryPlan>) =>
      fetch("/api/v1/dietary-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
