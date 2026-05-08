import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MatchingReferral } from "@/types/extended";

const KEY = "matching-referrals";
const API = "/api/v1/matching-referrals";

export function useMatchingReferrals() {
  return useQuery<{ data: MatchingReferral[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateMatchingReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MatchingReferral>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMatchingReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MatchingReferral> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
