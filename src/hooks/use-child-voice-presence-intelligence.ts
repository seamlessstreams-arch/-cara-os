"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export type VoiceTrend = "improving" | "stable" | "declining";
export type RecordType = "incidents" | "dailyLog" | "keyWorkingSessions" | "ypFeedback" | "lacReviews";

export interface RecordTypeStats {
  type: RecordType;
  label: string;
  total: number;
  withVoice: number;
  presenceRate: number | null;
  recentRate: number | null;
  priorRate: number | null;
  trend: VoiceTrend;
  supervisionPrompt: string;
}

export interface ChildVoiceProfile {
  childId: string;
  name: string;
  overallScore: number | null;
  totalRecords: number;
  recordsWithVoice: number;
  byType: Partial<Record<RecordType, { total: number; withVoice: number; rate: number | null }>>;
  topGapType: RecordType | null;
  topStrengthType: RecordType | null;
  hasData: boolean;
}

export interface ChildVoicePresenceSummary {
  overallPresenceRate: number | null;
  totalRecords: number;
  totalWithVoice: number;
  childrenWithData: number;
  worstType: { type: RecordType; label: string; rate: number | null } | null;
  bestType:  { type: RecordType; label: string; rate: number | null } | null;
  lacParticipationRate: number | null;
}

export interface ChildVoicePresenceResponse {
  typeStats: RecordTypeStats[];
  childProfiles: ChildVoiceProfile[];
  summary: ChildVoicePresenceSummary;
}

export function useChildVoicePresenceIntelligence() {
  return useQuery({
    queryKey: ["child-voice-presence-intelligence"],
    queryFn: () =>
      api.get<{ data: ChildVoicePresenceResponse }>("/child-voice-presence-intelligence"),
    staleTime: 60_000,
  });
}
