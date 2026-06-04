import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelfHarmSafetyPlanRecord } from "@/types/extended";

export function useSelfHarmSafetyPlanRecords(childId?: string) {
  return useQuery<SelfHarmSafetyPlanRecord[]>({
    queryKey: ["self-harm-safety-plan-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/self-harm-safety-plan-records?child_id=${childId}`
        : "/api/v1/self-harm-safety-plan-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch self-harm safety plan records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSelfHarmSafetyPlanRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SelfHarmSafetyPlanRecord>) => {
      const res = await fetch("/api/v1/self-harm-safety-plan-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create self-harm safety plan record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["self-harm-safety-plan-records"] }),
  });
}
