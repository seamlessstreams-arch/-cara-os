"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdvocacyVoiceResult } from "@/lib/engines/home-advocacy-independent-voice-intelligence-engine";

interface AdvocacyVoiceResponse { data: AdvocacyVoiceResult; }

export function useHomeAdvocacyIndependentVoiceIntelligence() {
  return useQuery<AdvocacyVoiceResponse>({
    queryKey: ["home-advocacy-independent-voice-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-advocacy-independent-voice-intelligence");
      if (!res.ok) throw new Error("Failed to fetch advocacy independent voice intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
