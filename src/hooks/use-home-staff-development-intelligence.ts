"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeStaffDevelopmentResult } from "@/lib/engines/home-staff-development-intelligence-engine";

interface HomeStaffDevelopmentResponse {
  data: HomeStaffDevelopmentResult;
}

export function useHomeStaffDevelopmentIntelligence() {
  return useQuery<HomeStaffDevelopmentResponse>({
    queryKey: ["home-staff-development-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-development-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home staff development intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
