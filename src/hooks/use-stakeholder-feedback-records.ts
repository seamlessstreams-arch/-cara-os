import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StakeholderFeedbackRecord } from "@/types/extended";

export function useStakeholderFeedbackRecords() {
  return useQuery<StakeholderFeedbackRecord[]>({
    queryKey: ["stakeholder-feedback-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/stakeholder-feedback-records");
      if (!res.ok) throw new Error("Failed to fetch stakeholder feedback records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStakeholderFeedbackRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StakeholderFeedbackRecord, "id">) => {
      const res = await fetch("/api/v1/stakeholder-feedback-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create stakeholder feedback record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stakeholder-feedback-records"] }),
  });
}
