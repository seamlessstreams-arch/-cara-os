import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { evaluateCandidateRules } from "@/lib/recruitment-rules";

// Stages in progression order — advancing past the last element is never valid
const STAGE_ORDER = [
  "enquiry", "application_received", "sift", "interview_scheduled",
  "interview_completed", "references_requested", "references_received",
  "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
  "final_clearance", "onboarding", "appointed",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params;
  const candidate = db.candidateProfiles.findById(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const checks = db.candidateChecks.findByCandidate(candidateId);
  const references = db.candidateReferences.findByCandidate(candidateId);
  const employment_history = db.employmentHistory.findByCandidate(candidateId);
  const gaps = db.gapExplanations.findByCandidate(candidateId);
  const interviews = db.candidateInterviews.findByCandidate(candidateId);
  const offerRaw = db.conditionalOffers.findByCandidate(candidateId);
  const audit = db.recruitmentAudit.findByCandidate(candidateId);
  const vacancy = candidate.vacancy_id ? db.vacancies.findById(candidate.vacancy_id) : null;
  const role_applied = (vacancy as { title?: string } | undefined)?.title ?? "Care Worker";

  // ── Run rules engine ─────────────────────────────────────────────────────────
  const rules = evaluateCandidateRules(candidate, checks, references, gaps, offerRaw ?? null);

  // Serialize checks to hook shape
  const serializedChecks = checks.map((c) => ({
    id: c.id, candidate_id: c.candidate_id, check_type: c.check_type,
    status: c.status, owner: c.owner_id ?? null,
    requested_date: c.requested_at ?? null, received_date: c.received_at ?? null,
    verified_by: c.verified_by ?? null, verified_at: c.verified_at ?? null,
    expiry_date: c.document_expiry ?? null,
    certificate_number: c.certificate_number ?? null, document_type: c.document_type ?? null,
    concern_flag: c.concern_flag, concern_notes: c.concern_summary ?? null,
    override_reason: c.override_reason ?? null, override_by: c.overridden_by ?? null,
    override_at: c.overridden_at ?? null, risk_mitigation: null, notes: null,
    home_id: candidate.home_id, created_at: c.created_at, updated_at: c.updated_at,
  }));

  // Serialize references
  const serializedRefs = references.map((r) => ({
    id: r.id, candidate_id: r.candidate_id,
    referee_name: r.referee_name, referee_org: r.organisation_name ?? null,
    referee_role: r.referee_role ?? null, referee_email: r.email ?? null,
    referee_phone: r.phone ?? null, relationship: r.relationship_to_candidate,
    is_most_recent_employer: r.is_most_recent_employer, status: r.status,
    requested_date: r.requested_at ?? null, received_date: r.received_at ?? null,
    employment_dates_confirmed: r.structured_response?.dates_of_employment_confirmed ?? null,
    role_confirmed: r.structured_response?.role_confirmed ?? null,
    performance_rating: r.structured_response?.performance_rating ?? null,
    safeguarding_concerns: r.structured_response?.safeguarding_concerns ?? null,
    safeguarding_detail: null,
    would_re_employ: r.structured_response?.would_re_employ ?? null,
    would_re_employ_reason: r.structured_response?.additional_comments ?? null,
    discrepancy_flag: r.discrepancy_flag, discrepancy_notes: r.discrepancy_notes ?? null,
    home_id: candidate.home_id, created_at: r.created_at, updated_at: r.updated_at,
  }));

  // Serialize history
  const serializedHistory = employment_history.map((h) => ({
    id: h.id, candidate_id: h.candidate_id,
    employer: h.employer_name, role_title: h.role_title,
    start_date: h.start_date, end_date: h.end_date ?? null,
    is_current: !h.end_date, reason_for_leaving: h.reason_for_leaving ?? null,
    verified: h.verified, verified_by: h.verified_by ?? null, verified_at: h.verified_at ?? null,
    notes: h.notes ?? null, home_id: candidate.home_id, created_at: h.created_at,
  }));

  // Serialize gaps
  const serializedGaps = gaps.map((g) => ({
    id: g.id, candidate_id: g.candidate_id,
    gap_start: g.gap_start, gap_end: g.gap_end, gap_days: g.gap_days,
    explanation: g.explanation_text ?? null,
    review_status: g.status === "satisfactory" ? "satisfactory"
      : g.status === "unsatisfactory" || g.status === "escalated" ? "concern"
      : "unreviewed",
    reviewed_by: g.reviewed_by ?? null, reviewed_at: g.reviewed_at ?? null,
    home_id: candidate.home_id,
  }));

  // Serialize interviews
  const serializedInterviews = interviews.map((i) => ({
    id: i.id, candidate_id: i.candidate_id,
    scheduled_at: i.scheduled_at, mode: i.mode, location: i.location ?? null,
    status: i.completed_at ? "completed" : "scheduled",
    panel_members: i.panel.map((p) => p.staff_id),
    safer_recruitment_trained: i.panel.some((p) => p.safer_recruitment_trained),
    recommendation: i.recommendation
      ? (["strongly_recommend", "recommend"].includes(i.recommendation) ? "proceed"
        : i.recommendation === "do_not_recommend" ? "decline" : "hold")
      : null,
    overall_score: null, scores_by_category: null,
    notes: i.rationale ?? null, home_id: candidate.home_id, created_at: i.created_at,
  }));

  // Serialize offer
  const offer = offerRaw ? {
    id: offerRaw.id, candidate_id: offerRaw.candidate_id,
    status: ["conditional_sent", "conditional_accepted"].includes(offerRaw.status)
      ? "conditional"
      : ["final_sent", "final_accepted"].includes(offerRaw.status) ? "unconditional"
      : offerRaw.status === "withdrawn" ? "withdrawn" : "not_made",
    offer_date: offerRaw.conditional_offer_sent_at ?? null,
    proposed_start_date: offerRaw.proposed_start_date ?? null,
    role_title: role_applied, salary: offerRaw.salary ?? null,
    hours_per_week: offerRaw.hours ?? null,
    exceptional_start: offerRaw.exceptional_start,
    exceptional_start_risk_mitigation: offerRaw.exceptional_start_risk_mitigation ?? null,
    final_clearance_given: !!offerRaw.final_clearance_completed_at,
    final_clearance_date: offerRaw.final_clearance_completed_at ?? null,
    final_clearance_by: offerRaw.final_clearance_by ?? null,
    contract_generated: false, contract_generated_at: null,
    home_id: candidate.home_id, created_at: offerRaw.created_at,
  } : null;

  // Serialize audit
  const serializedAudit = audit.map((a) => ({
    id: a.id, candidate_id: a.candidate_id ?? candidateId,
    event_type: a.event_type, actor: a.actor_id, actor_role: "manager",
    summary: a.notes ?? `${a.event_type.replace(/_/g, " ")} recorded`,
    changes: null, performed_at: a.created_at, home_id: candidate.home_id,
  }));

  // Compute compliance score
  const requiredChecks = checks.filter((c) => c.required);
  const verifiedChecks = requiredChecks.filter((c) =>
    c.status === "verified" || c.status === "override_approved"
  );
  const compliance_score = requiredChecks.length > 0
    ? Math.round((verifiedChecks.length / requiredChecks.length) * 100)
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const days_in_stage = Math.max(0, Math.floor(
    (new Date(today).getTime() - new Date(candidate.updated_at.slice(0, 10)).getTime()) / 86400000
  ));

  return NextResponse.json({
    data: {
      id: candidate.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone ?? null,
      role_applied,
      stage: candidate.current_stage,
      source: candidate.source ?? null,
      cv_url: candidate.cv_url ?? null,
      compliance_score,
      risk_level: candidate.risk_level,
      days_in_stage,
      days_total: days_in_stage,
      manager_assigned: candidate.assigned_manager_id ?? null,
      interview_date: serializedInterviews[0]?.scheduled_at ?? null,
      interview_notes: null,
      offer_date: offerRaw?.conditional_offer_sent_at ?? null,
      start_date: offerRaw?.proposed_start_date ?? null,
      notes: candidate.notes ?? null,
      // Rules engine output — populated from real data
      blocker_summary: rules.blockers.map((b) => b.message),
      next_actions: rules.auto_tasks.map((t) => t.title),
      checks: serializedChecks,
      references: serializedRefs,
      employment_history: serializedHistory,
      employment_gaps: serializedGaps,
      interviews: serializedInterviews,
      offer,
      audit: serializedAudit,
      home_id: candidate.home_id,
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
      created_by: candidate.created_by,
      updated_by: candidate.created_by,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params;
  const body = await req.json();

  const candidate = db.candidateProfiles.findById(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // ── Guard: if requesting a stage advance, enforce rules engine ───────────────
  if (body.stage && body.stage !== candidate.current_stage) {
    const newStageIdx = STAGE_ORDER.indexOf(body.stage as typeof STAGE_ORDER[number]);
    const currentIdx = STAGE_ORDER.indexOf(candidate.current_stage as typeof STAGE_ORDER[number]);
    const isForwardProgress = newStageIdx > currentIdx;

    // Exempt: moving to unsuccessful/withdrawn is always allowed
    const exemptStages = ["unsuccessful", "withdrawn"];
    if (isForwardProgress && !exemptStages.includes(body.stage)) {
      const checks = db.candidateChecks.findByCandidate(candidateId);
      const references = db.candidateReferences.findByCandidate(candidateId);
      const gaps = db.gapExplanations.findByCandidate(candidateId);
      const offer = db.conditionalOffers.findByCandidate(candidateId) ?? null;

      // Temporarily use the target stage to evaluate rules against the destination
      const candidateAtTarget = { ...candidate, current_stage: body.stage };
      const rules = evaluateCandidateRules(candidateAtTarget, checks, references, gaps, offer);

      if (!rules.can_progress && rules.blockers.length > 0) {
        return NextResponse.json(
          {
            error: "Stage advancement blocked by compliance issues",
            blockers: rules.blockers.map((b) => b.message),
          },
          { status: 422 }
        );
      }
    }
  }

  const updated = db.candidateProfiles.update(candidateId, {
    ...(body.stage && { current_stage: body.stage }),
    ...(body.risk_level && { risk_level: body.risk_level }),
    ...(body.notes !== undefined && { notes: body.notes }),
    ...(body.assigned_manager_id && { assigned_manager_id: body.assigned_manager_id }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Write audit entry
  db.recruitmentAudit.create({
    candidate_id: candidateId,
    vacancy_id: updated.vacancy_id ?? undefined,
    actor_id: "staff_darren",
    event_type: body.stage ? "stage_changed" : "candidate_updated",
    entity_type: "candidate_profile",
    entity_id: candidateId,
    before_state: null,
    after_state: body,
    notes: body.stage
      ? `Stage changed to ${body.stage}`
      : `Candidate updated: ${Object.keys(body).join(", ")}`,
  });

  return NextResponse.json({ data: updated });
}
