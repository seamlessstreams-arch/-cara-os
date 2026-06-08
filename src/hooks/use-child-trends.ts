"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeTrendsResult } from "@/lib/engines/home-trends-engine";

export interface ChildTrendsResponse {
  children: { id: string; name: string }[];
  childId: string | null;
  childName: string | null;
  trends: HomeTrendsResult | null;
}

export function useChildTrends(childId: string | null) {
  return useQuery<ChildTrendsResponse>({
    queryKey: ["child-trends", childId],
    queryFn: async () => {
      const qs = childId ? `?childId=${encodeURIComponent(childId)}` : "";
      const res = await fetch(`/api/v1/child-trends${qs}`);
      if (!res.ok) throw new Error("Failed to fetch child trends");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
