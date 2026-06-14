"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  ChildPACEProfile, PACEAnalysisInput, PACEAnalysisResult, PACEContext, PACEGuidance,
  PACERecordingAssistantResult, PACETrainingModule,
} from "@/lib/cara-intelligence/pace";

/** Analyse a record for PACE quality. */
export function useAnalyzePACE() {
  return useMutation({
    mutationFn: (input: { text: string; context: PACEContext; riskPresentHint?: boolean }) =>
      api.post<{ data: PACEAnalysisResult }>("/pace/analyse", input),
  });
}

/** Recording-assistant suggestions for a draft record. */
export function usePACERecordingAssist() {
  return useMutation({
    mutationFn: (input: { text: string; context: PACEContext }) =>
      api.post<{ data: PACERecordingAssistantResult }>("/pace/analyse?mode=recording", input),
  });
}

/** PACE guidance for a context (what's underneath, what to say, escalate…). */
export function usePACEGuidance(context: PACEContext) {
  return useQuery({
    queryKey: ["pace-guidance", context],
    queryFn: () => api.get<{ data: PACEGuidance }>(`/pace/analyse?context=${context}`),
    staleTime: 5 * 60_000,
  });
}

/** PACE micro-learning modules (optionally for a context). */
export function usePACETraining(context?: PACEContext) {
  return useQuery({
    queryKey: ["pace-training", context ?? "all"],
    queryFn: () => api.get<{ data: { modules: PACETrainingModule[] } }>(`/pace/training${context ? `?context=${context}` : ""}`),
    staleTime: 5 * 60_000,
  });
}

/** A child's PACE profile ("what works for this child"). */
export function useChildPaceProfile(childId: string | null) {
  return useQuery({
    enabled: !!childId,
    queryKey: ["pace-child-profile", childId],
    queryFn: () => api.get<{ data: { childId: string; profile: ChildPACEProfile | null } }>(`/pace/child-profile?childId=${childId}`),
    staleTime: 60_000,
  });
}

export function useUpdateChildPaceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ChildPACEProfile> & { childId: string }) =>
      api.patch<{ data: ChildPACEProfile }>("/pace/child-profile", input),
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ["pace-child-profile", vars.childId] }),
  });
}
