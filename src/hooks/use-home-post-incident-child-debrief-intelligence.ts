"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostIncidentDebriefResult } from "@/lib/engines/home-post-incident-child-debrief-intelligence-engine";

export function useHomePostIncidentChildDebriefIntelligence() {
  return useQuery<PostIncidentDebriefResult>({
    queryKey: ["home-post-incident-child-debrief-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-post-incident-child-debrief-intelligence");
      if (!res.ok) throw new Error("Failed to fetch post-incident child debrief intelligence");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });
}
