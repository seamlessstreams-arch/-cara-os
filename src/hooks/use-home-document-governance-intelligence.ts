"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeDocumentResult } from "@/lib/engines/home-document-governance-intelligence-engine";

interface HomeDocumentResponse {
  data: HomeDocumentResult;
}

export function useHomeDocumentGovernanceIntelligence() {
  return useQuery<HomeDocumentResponse>({
    queryKey: ["home-document-governance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-document-governance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home document governance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
