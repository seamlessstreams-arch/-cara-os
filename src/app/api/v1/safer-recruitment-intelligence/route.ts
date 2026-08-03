// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT INTELLIGENCE API ROUTE
// GET /api/v1/safer-recruitment-intelligence
// Returns pipeline health, candidate compliance, check completion, reference
// verification status, SCR readiness, and Cara recruitment insights.
// Reg 32/33/34, Schedule 2, SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeSaferRecruitmentIntelligence,
  type VacancyInput,
  type CandidateInput,
  type CheckInput,
  type ReferenceInput,
  type ConditionalOfferInput,
  type CandidateStage,
  type CheckType,
  type CheckStatus,
  type ReferenceStatus,
} from "@/lib/engines/safer-recruitment-intelligence-engine";

export async function GET() {
  const [vacanciesList, candidateProfilesList, conditionalOffersList] = await Promise.all([
    dal.vacancies.findAll(),
    dal.candidateProfiles.findAll(),
    dal.conditionalOffers.findAll(),
  ]);
  // candidateChecks / candidateReferences expose only findByCandidate — pull per
  // candidate then flatten (same pattern as workforce-command).
  const [checksNested, refsNested] = await Promise.all([
    Promise.all((candidateProfilesList ?? []).map((c: any) => dal.candidateChecks.findByCandidate(c.id))),
    Promise.all((candidateProfilesList ?? []).map((c: any) => dal.candidateReferences.findByCandidate(c.id))),
  ]);
  const candidateChecksList = checksNested.flat().filter(Boolean);
  const candidateReferencesList = refsNested.flat().filter(Boolean);

  // ── Map vacancies ──────────────────────────────────────────────────────────
  const vacancies: VacancyInput[] = (vacanciesList ?? []).map((v: any) => ({
    id: v.id,
    title: v.title,
    status: v.status as VacancyInput["status"],
    created_at: v.created_at,
  }));

  // ── Map candidates ─────────────────────────────────────────────────────────
  const candidates: CandidateInput[] = (candidateProfilesList ?? []).map((c: any) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    vacancy_id: c.vacancy_id,
    current_stage: c.current_stage as CandidateStage,
    compliance_status: c.compliance_status as CandidateInput["compliance_status"],
    risk_level: c.risk_level as CandidateInput["risk_level"],
    shortlisted: Boolean(c.shortlisted),
    appointed: Boolean(c.appointed),
    created_at: c.created_at,
  }));

  // ── Map checks ─────────────────────────────────────────────────────────────
  const checks: CheckInput[] = (candidateChecksList ?? []).map((c: any) => ({
    id: c.id,
    candidate_id: c.candidate_id,
    check_type: c.check_type as CheckType,
    status: c.status as CheckStatus,
    required: Boolean(c.required),
    due_date: c.due_date ?? null,
    requested_at: c.requested_at ?? null,
    received_at: c.received_at ?? null,
    verified_at: c.verified_at ?? null,
    concern_flag: Boolean(c.concern_flag),
    override_used: Boolean(c.override_used),
  }));

  // ── Map references ─────────────────────────────────────────────────────────
  const references: ReferenceInput[] = (candidateReferencesList ?? []).map((r: any) => ({
    id: r.id,
    candidate_id: r.candidate_id,
    is_most_recent_employer: Boolean(r.is_most_recent_employer),
    status: r.status as ReferenceStatus,
    requested_at: r.requested_at ?? null,
    received_at: r.received_at ?? null,
    chased_at: r.chased_at ?? null,
    verbal_verification_completed: Boolean(r.verbal_verification_completed),
    discrepancy_flag: Boolean(r.discrepancy_flag),
    reliability_rating: r.reliability_rating ?? null,
  }));

  // ── Map conditional offers ─────────────────────────────────────────────────
  const offers: ConditionalOfferInput[] = (conditionalOffersList ?? []).map((o: any) => ({
    id: o.id,
    candidate_id: o.candidate_id,
    status: o.status as ConditionalOfferInput["status"],
    proposed_start_date: o.proposed_start_date ?? null,
    exceptional_start: Boolean(o.exceptional_start),
    conditions: o.conditions ?? [],
    final_clearance_completed_at: o.final_clearance_completed_at ?? null,
  }));

  // ── Run engine ─────────────────────────────────────────────────────────────
  const result = computeSaferRecruitmentIntelligence({
    vacancies,
    candidates,
    checks,
    references,
    offers,
  });

  return NextResponse.json({ data: result });
}
