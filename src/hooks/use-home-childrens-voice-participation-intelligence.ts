"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildrensVoiceResult } from "@/lib/engines/home-childrens-voice-participation-intelligence-engine";

interface ChildrensVoiceResponse { data: ChildrensVoiceResult; }

export function useHomeChildrensVoiceParticipationIntelligence() {
  return useQuery<ChildrensVoiceResponse>({
    queryKey: ["home-childrens-voice-participation-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-childrens-voice-participation-intelligence");
      if (!res.ok) throw new Error("Failed to fetch children's voice & participation intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
