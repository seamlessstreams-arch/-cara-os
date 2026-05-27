"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeLeaveAbsenceResult } from "@/lib/engines/home-leave-absence-intelligence-engine";

interface HomeLeaveAbsenceResponse {
  data: HomeLeaveAbsenceResult;
}

export function useHomeLeaveAbsenceIntelligence() {
  return useQuery<HomeLeaveAbsenceResponse>({
    queryKey: ["home-leave-absence-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-leave-absence-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home leave absence intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
