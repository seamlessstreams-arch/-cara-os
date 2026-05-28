"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeComplaintAdvocacyResponsivenessIntelligence() {
  return useQuery({
    queryKey: ["home-complaint-advocacy-responsiveness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-complaint-advocacy-responsiveness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch complaint advocacy responsiveness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
