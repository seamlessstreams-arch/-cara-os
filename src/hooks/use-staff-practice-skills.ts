"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Staff Practice Skills hook (client)
// GET /api/v1/staff-practice-skills?staff_id=… — one practitioner's unified
// practice picture; no arg → whole-team rollup.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { StaffPracticeSkillsProfile } from "@/lib/staff-practice-skills/types";

const KEY = "staff-practice-skills";
const URL = "/api/v1/staff-practice-skills";

export interface StaffSkillsRollupRow {
  staffId: string;
  staffName: string;
  hasData: boolean;
  overallPicture: string;
  strengths: string[];
  developmentAreas: string[];
  needsSupportLenses: number;
  supervisionPromptCount: number;
}

export function useStaffPracticeSkills(staffId?: string) {
  return useQuery<{ data: StaffPracticeSkillsProfile }>({
    queryKey: [KEY, staffId ?? ""],
    queryFn: () => fetch(`${URL}?staff_id=${encodeURIComponent(staffId!)}`).then((r) => r.json()),
    enabled: !!staffId,
    staleTime: 60 * 1000,
  });
}

export function useTeamPracticeSkills() {
  return useQuery<{ data: { asOf: string; staffWithData: number; staffNeedingSupport: number; rows: StaffSkillsRollupRow[] } }>({
    queryKey: [KEY, "team"],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 60 * 1000,
  });
}
