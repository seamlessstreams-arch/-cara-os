"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeFamilySocialConnectivityIntelligence() {
  return useQuery({
    queryKey: ["home-family-social-connectivity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-family-social-connectivity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch family social connectivity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
