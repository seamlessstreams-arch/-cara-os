"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeStatutoryNotificationComplianceIntelligence() {
  return useQuery({
    queryKey: ["home-statutory-notification-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-statutory-notification-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch statutory notification compliance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
