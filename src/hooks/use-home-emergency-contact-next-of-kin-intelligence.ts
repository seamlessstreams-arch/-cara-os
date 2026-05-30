"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeEmergencyContactNextOfKinIntelligence() {
  return useQuery({
    queryKey: ["home-emergency-contact-next-of-kin-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-emergency-contact-next-of-kin-intelligence");
      if (!res.ok) throw new Error("Failed to fetch emergency contact next of kin intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
