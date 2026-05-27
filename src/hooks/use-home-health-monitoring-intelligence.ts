"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeHealthMonitoringResult } from "@/lib/engines/home-health-monitoring-intelligence-engine";

interface HomeHealthMonitoringResponse {
  data: HomeHealthMonitoringResult;
}

export function useHomeHealthMonitoringIntelligence() {
  return useQuery<HomeHealthMonitoringResponse>({
    queryKey: ["home-health-monitoring-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-health-monitoring-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home health monitoring intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
