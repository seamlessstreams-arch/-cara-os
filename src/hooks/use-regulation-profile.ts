"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  RegulationProfile,
  ProfileSuggestion,
  AdultRegulationReflection,
  ReflectionRead,
} from "@/lib/emotional-safety/regulation-profile-engine";

export interface RegulationProfileData {
  childId: string;
  childName: string;
  profile: RegulationProfile | null;
  suggestions: ProfileSuggestion[];
  reflections: (AdultRegulationReflection & { read: ReflectionRead })[];
  questions: { field: keyof AdultRegulationReflection; question: string }[];
  writeEnabled: boolean;
}

export function useRegulationProfile(childId: string | undefined) {
  return useQuery({
    queryKey: ["regulation-profile", childId],
    enabled: !!childId,
    queryFn: async () =>
      (await api.get<{ data: RegulationProfileData }>(
        `/regulation-profile?child_id=${encodeURIComponent(childId!)}`,
      )).data,
  });
}

export function useSaveRegulationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { child_id: string } & Partial<RegulationProfile>) =>
      (await api.put<{ data: RegulationProfile }>(`/regulation-profile`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regulation-profile"] }),
  });
}
