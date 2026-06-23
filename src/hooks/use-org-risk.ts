"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { OrgRiskDashboard } from "@/lib/org-risk/org-risk-engine";

/**
 * Burnout & Organisational Risk dashboard — staffing, sickness, supervision,
 * training, incidents and complaints scored into one risk picture with
 * correlations and a six-month trend.
 */
export function useOrgRisk() {
  return useQuery({
    queryKey: ["org-risk"],
    queryFn: async () => (await api.get<{ data: OrgRiskDashboard }>(`/org-risk`)).data,
  });
}
