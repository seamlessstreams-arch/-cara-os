import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QualityOfCareReview } from "@/types/extended";

export function useQualityOfCareReviews() {
  return useQuery<QualityOfCareReview[]>({
    queryKey: ["quality-of-care-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/v1/quality-of-care-reviews");
      if (!res.ok) throw new Error("Failed to fetch quality of care reviews");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateQualityOfCareReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<QualityOfCareReview>) => {
      const res = await fetch("/api/v1/quality-of-care-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create quality of care review");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quality-of-care-reviews"] }),
  });
}
