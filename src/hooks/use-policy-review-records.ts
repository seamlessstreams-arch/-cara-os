import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PolicyReviewRecord } from "@/types/extended";

export function usePolicyReviewRecords() {
  return useQuery<PolicyReviewRecord[]>({
    queryKey: ["policy-review-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/policy-review-records");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreatePolicyReviewRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PolicyReviewRecord>) => {
      const res = await fetch("/api/v1/policy-review-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policy-review-records"] }),
  });
}
