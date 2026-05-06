import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnnualDevelopmentReview } from "@/types/extended";

const KEY = "annual-development-reviews";
const API = "/api/v1/annual-development-reviews";

export function useAnnualDevelopmentReviews() {
  return useQuery<{ data: AnnualDevelopmentReview[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateAnnualDevelopmentReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnualDevelopmentReview>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAnnualDevelopmentReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnualDevelopmentReview> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
