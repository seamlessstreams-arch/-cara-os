"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Unified Neurodiversity Profile hook (client)
// GET /api/v1/neurodiversity-profile?child_id=…&context=… — profile + the
// point-of-work prompts for that recording context; no arg → whole-home rollup.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { NeuroPrompt, NeuroRecordingContext, UnifiedNeuroProfile } from "@/lib/neurodiversity-profile/types";

const KEY = "neurodiversity-profile";
const URL = "/api/v1/neurodiversity-profile";

export interface NeuroProfileResponse {
  profile: UnifiedNeuroProfile;
  context: NeuroRecordingContext;
  prompts: NeuroPrompt[];
}

export interface NeuroRollupRow {
  childId: string;
  childName: string;
  hasProfile: boolean;
  conditions: string[];
  reviewGaps: number;
  overdueOrMissing: number;
}

export function useNeurodiversityProfile(childId?: string, context: NeuroRecordingContext = "overview") {
  return useQuery<{ data: NeuroProfileResponse }>({
    queryKey: [KEY, childId ?? "", context],
    queryFn: () => fetch(`${URL}?child_id=${encodeURIComponent(childId!)}&context=${context}`).then((r) => r.json()),
    enabled: !!childId,
    staleTime: 60 * 1000,
  });
}

export function useHomeNeurodiversity() {
  return useQuery<{ data: { asOf: string; childrenWithProfile: number; childrenWithGaps: number; rows: NeuroRollupRow[] } }>({
    queryKey: [KEY, "home"],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 60 * 1000,
  });
}
