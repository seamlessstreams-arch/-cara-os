import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SeriousIncidentReviewRecord } from "@/types/extended";

export function useSeriousIncidentReviewRecords() {
  return useQuery<SeriousIncidentReviewRecord[]>({
    queryKey: ["serious-incident-review-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/serious-incident-review-records");
      if (!res.ok) throw new Error("Failed to fetch serious incident review records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSeriousIncidentReviewRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SeriousIncidentReviewRecord, "id">) => {
      const res = await fetch("/api/v1/serious-incident-review-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create serious incident review record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["serious-incident-review-records"] }),
  });
}
