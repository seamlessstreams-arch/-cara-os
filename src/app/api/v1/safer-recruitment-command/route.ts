// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT COMMAND CENTRE API
// Per-candidate compliance roll-up: traffic light, start-eligibility gate,
// blockers, reference chase ladder, missing evidence and the Ofsted-ready
// staff-file index. Read-only; every suitability decision stays human.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import {
  computeSaferRecruitmentCommand,
  type CommandCandidateInput,
} from "@/lib/engines/safer-recruitment-command-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const candidates: CommandCandidateInput[] = db.candidateProfiles.findAll().map((profile) => ({
    profile,
    vacancy: profile.vacancy_id ? db.vacancies.findById(profile.vacancy_id) ?? null : null,
    checks: db.candidateChecks.findByCandidate(profile.id),
    references: db.candidateReferences.findByCandidate(profile.id),
    employment_history: db.employmentHistory.findByCandidate(profile.id),
    gaps: db.gapExplanations.findByCandidate(profile.id),
    interviews: db.candidateInterviews.findByCandidate(profile.id),
    offer: db.conditionalOffers.findByCandidate(profile.id) ?? null,
  }));

  const result = computeSaferRecruitmentCommand({ today, candidates });
  return NextResponse.json({ data: result });
}
