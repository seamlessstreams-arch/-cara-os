import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Escalation } from "@/types/extended";

const KEY = "escalations";

export function useEscalations() {
  return useQuery<{ data: Escalation[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/escalations").then((r) => r.json()),
  });
}

export function useCreateEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Escalation>) =>
      fetch("/api/v1/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
