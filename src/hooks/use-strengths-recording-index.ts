"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export type StrengthCategory =
  | "achievement"
  | "positive_connection"
  | "resilience_coping"
  | "voice_agency"
  | "positive_mood";

export interface StaffStrengthsProfile {
  staffId: string;
  name: string;
  totalRecords: number;
  recordsWithStrengths: number;
  strengthsRate: number | null;
  markerCount: number;
  topCategory: StrengthCategory | null;
  topCategoryLabel: string | null;
  recognitionNote: string;
}

export interface ChildStrengthsProfile {
  childId: string;
  name: string;
  totalRecords: number;
  recordsWithStrengths: number;
  strengthsRate: number | null;
  topStrengthPhrase: string | null;
}

export interface CategoryResult {
  category: StrengthCategory;
  label: string;
  totalCount: number;
  topPhrase: string | null;
}

export interface StrengthsRecordingSummary {
  overallRate: number;
  totalRecords: number;
  totalWithStrengths: number;
  topPractitioner: { staffId: string; name: string; rate: number | null } | null;
  mostDocumentedChild: { childId: string; name: string; rate: number | null } | null;
  topStrengthsCategory: StrengthCategory | null;
  topStrengthsCategoryLabel: string | null;
}

export interface StrengthsRecordingIndexResponse {
  staffProfiles: StaffStrengthsProfile[];
  childProfiles: ChildStrengthsProfile[];
  categoryResults: CategoryResult[];
  summary: StrengthsRecordingSummary;
}

export function useStrengthsRecordingIndex() {
  return useQuery({
    queryKey: ["strengths-recording-index"],
    queryFn: () =>
      api.get<{ data: StrengthsRecordingIndexResponse }>("/strengths-recording-index"),
    staleTime: 120_000,
  });
}
