"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgencyStaffManagementResult } from "@/lib/engines/home-agency-staff-management-intelligence-engine";

interface AgencyStaffManagementResponse { data: AgencyStaffManagementResult; }

export function useHomeAgencyStaffManagementIntelligence() {
  return useQuery<AgencyStaffManagementResponse>({
    queryKey: ["home-agency-staff-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-agency-staff-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch agency staff management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
