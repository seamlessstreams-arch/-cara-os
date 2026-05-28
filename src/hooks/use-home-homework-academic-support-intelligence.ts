"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeHomeworkAcademicSupportIntelligence() {
  return useQuery({
    queryKey: ["home-homework-academic-support-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-homework-academic-support-intelligence");
      if (!res.ok) throw new Error("Failed to fetch homework academic support intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
