"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeParentalContactFamilyEngagementIntelligence() {
  return useQuery({
    queryKey: ["home-parental-contact-family-engagement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-parental-contact-family-engagement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch parental contact family engagement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
