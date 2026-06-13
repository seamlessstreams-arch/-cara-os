"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { StaffingCoverResult, StaffingPolicy } from "@/lib/rota/staffing-cover-engine";

export interface StaffingCoverData extends StaffingCoverResult {
  policy: StaffingPolicy;
  projected_count: number;
}

export function useStaffingCover(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return useQuery({
    queryKey: ["staffing-cover", from, to],
    queryFn: () => api.get<{ data: StaffingCoverData }>(`/staffing-cover${q ? `?${q}` : ""}`),
    staleTime: 30_000,
  });
}
