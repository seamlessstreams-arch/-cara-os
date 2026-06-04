import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TransitionPlanningRecord } from "@/types/extended";

export function useTransitionPlanningRecords(childId?: string) {
  return useQuery<TransitionPlanningRecord[]>({
    queryKey: ["transition-planning-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/transition-planning-records?child_id=${childId}`
        : "/api/v1/transition-planning-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch transition planning records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateTransitionPlanningRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<TransitionPlanningRecord, "id">) => {
      const res = await fetch("/api/v1/transition-planning-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create transition planning record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transition-planning-records"] }),
  });
}
