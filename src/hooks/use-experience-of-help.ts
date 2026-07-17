"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  ExperienceOfHelpView,
  LensDefinition,
  HelpReflection,
} from "@/lib/experience-of-help/experience-of-help-engine";

export interface ExperienceOfHelpData extends ExperienceOfHelpView {
  lenses: LensDefinition[];
  writeEnabled: boolean;
}

/** How each child says our help feels, and the barriers we made. */
export function useExperienceOfHelp(childId?: string) {
  const qs = childId ? `?child_id=${encodeURIComponent(childId)}` : "";
  return useQuery({
    queryKey: ["experience-of-help", childId ?? "all"],
    queryFn: async () => (await api.get<{ data: ExperienceOfHelpData }>(`/experience-of-help${qs}`)).data,
  });
}

export interface RecordReflectionPayload {
  child_id: string;
  source: string;
  lens: string;
  their_words: string;
  one_change: string;
  safety_consideration: string;
  system_barriers_named?: string[];
}

/** A 422 here is Cara asking for the missing half, not a rejection. */
export function useRecordReflection(childId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: RecordReflectionPayload) =>
      api.post<{ data: { reflection: HelpReflection; note: string } }>("/experience-of-help", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experience-of-help", childId ?? "all"] });
    },
  });
}
