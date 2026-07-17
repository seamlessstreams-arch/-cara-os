"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  RhythmView,
  CircleDefinition,
  CircleNote,
} from "@/lib/relational-rhythm/rhythm-engine";

export interface RelationalRhythmData extends RhythmView {
  definitions: CircleDefinition[];
  writeEnabled: boolean;
}

/** The home's circles, what the team keeps naming, and what still needs a home. */
export function useRelationalRhythm() {
  return useQuery({
    queryKey: ["relational-rhythm"],
    queryFn: async () => (await api.get<{ data: RelationalRhythmData }>("/relational-rhythm")).data,
  });
}

export interface CaptureCirclePayload {
  kind: string;
  date: string;
  themes?: string[];
  gratitude?: string[];
  emerging_concerns?: string[];
}

export function useCaptureCircle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: CaptureCirclePayload) =>
      api.post<{ data: RhythmView & { note: CircleNote; handoffReminder: string | null } }>(
        "/relational-rhythm",
        vars,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relational-rhythm"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

/** Switch a circle on or off. Configurable is the point. */
export function useConfigureRhythm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; enabled?: boolean; starts_at?: string }) =>
      api.patch<{ data: RhythmView }>("/relational-rhythm", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relational-rhythm"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}
