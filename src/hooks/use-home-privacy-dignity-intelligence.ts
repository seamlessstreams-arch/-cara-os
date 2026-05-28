"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePrivacyDignityIntelligence() {
  return useQuery({
    queryKey: ["home-privacy-dignity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-privacy-dignity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch privacy dignity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
