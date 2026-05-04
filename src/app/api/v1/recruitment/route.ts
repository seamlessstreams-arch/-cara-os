import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import type {
  CandidateEnriched, CandidateProfile, CandidateCheck,
  CandidateReference, RulesResult, RulesBlocker, RulesWarning,
  RecruitmentStageV2,
} from "@/types/recruitment";

// ── Rules Engine ──────────────────────────────────────────────────────────────

function runRulesEngine(
  candidate: CandidateProfile,
  checks: CandidateCheck[],
  references: CandidateReference[],
): RulesResult {
  const blockers: RulesBlocker[] = [];
  const warnings: RulesWarning[] = [];

  // Rule: minimum 2 satisfactory references required
  const satisfactoryRefs = references.filter(
    (r) => r.status === "satisfactory" || r.status === "verbal_only"
  );
  if (satisfactoryRefs.length < 2) {
    blockers.push({
      code: "REF_INSUFFICIENT",
      message: `Only ${satisfactoryRefs.length} of 2 required references are satisfactory.`,
      entity_type: "candidate_reference",
      entity_id: null,
      severity: "blocker",
    });
  }

  // Rule: enhanced DBS concern flagged
  const dbsCheck = checks.find((c) => c.check_type === "enhanced_dbs");
  if (dbsCheck?.status === "concern_flagged") {
    blockers.push({
      code: "DBS_CONCERN_FLAGGED",
      message: "Enhanced DBS has returned with a concern. Manager review required before progressing.",
      entity_type: "candidate_check",
      entity_id: dbsCheck.id,
      severity: "blocker",
    });
  }

  // Rule: right to work not verified at conditional_offer stage or beyond
  const lateStages: RecruitmentStageV2[] = [
    "conditional_offer", "pre_start_checks", "final_clearance", "onboarding", "appointed",
  ];
  const rtwCheck = checks.find((c) => c.check_type === "right_to_work");
  if (lateStages.includes(candidate.current_stage) && rtwCheck?.status !== "verified") {
    blockers.push({
      code: "RTW_NOT_VERIFIED",
      message: "Right to Work has not been verified. This is a legal requirement before an offer can proceed.",
      entity_type: "candidate_check",
      entity_id: rtwCheck?.id || null,
      severity: "blocker",
    });
  }

  // Rule: exceptional start without risk mitigation
  const offer = db.conditionalOffers.findByCandidate(candidate.id);
  if (offer?.exceptional_start && !offer.exceptional_start_risk_mitigation) {
    blockers.push({
      code: "EXCEPTIONAL_START_NO_MITIGATION",
      message: "Exceptional start has been approved but no risk mitigation plan has been documented.",
      entity_type: "conditional_offer",
      entity_id: offer.id,
      severity: "blocker",
    });
  }

  // Warning: any unexplained employment gaps
  const gaps = db.gapExplanations.findByCandidate(candidate.id);
  const openGaps = gaps.filter(
    (g) => g.status === "detected" || g.status === "explanation_requested"
  );
  for (const gap of openGaps) {
    warnings.push({
      code: "GAP_UNRESOLVED",
      message: `Employment gap of ${gap.gap_days} days (${gap.gap_start} to ${gap.gap_end}) has not been satisfactorily explained.`,
      recommended_action: "Request written explanation from candidate and review.",
    });
  }

  // Warning: references have discrepancies
  const discrepancyRefs = references.filter((r) => r.discrepancy_flag);
  for (const ref of discrepancyRefs) {
    warnings.push({
      code: "REFERENCE_DISCREPANCY",
      message: `Discrepancy flagged on reference from ${ref.referee_name}: ${ref.discrepancy_notes || "see reference record"}`,
      recommended_action: "Investigate discrepancy before progressing candidate.",
    });
  }

  // Compliance score: count verified checks / total required checks
  const requiredChecks = checks.filter((c) => c.required);
  const verifiedChecks = requiredChecks.filter((c) => c.status === "verified" || c.status === "override_approved");
  const compliance_score = requiredChecks.length > 0
    ? Math.round((verifiedChecks.length / requiredChecks.length) * 100)
    : 0;

  // Compute permitted next stages based on current stage
  const stageOrder: RecruitmentStageV2[] = [
    "enquiry", "application_received", "sift", "interview_scheduled",
    "interview_completed", "references_requested", "references_received",
    "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
    "final_clearance", "onboarding", "appointed",
  ];
  const currentIdx = stageOrder.indexOf(candidate.current_stage);
  const permitted_next_stages: RecruitmentStageV2[] =
    blockers.length === 0 && currentIdx >= 0 && currentIdx < stageOrder.length - 1
      ? [stageOrder[currentIdx + 1], "unsuccessful", "withdrawn"]
      : ["unsuccessful", "withdrawn"];

  const can_progress = blockers.length === 0;

  // Auto-task suggestions
  const auto_tasks = [];
  if (dbsCheck && dbsCheck.status === "not_started" && lateStages.includes(candidate.current_stage)) {
    auto_tasks.push({
      title: "Submit Enhanced DBS Application",
      description: `Submit DBS application for ${candidate.first_name} ${candidate.last_name} via the DBS online portal.`,
      owner_role: "registered_manager",
      due_days_from_now: 3,
      priority: "high" as const,
    });
  }
  if (satisfactoryRefs.length < 2) {
    auto_tasks.push({
      title: "Chase Outstanding References",
      description: `${2 - satisfactoryRefs.length} reference(s) outstanding for ${candidate.first_name} ${candidate.last_name}. Follow up with referees.`,
      owner_role: "registered_manager",
      due_days_from_now: 2,
      priority: "medium" as const,
    });
  }

  const aria_suggestions = [
    ...(blockers.length > 0 ? [`${blockers.length} compliance blocker(s) must be resolved before this candidate can progress.`] : []),
    ...(warnings.length > 0 ? [`${warnings.length} warning(s) require attention.`] : []),
    ...(compliance_score < 50 ? ["Compliance score is below 50% — prioritise completing outstanding checks."] : []),
  ];

  return {
    candidate_id: candidate.id,
    can_progress,
    permitted_next_stages,
    blockers,
    warnings,
    auto_tasks,
    aria_suggestions,
  };
}

// ── Enrich a candidate with all related data (internal) ──────────────────────

function enrichCandidate(candidate: CandidateProfile): CandidateEnriched {
  const checks = db.candidateChecks.findByCandidate(candidate.id);
  const references = db.candidateReferences.findByCandidate(candidate.id);
  const employment_history = db.employmentHistory.findByCandidate(candidate.id);
  const gaps = db.gapExplanations.findByCandidate(candidate.id);
  const interviews = db.candidateInterviews.findByCandidate(candidate.id);
  const offer = db.conditionalOffers.findByCandidate(candidate.id);
  const vacancy = candidate.vacancy_id ? db.vacancies.findById(candidate.vacancy_id) || null : null;
  const rules = runRulesEngine(candidate, checks, references);

  const requiredChecks = checks.filter((c) => c.required);
  const verifiedChecks = requiredChecks.filter((c) => c.status === "verified" || c.status === "override_approved");
  const compliance_score = requiredChecks.length > 0
    ? Math.round((verifiedChecks.length / requiredChecks.length) * 100)
    : 0;

  const today = todayStr();
  const updatedDate = candidate.updated_at.slice(0, 10);
  const msPerDay = 86400000;
  const days_in_stage = Math.max(
    0,
    Math.floor((new Date(today).getTime() - new Date(updatedDate).getTime()) / msPerDay)
  );

  return {
    ...candidate,
    vacancy,
    checks,
    references,
    employment_history,
    gaps,
    interviews,
    offer: offer || null,
    rules,
    compliance_score,
    days_in_stage,
  };
}

// ── Serialize enriched candidate → CandidateDetail shape (hook / page types) ─

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeCandidate(e: CandidateEnriched): Record<string, any> {
  const vacancy = e.vacancy as { title?: string } | null;
  const role_applied = vacancy?.title ?? "Care Worker";

  const checks = e.checks.map((c) => ({
    id: c.id,
    candidate_id: c.candidate_id,
    check_type: c.check_type,
    status: c.status,
    owner: c.owner_id ?? null,
    requested_date: c.requested_at ?? null,
    received_date: c.received_at ?? null,
    verified_by: c.verified_by ?? null,
    verified_at: c.verified_at ?? null,
    expiry_date: c.document_expiry ?? null,
    certificate_number: c.certificate_number ?? null,
    document_type: c.document_type ?? null,
    concern_flag: c.concern_flag,
    concern_notes: c.concern_summary ?? null,
    override_reason: c.override_reason ?? null,
    override_by: c.overridden_by ?? null,
    override_at: c.overridden_at ?? null,
    risk_mitigation: null,
    notes: null,
    home_id: e.home_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));

  const references = e.references.map((r) => ({
    id: r.id,
    candidate_id: r.candidate_id,
    referee_name: r.referee_name,
    referee_org: r.organisation_name ?? null,
    referee_role: r.referee_role ?? null,
    referee_email: r.email ?? null,
    referee_phone: r.phone ?? null,
    relationship: r.relationship_to_candidate,
    is_most_recent_employer: r.is_most_recent_employer,
    status: r.status,
    requested_date: r.requested_at ?? null,
    received_date: r.received_at ?? null,
    employment_dates_confirmed: r.structured_response?.dates_of_employment_confirmed ?? null,
    role_confirmed: r.structured_response?.role_confirmed ?? null,
    performance_rating: r.structured_response?.performance_rating ?? null,
    safeguarding_concerns: r.structured_response?.safeguarding_concerns ?? null,
    safeguarding_detail: null,
    would_re_employ: r.structured_response?.would_re_employ ?? null,
    would_re_employ_reason: r.structured_response?.additional_comments ?? null,
    discrepancy_flag: r.discrepancy_flag,
    discrepancy_notes: r.discrepancy_notes ?? null,
    home_id: e.home_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  const employment_history = e.employment_history.map((h) => ({
    id: h.id,
    candidate_id: h.candidate_id,
    employer: h.employer_name,
    role_title: h.role_title,
    start_date: h.start_date,
    end_date: h.end_date ?? null,
    is_current: !h.end_date,
    reason_for_leaving: h.reason_for_leaving ?? null,
    verified: h.verified,
    verified_by: h.verified_by ?? null,
    verified_at: h.verified_at ?? null,
    notes: h.notes ?? null,
    home_id: e.home_id,
    created_at: h.created_at,
  }));

  const employment_gaps = e.gaps.map((g) => ({
    id: g.id,
    candidate_id: g.candidate_id,
    gap_start: g.gap_start,
    gap_end: g.gap_end,
    gap_days: g.gap_days,
    explanation: g.explanation_text ?? null,
    review_status: g.status === "satisfactory" ? "satisfactory"
      : g.status === "unsatisfactory" ? "concern"
      : g.status === "escalated" ? "concern"
      : "unreviewed",
    reviewed_by: g.reviewed_by ?? null,
    reviewed_at: g.reviewed_at ?? null,
    home_id: e.home_id,
  }));

  const interviews = e.interviews.map((i) => ({
    id: i.id,
    candidate_id: i.candidate_id,
    scheduled_at: i.scheduled_at,
    mode: i.mode,
    location: i.location ?? null,
    status: i.completed_at ? "completed" : "scheduled",
    panel_members: i.panel.map((p) => p.staff_id),
    safer_recruitment_trained: i.panel.some((p) => p.safer_recruitment_trained),
    recommendation: i.recommendation
      ? (i.recommendation === "strongly_recommend" || i.recommendation === "recommend" ? "proceed"
         : i.recommendation === "do_not_recommend" ? "decline" : "hold")
      : null,
    overall_score: null,
    scores_by_category: null,
    notes: i.rationale ?? null,
    home_id: e.home_id,
    created_at: i.created_at,
  }));

  const offerRaw = e.offer;
  const offer = offerRaw ? {
    id: offerRaw.id,
    candidate_id: offerRaw.candidate_id,
    status: offerRaw.status === "conditional_sent" || offerRaw.status === "conditional_accepted"
      ? "conditional"
      : offerRaw.status === "final_sent" || offerRaw.status === "final_accepted"
      ? "unconditional"
      : offerRaw.status === "withdrawn" ? "withdrawn"
      : "not_made",
    offer_date: offerRaw.conditional_offer_sent_at ?? null,
    proposed_start_date: offerRaw.proposed_start_date ?? null,
    role_title: role_applied,
    salary: offerRaw.salary ?? null,
    hours_per_week: offerRaw.hours ?? null,
    exceptional_start: offerRaw.exceptional_start,
    exceptional_start_risk_mitigation: offerRaw.exceptional_start_risk_mitigation ?? null,
    final_clearance_given: !!offerRaw.final_clearance_completed_at,
    final_clearance_date: offerRaw.final_clearance_completed_at ?? null,
    final_clearance_by: offerRaw.final_clearance_by ?? null,
    contract_generated: false,
    contract_generated_at: null,
    home_id: e.home_id,
    created_at: offerRaw.created_at,
  } : null;

  const audit = db.recruitmentAudit.findByCandidate(e.id).map((a) => ({
    id: a.id,
    candidate_id: a.candidate_id ?? e.id,
    event_type: a.event_type,
    actor: a.actor_id,
    actor_role: "manager",
    summary: a.notes ?? `${a.event_type.replace(/_/g, " ")} recorded`,
    changes: null,
    performed_at: a.created_at,
    home_id: e.home_id,
  }));

  return {
    id: e.id,
    first_name: e.first_name,
    last_name: e.last_name,
    email: e.email,
    phone: e.phone ?? null,
    role_applied,
    stage: e.current_stage,
    source: e.source ?? null,
    cv_url: e.cv_url ?? null,
    compliance_score: e.compliance_score,
    risk_level: e.risk_level,
    days_in_stage: e.days_in_stage,
    days_total: e.days_in_stage,
    manager_assigned: e.assigned_manager_id ?? null,
    interview_date: e.interviews?.[0]?.scheduled_at ?? null,
    interview_notes: null,
    offer_date: offerRaw?.conditional_offer_sent_at ?? null,
    start_date: offerRaw?.proposed_start_date ?? null,
    notes: e.notes ?? null,
    blocker_summary: e.rules?.blockers.map((b) => b.message) ?? [],
    next_actions: e.rules?.auto_tasks.map((t) => t.title) ?? [],
    checks,
    references,
    employment_history,
    employment_gaps,
    interviews,
    offer,
    audit,
    home_id: e.home_id,
    created_at: e.created_at,
    updated_at: e.updated_at,
    created_by: e.created_by,
    updated_by: e.created_by,
  };
}

// ── GET /api/v1/recruitment ───────────────────────────────────────────────────

export async function GET() {
  const vacancies = db.vacancies.findAll();
  const profiles = db.candidateProfiles.findAll();
  const enriched = profiles.map(enrichCandidate);
  const candidates = enriched.map(serializeCandidate);

  // Pipeline summary
  const by_stage: Record<string, number> = {};
  for (const c of enriched) {
    by_stage[c.current_stage] = (by_stage[c.current_stage] || 0) + 1;
  }
  const blocked = enriched.filter((c) => c.rules && !c.rules.can_progress).length;
  const exceptional_starts = enriched.filter(
    (c) => c.offer?.exceptional_start === true
  ).length;

  // Alerts for the hook's ComplianceAlert shape
  const alerts: {
    candidate_id: string;
    candidate_name: string;
    issue: string;
    severity: "warning" | "critical";
    check_type: string | null;
  }[] = [];

  for (const c of enriched) {
    if (!c.rules) continue;
    for (const blocker of c.rules.blockers) {
      alerts.push({
        candidate_id: c.id,
        candidate_name: `${c.first_name} ${c.last_name}`,
        issue: blocker.message,
        severity: "critical",
        check_type: blocker.entity_type === "candidate_check" ? (blocker.entity_id ?? null) : null,
      });
    }
    for (const warning of c.rules.warnings) {
      alerts.push({
        candidate_id: c.id,
        candidate_name: `${c.first_name} ${c.last_name}`,
        issue: warning.message,
        severity: "warning",
        check_type: null,
      });
    }
  }

  // Vacancies with derived counts
  const vacanciesWithCounts = vacancies.map((v) => ({
    id: v.id,
    home_id: v.home_id,
    role_title: v.title,
    employment_type: v.employment_type,
    salary_min: v.salary_min,
    salary_max: v.salary_max,
    hours_per_week: v.hours,
    status: v.status === "open" ? "active" : v.status === "filled" ? "filled" : "closed" as const,
    posted_date: v.created_at,
    applications_count: profiles.filter((p) => p.vacancy_id === v.id).length,
    days_open: Math.max(0, Math.floor(
      (Date.now() - new Date(v.created_at).getTime()) / 86400000
    )),
    created_at: v.created_at,
  }));

  return NextResponse.json({
    candidates,
    vacancies: vacanciesWithCounts,
    alerts,
    stats: {
      total_active: enriched.filter((c) =>
        !["unsuccessful", "withdrawn", "appointed"].includes(c.current_stage)
      ).length,
      blocked,
      exceptional_starts,
      avg_days_to_appoint: 0,
    },
  });
}

// ── POST /api/v1/recruitment ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { first_name, last_name, email } = body;
  if (!first_name || !last_name || !email) {
    return NextResponse.json(
      { error: "first_name, last_name, and email are required" },
      { status: 400 }
    );
  }

  const candidate = db.candidateProfiles.create({
    home_id: "home_oak",
    vacancy_id: body.vacancy_id || null,
    first_name,
    last_name,
    preferred_name: body.preferred_name || null,
    email,
    phone: body.phone || null,
    dob: body.dob || null,
    current_address: body.current_address || null,
    source: body.source || null,
    current_stage: body.current_stage || "application_received",
    compliance_status: "not_started",
    risk_level: "low",
    shortlisted: false,
    appointed: false,
    assigned_manager_id: body.assigned_manager_id || "staff_darren",
    cv_url: body.cv_url || null,
    application_form_url: body.application_form_url || null,
    cover_letter_url: body.cover_letter_url || null,
    adjustments_requested: body.adjustments_requested || false,
    adjustments_notes: body.adjustments_notes || null,
    notes: body.notes || null,
    created_by: body.created_by || "staff_darren",
  });

  // Auto-create standard checks
  const standardChecks: Array<{ check_type: string }> = [
    { check_type: "enhanced_dbs" },
    { check_type: "right_to_work" },
    { check_type: "identity" },
    { check_type: "references" },
    { check_type: "employment_history" },
  ];

  for (const { check_type } of standardChecks) {
    db.candidateChecks.create({
      candidate_id: candidate.id,
      check_type: check_type as CandidateCheck["check_type"],
      status: "not_started",
      required: true,
      owner_id: candidate.assigned_manager_id,
      due_date: null,
      requested_at: null,
      received_at: null,
      verified_at: null,
      verified_by: null,
      concern_flag: false,
      concern_summary: null,
      override_used: false,
      override_reason: null,
      overridden_by: null,
      overridden_at: null,
      certificate_number: null,
      document_type: null,
      document_expiry: null,
      metadata: {},
    });
  }

  // Write audit entry
  db.recruitmentAudit.create({
    candidate_id: candidate.id,
    vacancy_id: candidate.vacancy_id,
    actor_id: body.created_by || "staff_darren",
    event_type: "candidate_created",
    entity_type: "candidate_profile",
    entity_id: candidate.id,
    before_state: null,
    after_state: { stage: candidate.current_stage, compliance_status: "not_started" },
    notes: `Candidate created. ${standardChecks.length} standard checks auto-created.`,
  });

  const enriched = enrichCandidate(candidate);
  return NextResponse.json({ data: enriched }, { status: 201 });
}
