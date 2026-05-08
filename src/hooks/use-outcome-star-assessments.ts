import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OutcomeStarAssessment } from "@/types/extended";

const KEY = "outcome-star-assessments";

async function fetchRecords(childId?: string): Promise<{ data: OutcomeStarAssessment[] }> {
  const url = childId ? `/api/v1/outcome-star-assessments?child_id=${childId}` : "/api/v1/outcome-star-assessments";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOutcomeStarAssessments(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateOutcomeStarAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutcomeStarAssessment>) => {
      const res = await fetch("/api/v1/outcome-star-assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOutcomeStarAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutcomeStarAssessment> & { id: string }) => {
      const res = await fetch("/api/v1/outcome-star-assessments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
