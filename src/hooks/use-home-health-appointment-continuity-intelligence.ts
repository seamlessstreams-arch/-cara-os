"use client";

import { useQuery } from "@tanstack/react-query";
import type { HealthAppointmentResult } from "@/lib/engines/home-health-appointment-continuity-intelligence-engine";

interface HealthAppointmentResponse { data: HealthAppointmentResult; }

export function useHomeHealthAppointmentContinuityIntelligence() {
  return useQuery<HealthAppointmentResponse>({
    queryKey: ["home-health-appointment-continuity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-health-appointment-continuity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch health appointment continuity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
