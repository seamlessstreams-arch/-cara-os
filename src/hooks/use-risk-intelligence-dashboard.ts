import { useQuery } from "@tanstack/react-query";
import type { RiskIntelligenceDashboardResult } from "@/lib/engines/risk-intelligence-dashboard-engine";

export function useRiskIntelligenceDashboard() {
  return useQuery<{ data: RiskIntelligenceDashboardResult }>({
    queryKey: ["risk-intelligence-dashboard"],
    queryFn: () =>
      fetch("/api/v1/risk-intelligence-dashboard").then((r) => r.json()),
    refetchInterval: 60_000,
  });
}
