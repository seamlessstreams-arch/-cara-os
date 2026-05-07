import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OutdoorActivityRiskAssessment } from "@/types/extended";

const KEY = "outdoor-activity-risk-assessments";

async function fetchRecords(): Promise<{ data: OutdoorActivityRiskAssessment[] }> {
  const res = await fetch("/api/v1/outdoor-activity-risk-assessments");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOutdoorActivityRiskAssessments() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateOutdoorActivityRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutdoorActivityRiskAssessment>) => {
      const res = await fetch("/api/v1/outdoor-activity-risk-assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOutdoorActivityRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutdoorActivityRiskAssessment> & { id: string }) => {
      const res = await fetch("/api/v1/outdoor-activity-risk-assessments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
