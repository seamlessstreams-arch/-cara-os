import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LadoReferral } from "@/types/extended";

const KEY = "lado-referrals";

export function useLadoReferrals() {
  return useQuery<{ data: LadoReferral[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/lado-referrals").then((r) => r.json()),
  });
}

export function useCreateLadoReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LadoReferral>) =>
      fetch("/api/v1/lado-referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLadoReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LadoReferral> & { id: string }) =>
      fetch("/api/v1/lado-referrals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
