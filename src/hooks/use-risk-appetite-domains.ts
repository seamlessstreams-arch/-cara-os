import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RiskAppetiteDomain } from "@/types/extended";

const KEY = ["risk-appetite-domains"];

async function fetchAll(): Promise<RiskAppetiteDomain[]> {
  const res = await fetch("/api/v1/risk-appetite-domains");
  if (!res.ok) throw new Error("Failed to fetch risk appetite domains");
  return res.json();
}

export function useRiskAppetiteDomains() {
  return useQuery<RiskAppetiteDomain[]>({ queryKey: KEY, queryFn: fetchAll });
}

export function useCreateRiskAppetiteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RiskAppetiteDomain>) => {
      const res = await fetch("/api/v1/risk-appetite-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create risk appetite domain");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
