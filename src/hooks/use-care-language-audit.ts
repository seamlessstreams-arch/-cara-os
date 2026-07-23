"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export type PatternCategory =
  | "criminalising"
  | "moralising"
  | "power_control"
  | "minimising_trauma"
  | "character_labelling";

export interface StaffLanguageProfile {
  staffId: string;
  name: string;
  totalHits: number;
  hitsByCategory: Partial<Record<PatternCategory, number>>;
  mostCommonPhrase: string | null;
  supervisionNote: string;
}

export interface ChildLanguageProfile {
  childId: string;
  name: string;
  totalHits: number;
  hitsByCategory: Partial<Record<PatternCategory, number>>;
  mostAffectedCategory: PatternCategory | null;
}

export interface CategorySummary {
  category: PatternCategory;
  label: string;
  totalHits: number;
  topPhrase: string | null;
  topStaffId: string | null;
}

export interface LanguageAuditSummary {
  totalHits: number;
  totalRecordsScanned: number;
  hitRate: number;
  categoryCounts: Partial<Record<PatternCategory, number>>;
  staffWithHits: number;
  childrenAffected: number;
  mostFlaggedPhrase: string | null;
}

export interface CareLanguageAuditResponse {
  staffProfiles: StaffLanguageProfile[];
  childProfiles: ChildLanguageProfile[];
  categorySummary: CategorySummary[];
  summary: LanguageAuditSummary;
}

export function useCareLanguageAudit() {
  return useQuery({
    queryKey: ["care-language-audit"],
    queryFn: () =>
      api.get<{ data: CareLanguageAuditResponse }>("/care-language-audit"),
    staleTime: 120_000,
  });
}
