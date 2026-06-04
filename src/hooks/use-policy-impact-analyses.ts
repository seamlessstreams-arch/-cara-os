import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PolicyImpactAnalysis } from "@/types/extended";

export function usePolicyImpactAnalyses() {
  return useQuery<PolicyImpactAnalysis[]>({
    queryKey: ["policy-impact-analyses"],
    queryFn: async () => {
      const res = await fetch("/api/v1/policy-impact-analyses");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreatePolicyImpactAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PolicyImpactAnalysis>) => {
      const res = await fetch("/api/v1/policy-impact-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policy-impact-analyses"] }),
  });
}
