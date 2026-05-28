"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeDigitalSafetyOnlineProtectionIntelligence() {
  return useQuery({
    queryKey: ["home-digital-safety-online-protection-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-digital-safety-online-protection-intelligence");
      if (!res.ok) throw new Error("Failed to fetch digital safety online protection intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
