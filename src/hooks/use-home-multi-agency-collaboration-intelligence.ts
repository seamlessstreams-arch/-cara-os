"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeMultiAgencyCollaborationIntelligence() {
  return useQuery({
    queryKey: ["home-multi-agency-collaboration-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-multi-agency-collaboration-intelligence");
      if (!res.ok) throw new Error("Failed to fetch multi-agency collaboration intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
