"use client";

import { useQuery } from "@tanstack/react-query";
import type { LoneWorkingSafetyResult } from "@/lib/engines/home-lone-working-staff-safety-intelligence-engine";

interface LoneWorkingSafetyResponse { data: LoneWorkingSafetyResult; }

export function useHomeLoneWorkingStaffSafetyIntelligence() {
  return useQuery<LoneWorkingSafetyResponse>({
    queryKey: ["home-lone-working-staff-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-lone-working-staff-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch lone working & staff safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
