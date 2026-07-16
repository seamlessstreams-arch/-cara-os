"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  VoiceFollowThroughResult,
  VoiceLoopStage,
  VoiceConcernLoop,
} from "@/lib/voice-of-child/voice-follow-through-engine";

export type { VoiceLoopStage };

export interface VoiceFollowThroughData extends VoiceFollowThroughResult {
  /** False while the voice_follow_through_write flag is off — the board is read-only. */
  writeEnabled: boolean;
}

/** Loops + Scenario J detections, whole home or one child. */
export function useVoiceFollowThrough(childId?: string) {
  const qs = childId ? `?child_id=${encodeURIComponent(childId)}` : "";
  return useQuery({
    queryKey: ["voice-follow-through", childId ?? "all"],
    queryFn: async () =>
      (await api.get<{ data: VoiceFollowThroughData }>(`/voice-follow-through${qs}`)).data,
  });
}

/** Move a loop one stage forward (403 while the write flag is off). */
export function useAdvanceVoiceLoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      to: VoiceLoopStage;
      owner_id?: string | null;
      agreed_action?: string;
      explain_back_note?: string;
      review_with_child_note?: string;
    }) => (await api.patch<{ data: VoiceConcernLoop }>(`/voice-follow-through`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voice-follow-through"] }),
  });
}
