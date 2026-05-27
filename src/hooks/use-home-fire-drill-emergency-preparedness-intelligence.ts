"use client";

import { useQuery } from "@tanstack/react-query";
import type { FireDrillPreparednessResult } from "@/lib/engines/home-fire-drill-emergency-preparedness-intelligence-engine";

interface FireDrillResponse { data: FireDrillPreparednessResult; }

export function useHomeFireDrillEmergencyPreparednessIntelligence() {
  return useQuery<FireDrillResponse>({
    queryKey: ["home-fire-drill-emergency-preparedness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-fire-drill-emergency-preparedness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch fire drill emergency preparedness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
