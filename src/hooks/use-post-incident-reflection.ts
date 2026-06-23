"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  ReflectionOverview,
  ReflectionAnalysis,
} from "@/lib/post-incident-reflection/post-incident-reflection-engine";
import type { PostIncidentReflection } from "@/lib/post-incident-reflection/types";

export interface ReflectionResult {
  reflection: PostIncidentReflection;
  analysis: ReflectionAnalysis;
}

/** Whole-home reflection overview — incidents needing reflection, repeated triggers, alerts. */
export function useReflectionOverview() {
  return useQuery({
    queryKey: ["post-incident-reflection", "overview"],
    queryFn: async () => (await api.get<{ data: ReflectionOverview }>(`/post-incident-reflection`)).data,
  });
}

/** A single child's reflections + per-reflection analysis. */
export function useChildReflections(childId: string | undefined) {
  return useQuery({
    queryKey: ["post-incident-reflection", "child", childId],
    enabled: !!childId,
    queryFn: async () =>
      (await api.get<{ data: { childId: string; childName: string; reflections: ReflectionResult[] } }>(
        `/post-incident-reflection?child_id=${encodeURIComponent(childId!)}`,
      )).data,
  });
}

/** Start a reflection for an incident. */
export function useStartReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { incident_id: string } & Partial<PostIncidentReflection>) =>
      (await api.post<{ data: ReflectionResult }>(`/post-incident-reflection`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-incident-reflection"] }),
  });
}

/** Update a reflection — fields, stages, manager comments, or sign-off. */
export function useUpdateReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; sign_off?: boolean } & Partial<PostIncidentReflection>) =>
      (await api.patch<{ data: ReflectionResult }>(`/post-incident-reflection`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-incident-reflection"] }),
  });
}
