"use client";

import { useQuery } from "@tanstack/react-query";
import type { InterviewPack } from "@/lib/engines/interview-pack-engine";

export interface InterviewPackResponse {
  pack: InterviewPack;
  candidate_name: string | null;
  roles: { key: string; label: string; senior: boolean }[];
  candidates: { id: string; name: string; preferred_role: string }[];
  has_values_profile: boolean;
}

export function useInterviewPack(role: string, candidateId: string | null) {
  return useQuery<InterviewPackResponse>({
    queryKey: ["interview-pack", role, candidateId ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams({ role });
      if (candidateId) params.set("candidateId", candidateId);
      const res = await fetch(`/api/v1/interview-pack?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch interview pack");
      return (await res.json()).data;
    },
  });
}
