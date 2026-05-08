import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ComplaintTrend } from "@/types/extended";

const KEY = "complaint-trends";

export function useComplaintTrends() {
  return useQuery<{ data: ComplaintTrend[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/complaint-trends").then((r) => r.json()),
  });
}

export function useCreateComplaintTrend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComplaintTrend>) =>
      fetch("/api/v1/complaint-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateComplaintTrend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComplaintTrend> & { id: string }) =>
      fetch("/api/v1/complaint-trends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
