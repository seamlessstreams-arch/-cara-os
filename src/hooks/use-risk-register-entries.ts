import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RiskRegisterEntry } from "@/types/extended";

export function useRiskRegisterEntries(childId?: string) {
  return useQuery<RiskRegisterEntry[]>({
    queryKey: ["risk-register-entries", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/risk-register-entries?child_id=${childId}`
        : "/api/v1/risk-register-entries";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch risk register entries");
      return res.json();
    },
  });
}

export function useCreateRiskRegisterEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RiskRegisterEntry>) => {
      const res = await fetch("/api/v1/risk-register-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create risk register entry");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["risk-register-entries"] }),
  });
}
