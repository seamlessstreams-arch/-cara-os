"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConsentRightsResult } from "@/lib/engines/home-consent-rights-literacy-intelligence-engine";

interface ConsentRightsResponse { data: ConsentRightsResult; }

export function useHomeConsentRightsLiteracyIntelligence() {
  return useQuery<ConsentRightsResponse>({
    queryKey: ["home-consent-rights-literacy-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-consent-rights-literacy-intelligence");
      if (!res.ok) throw new Error("Failed to fetch consent & rights literacy intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
