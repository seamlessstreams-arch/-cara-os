"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeConsentCapacityManagementIntelligence() {
  return useQuery({
    queryKey: ["home-consent-capacity-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-consent-capacity-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch consent capacity management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
