"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Child Voice Dimensions hook (client)
// GET /api/v1/child-voice-dimensions?child_id=… — one child's voice dimensions,
// trends and highlights; no arg → whole-home rollup.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { ChildVoiceDimensionProfile } from "@/lib/child-voice-dimensions/types";

const KEY = "child-voice-dimensions";
const URL = "/api/v1/child-voice-dimensions";

export interface VoiceRollupRow {
  childId: string;
  childName: string;
  hasData: boolean;
  priorityCount: number;
  watchCount: number;
  strengthCount: number;
  topPriority: string | null;
  dimensions: Array<{ key: string; label: string; status: string; trend: string; score: number | null }>;
}

export interface VoiceRollup {
  asOf: string;
  windowDays: number;
  childrenWithVoiceData: number;
  childrenWithPriority: number;
  rows: VoiceRollupRow[];
}

/** One child's voice dimensions, trends and highlights. */
export function useChildVoiceDimensions(childId?: string) {
  return useQuery<{ data: ChildVoiceDimensionProfile }>({
    queryKey: [KEY, childId ?? ""],
    queryFn: () => fetch(`${URL}?child_id=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    staleTime: 30 * 1000,
  });
}

/** Whole-home rollup — one row per current child. */
export function useHomeVoiceDimensions() {
  return useQuery<{ data: VoiceRollup }>({
    queryKey: [KEY, "home"],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 30 * 1000,
  });
}
