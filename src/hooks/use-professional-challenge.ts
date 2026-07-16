"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  ChallengeSummary,
  ChallengeRung,
} from "@/lib/professional-challenge/professional-challenge-engine";

export interface ProfessionalChallengeData extends ChallengeSummary {
  ladder: readonly ChallengeRung[];
  writeEnabled: boolean;
}

/** Professional challenges + detections, whole home or one child. */
export function useProfessionalChallenges(childId?: string) {
  const qs = childId ? `?child_id=${encodeURIComponent(childId)}` : "";
  return useQuery({
    queryKey: ["professional-challenge", childId ?? "all"],
    queryFn: async () =>
      (await api.get<{ data: ProfessionalChallengeData }>(`/professional-challenge${qs}`)).data,
  });
}
