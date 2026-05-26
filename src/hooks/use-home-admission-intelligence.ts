"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeAdmissionResult } from "@/lib/engines/home-admission-intelligence-engine";

interface HomeAdmissionResponse {
  data: HomeAdmissionResult;
}

export function useHomeAdmissionIntelligence() {
  return useQuery<HomeAdmissionResponse>({
    queryKey: ["home-admission-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-admission-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home admission intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
