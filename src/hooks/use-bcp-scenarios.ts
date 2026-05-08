import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BcpScenarioPlan } from "@/types/extended";

const KEY = "bcp-scenarios";

export function useBcpScenarios() {
  return useQuery<{ data: BcpScenarioPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/bcp-scenarios").then((r) => r.json()),
  });
}

export function useCreateBcpScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BcpScenarioPlan>) =>
      fetch("/api/v1/bcp-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
