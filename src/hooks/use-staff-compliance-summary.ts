"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { StaffComplianceRow } from "@/lib/engines/staff-compliance-engine";
import type { AbsenceStaffRow } from "@/lib/engines/workforce-absence-engine";

export interface StaffComplianceSummary {
  compliance: StaffComplianceRow | null;
  absence: AbsenceStaffRow | null;
}

export function useStaffComplianceSummary(staffId: string) {
  return useQuery({
    queryKey: ["staff-compliance-summary", staffId],
    queryFn: () => api.get<{ data: StaffComplianceSummary }>(`/staff/${encodeURIComponent(staffId)}/compliance-summary`),
    enabled: !!staffId,
    staleTime: 30_000,
  });
}
