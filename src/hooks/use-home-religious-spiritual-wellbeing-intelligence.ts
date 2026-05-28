"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeReligiousSpiritualWellbeingIntelligence() {
  return useQuery({
    queryKey: ["home-religious-spiritual-wellbeing-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-religious-spiritual-wellbeing-intelligence");
      if (!res.ok) throw new Error("Failed to fetch religious spiritual wellbeing intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
