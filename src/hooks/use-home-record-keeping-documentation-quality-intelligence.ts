"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeRecordKeepingDocumentationQualityIntelligence() {
  return useQuery({
    queryKey: ["home-record-keeping-documentation-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-record-keeping-documentation-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch record keeping documentation quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
