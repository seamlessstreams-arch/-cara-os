import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RiskManagementPlanRecord } from "@/types/extended";

export function useRiskManagementPlanRecords(childId?: string) {
  return useQuery<RiskManagementPlanRecord[]>({
    queryKey: ["risk-management-plan-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/risk-management-plan-records?child_id=${childId}`
        : "/api/v1/risk-management-plan-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch risk management plan records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateRiskManagementPlanRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RiskManagementPlanRecord>) => {
      const res = await fetch("/api/v1/risk-management-plan-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create risk management plan record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["risk-management-plan-records"] }),
  });
}
