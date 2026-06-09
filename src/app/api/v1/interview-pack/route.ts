// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTERVIEW PACK API
// GET /api/v1/interview-pack?role=...[&candidateId=...]
//
// Returns a structured, values-aligned interview pack for a role. When a
// candidate is given, reuses the values-matching engine to add candidate-
// specific probes. Decision-support only (the pack carries its disclaimer).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildInterviewPack, INTERVIEW_ROLES } from "@/lib/engines/interview-pack-engine";
import { computeValuesMatch, type EmployerValuesProfile, type CandidateValuesProfile } from "@/lib/engines/values-match-engine";

export async function GET(req: Request) {
  const store = getStore() as any;
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || INTERVIEW_ROLES[0].key;
  const candidateId = url.searchParams.get("candidateId");

  const employer: EmployerValuesProfile | null = (store.employerValuesProfiles ?? [])[0] ?? null;
  const candidates: CandidateValuesProfile[] = store.candidateValuesProfiles ?? [];
  const profiles: any[] = store.candidateProfiles ?? [];
  const nameFor = (cid: string) => {
    const c = candidates.find((x) => x.candidate_id === cid);
    if (c?.candidate_name) return c.candidate_name;
    const p = profiles.find((x) => x.id === cid);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : cid;
  };

  let candidatePrompts: string[] = [];
  let candidate_name: string | null = null;
  if (candidateId) {
    const cand = candidates.find((c) => c.candidate_id === candidateId);
    if (cand && employer) {
      candidate_name = nameFor(candidateId);
      candidatePrompts = computeValuesMatch(employer, { ...cand, candidate_name }).interview_prompts;
    }
  }

  const pack = buildInterviewPack({ role, employer, candidatePrompts });

  return NextResponse.json({
    data: {
      pack,
      candidate_name,
      roles: INTERVIEW_ROLES,
      candidates: candidates.map((c) => ({ id: c.candidate_id, name: nameFor(c.candidate_id), preferred_role: c.preferred_role })),
      has_values_profile: !!employer,
    },
  });
}
