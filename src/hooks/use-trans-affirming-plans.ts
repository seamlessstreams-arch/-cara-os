"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TransAffirmingPlan } from "@/types/extended";

const KEY = "trans-affirming-plans";

export function useTransAffirmingPlans(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: TransAffirmingPlan[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/trans-affirming-plans${qs}`).then((r) => r.json()),
  });
}

export function useCreateTransAffirmingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransAffirmingPlan>) =>
      fetch("/api/v1/trans-affirming-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
