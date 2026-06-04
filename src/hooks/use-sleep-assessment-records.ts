import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SleepAssessmentRecord } from "@/types/extended";

export function useSleepAssessmentRecords(childId?: string) {
  return useQuery<SleepAssessmentRecord[]>({
    queryKey: ["sleep-assessment-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/sleep-assessment-records?child_id=${childId}`
        : "/api/v1/sleep-assessment-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sleep assessment records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSleepAssessmentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SleepAssessmentRecord, "id">) => {
      const res = await fetch("/api/v1/sleep-assessment-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sleep assessment record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep-assessment-records"] }),
  });
}
