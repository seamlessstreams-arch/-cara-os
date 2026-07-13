"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { OriginStory } from "@/lib/admission-retro-link/admission-retro-link-engine";
import type { EmergencyFollowUps } from "@/lib/admission-retro-link/emergency-followups-engine";

export type { OriginStory, EmergencyFollowUps };

type OriginsResponse = {
  data: { linked: number; young_people_total: number; stories: OriginStory[] };
};

type EmergencyResponse = {
  data: { emergency_admissions: number; total_overdue: number; boards: EmergencyFollowUps[] };
};

/** Every current young person retro-linked to a referral origin (read-only). */
export function useAdmissionOrigins() {
  return useQuery({
    queryKey: ["admission-origins"],
    queryFn: () => api.get<OriginsResponse>("/admission-retro-link"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

/** The whole-home statutory follow-up board for emergency admissions (read-only). */
export function useEmergencyFollowUps() {
  return useQuery({
    queryKey: ["emergency-followups"],
    queryFn: () => api.get<EmergencyResponse>("/emergency-followups"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
