"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export type KBSignal = "progressing" | "developing" | "needs_support";

export interface IssueStat {
  type: string;
  total: number;
  accepted: number;
  ignored: number;
}

export interface KBAlignment {
  frameworkId: string;
  frameworkTitle: string;
  signal: KBSignal;
  reason: string;
  supervisionPrompt: string;
}

export interface StaffRecordingProfile {
  staffId: string;
  name: string;
  jobTitle: string | null;
  role: string | null;
  totalFlagged: number;
  accepted: number;
  ignored: number;
  acceptanceRate: number | null;
  firstEntry: string | null;
  latestEntry: string | null;
  hasData: boolean;
  issueBreakdown: IssueStat[];
  topIssueType: string | null;
  kbAlignment: KBAlignment[];
  overallSignal: KBSignal;
}

export interface StaffRecordingQualitySummary {
  totalStaff: number;
  staffWithData: number;
  progressing: number;
  developing: number;
  needsSupport: number;
  topTeamIssueType: string | null;
  avgAcceptanceRate: number | null;
  frameworks: Array<{ id: string; title: string; shortDesc: string }>;
}

export interface StaffRecordingQualityPathwayResponse {
  profiles: StaffRecordingProfile[];
  summary: StaffRecordingQualitySummary;
}

export function useStaffRecordingQualityPathway() {
  return useQuery({
    queryKey: ["staff-recording-quality-pathway"],
    queryFn: () =>
      api.get<{ data: StaffRecordingQualityPathwayResponse }>("/staff-recording-quality-pathway"),
    staleTime: 60_000,
  });
}
