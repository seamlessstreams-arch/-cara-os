// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VALUES-BASED MATCHING API
// GET /api/v1/values-match[?candidateId=...]
//
// Computes a transparent, dimension-by-dimension match between each candidate's
// values profile and the home's Employer Values Profile. DECISION-SUPPORT ONLY —
// the engine attaches the mandatory disclaimer; never a hiring decision.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAllMatches, computeValuesMatch, MATCH_DISCLAIMER,
  type EmployerValuesProfile, type CandidateValuesProfile,
} from "@/lib/engines/values-match-engine";

export async function GET(req: Request) {
  const store = getStore() as any;
  const employer: EmployerValuesProfile | undefined = (store.employerValuesProfiles ?? [])[0];
  const candidates: CandidateValuesProfile[] = store.candidateValuesProfiles ?? [];
  const profiles: any[] = store.candidateProfiles ?? [];

  if (!employer) {
    return NextResponse.json({ data: { employer: null, matches: [], disclaimer: MATCH_DISCLAIMER } });
  }

  const profById = new Map(profiles.map((p) => [p.id, p]));
  const enriched = candidates.map((c) => {
    const p = profById.get(c.candidate_id);
    return {
      ...c,
      candidate_name: c.candidate_name || (p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : c.candidate_id),
    };
  });

  const candidateId = new URL(req.url).searchParams.get("candidateId");
  const base = candidateId
    ? enriched.filter((c) => c.candidate_id === candidateId).map((c) => computeValuesMatch(employer, c))
    : computeAllMatches(employer, enriched);

  // attach recruitment stage for context (no effect on the match score)
  const matches = base.map((m) => ({ ...m, current_stage: profById.get(m.candidate_id)?.current_stage ?? null }));

  return NextResponse.json({
    data: {
      employer: { home_name: employer.home_name, core_values: employer.core_values, relational_practice_priority: employer.relational_practice_priority },
      matches,
      disclaimer: MATCH_DISCLAIMER,
    },
  });
}
