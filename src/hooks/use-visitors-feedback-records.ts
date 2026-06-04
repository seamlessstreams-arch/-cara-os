import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VisitorsFeedbackRecord } from "@/types/extended";

export function useVisitorsFeedbackRecords() {
  return useQuery<VisitorsFeedbackRecord[]>({
    queryKey: ["visitors-feedback-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/visitors-feedback-records");
      if (!res.ok) throw new Error("Failed to fetch visitors feedback records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateVisitorsFeedbackRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<VisitorsFeedbackRecord, "id">) => {
      const res = await fetch("/api/v1/visitors-feedback-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create visitors feedback record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors-feedback-records"] }),
  });
}
