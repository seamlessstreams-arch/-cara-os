"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePeerRelationshipSocialDevelopmentIntelligence() {
  return useQuery({
    queryKey: ["home-peer-relationship-social-development-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-peer-relationship-social-development-intelligence");
      if (!res.ok) throw new Error("Failed to fetch peer relationship social development intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
