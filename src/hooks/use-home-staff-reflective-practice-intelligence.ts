"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReflectivePracticeResult } from "@/lib/engines/home-staff-reflective-practice-intelligence-engine";

interface ReflectivePracticeResponse { data: ReflectivePracticeResult; }

export function useHomeStaffReflectivePracticeIntelligence() {
  return useQuery<ReflectivePracticeResponse>({
    queryKey: ["home-staff-reflective-practice-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-reflective-practice-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff reflective practice intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
