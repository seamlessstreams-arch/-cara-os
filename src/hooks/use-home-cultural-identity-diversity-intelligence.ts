"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeCulturalIdentityDiversityIntelligence() {
  return useQuery({
    queryKey: ["home-cultural-identity-diversity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-cultural-identity-diversity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch cultural identity diversity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
