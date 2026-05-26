"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeRecordingResult } from "@/lib/engines/home-recording-quality-intelligence-engine";

interface HomeRecordingResponse {
  data: HomeRecordingResult;
}

export function useHomeRecordingQualityIntelligence() {
  return useQuery<HomeRecordingResponse>({
    queryKey: ["home-recording-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-recording-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home recording quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
