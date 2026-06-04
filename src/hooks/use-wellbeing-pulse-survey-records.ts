import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WellbeingPulseSurveyRecord } from "@/types/extended";

export function useWellbeingPulseSurveyRecords(childId?: string) {
  return useQuery<WellbeingPulseSurveyRecord[]>({
    queryKey: ["wellbeing-pulse-survey-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/wellbeing-pulse-survey-records?child_id=${childId}`
        : "/api/v1/wellbeing-pulse-survey-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch wellbeing pulse survey records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateWellbeingPulseSurveyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<WellbeingPulseSurveyRecord, "id">) => {
      const res = await fetch("/api/v1/wellbeing-pulse-survey-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create wellbeing pulse survey record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellbeing-pulse-survey-records"] }),
  });
}
