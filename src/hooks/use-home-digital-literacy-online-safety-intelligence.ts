"use client";

import { useQuery } from "@tanstack/react-query";
import type { DigitalSafetyResult } from "@/lib/engines/home-digital-literacy-online-safety-intelligence-engine";

interface DigitalSafetyResponse { data: DigitalSafetyResult; }

export function useHomeDigitalLiteracyOnlineSafetyIntelligence() {
  return useQuery<DigitalSafetyResponse>({
    queryKey: ["home-digital-literacy-online-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-digital-literacy-online-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch digital literacy & online safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
