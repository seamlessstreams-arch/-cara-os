"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeCommunityIntegrationVolunteeringIntelligence() {
  return useQuery({
    queryKey: ["home-community-integration-volunteering-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-community-integration-volunteering-intelligence");
      if (!res.ok) throw new Error("Failed to fetch community integration volunteering intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
