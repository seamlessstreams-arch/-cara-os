// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses recruitment pipeline health, candidate compliance, check completion,
// reference verification, SCR readiness, and Schedule 2 completeness.
//
// Regulatory: Reg 32 (fitness of workers), Reg 33 (employment of staff),
// Reg 34 (single central record), Schedule 2 (information to be obtained
// in respect of persons working at children's homes).
// SCCIF: Leadership & Management — "Are safer recruitment processes robust?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type CandidateStage =
  | "enquiry"
  | "application_received"
  | "sift"
  | "interview_scheduled"
  | "interview_completed"
  | "references_requested"
  | "references_received"
  | "conditional_offer"
  | "pre_start_checks"
  | "final_clearance"
  | "onboarding"
  | "appointed"
  | "started"
  | "unsuccessful"
  | "withdrawn";

export type CheckType =
  | "enhanced_dbs"
  | "barred_list"
  | "right_to_work"
  | "identity"
  | "references"
  | "qualification"
  | "overseas_police"
  | "health_declaration"
  | "prohibition_check";

export type CheckStatus =
  | "not_started"
  | "requested"
  | "in_progress"
  | "received"
  | "verified"
  | "concern_flagged"
  | "failed";

export type ReferenceStatus =
  | "not_requested"
  | "requested"
  | "chased"
  | "received"
  | "satisfactory"
  | "unsatisfactory"
  | "discrepancy";

export interface VacancyInput {
  id: string;
  title: string;
  status: "draft" | "open" | "on_hold" | "closed" | "filled";
  created_at: string;
}

export interface CandidateInput {
  id: string;
  name: string;
  vacancy_id: string;
  current_stage: CandidateStage;
  compliance_status: "not_started" | "in_progress" | "compliant" | "blocked";
  risk_level: "low" | "medium" | "high";
  shortlisted: boolean;
  appointed: boolean;
  created_at: string;
}

export interface CheckInput {
  id: string;
  candidate_id: string;
  check_type: CheckType;
  status: CheckStatus;
  required: boolean;
  due_date: string | null;
  requested_at: string | null;
  received_at: string | null;
  verified_at: string | null;
  concern_flag: boolean;
  override_used: boolean;
}

export interface ReferenceInput {
  id: string;
  candidate_id: string;
  is_most_recent_employer: boolean;
  status: ReferenceStatus;
  requested_at: string | null;
  received_at: string | null;
  chased_at: string | null;
  verbal_verification_completed: boolean;
  discrepancy_flag: boolean;
  reliability_rating: "high" | "medium" | "low" | null;
}

export interface ConditionalOfferInput {
  id: string;
  candidate_id: string;
  status: "draft" | "conditional_sent" | "accepted" | "declined" | "withdrawn";
  proposed_start_date: string | null;
  exceptional_start: boolean;
  conditions: string[];
  final_clearance_completed_at: string | null;
}

export interface SaferRecruitmentIntelligenceInput {
  vacancies: VacancyInput[];
  candidates: CandidateInput[];
  checks: CheckInput[];
  references: ReferenceInput[];
  offers: ConditionalOfferInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface RecruitmentOverview {
  total_vacancies: number;
  open_vacancies: number;
  total_candidates: number;
  active_candidates: number;
  candidates_by_stage: Record<string, number>;
  avg_days_in_pipeline: number;
  overdue_checks: number;
  outstanding_references: number;
  compliance_rate: number; // pct of active candidates with all required checks verified
  dbs_completion_rate: number; // pct of active candidates with DBS verified
  schedule2_completion_rate: number; // pct of active candidates meeting full Schedule 2
}

export interface CandidateRecruitmentProfile {
  candidate_id: string;
  candidate_name: string;
  vacancy_title: string;
  current_stage: CandidateStage;
  days_in_pipeline: number;
  total_checks: number;
  completed_checks: number;
  check_completion_pct: number;
  overdue_checks: number;
  dbs_status: CheckStatus | "none";
  references_received: number;
  references_total: number;
  has_recent_employer_ref: boolean;
  verbal_verifications_done: number;
  verbal_verifications_total: number;
  risk_flags: string[];
  has_conditional_offer: boolean;
  exceptional_start: boolean;
  can_start: boolean;
}

export interface CheckTypeAnalysis {
  check_type: CheckType;
  total: number;
  verified: number;
  in_progress: number;
  not_started: number;
  overdue: number;
  concern_flagged: number;
  completion_rate: number;
}

export interface RecruitmentAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraRecruitmentInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface SaferRecruitmentIntelligenceResult {
  overview: RecruitmentOverview;
  candidate_profiles: CandidateRecruitmentProfile[];
  check_analysis: CheckTypeAnalysis[];
  alerts: RecruitmentAlert[];
  insights: CaraRecruitmentInsight[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const TERMINAL_STAGES = new Set<CandidateStage>([
  "appointed",
  "started",
  "unsuccessful",
  "withdrawn",
]);

/** Schedule 2 required check types — the minimum for Reg 33 compliance. */
const SCHEDULE_2_CHECKS: CheckType[] = [
  "enhanced_dbs",
  "right_to_work",
  "identity",
  "references",
];

const ADVANCED_STAGES = new Set<CandidateStage>([
  "pre_start_checks",
  "final_clearance",
  "onboarding",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function daysUntil(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function isCheckComplete(status: CheckStatus): boolean {
  return status === "verified" || status === "received";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeSaferRecruitmentIntelligence(
  input: SaferRecruitmentIntelligenceInput,
): SaferRecruitmentIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { vacancies, candidates, checks, references, offers } = input;

  // ── Index maps ─────────────────────────────────────────────────────────
  const checksByCandidate = new Map<string, CheckInput[]>();
  for (const c of checks) {
    const arr = checksByCandidate.get(c.candidate_id) ?? [];
    arr.push(c);
    checksByCandidate.set(c.candidate_id, arr);
  }

  const refsByCandidate = new Map<string, ReferenceInput[]>();
  for (const r of references) {
    const arr = refsByCandidate.get(r.candidate_id) ?? [];
    arr.push(r);
    refsByCandidate.set(r.candidate_id, arr);
  }

  const offersByCandidate = new Map<string, ConditionalOfferInput[]>();
  for (const o of offers) {
    const arr = offersByCandidate.get(o.candidate_id) ?? [];
    arr.push(o);
    offersByCandidate.set(o.candidate_id, arr);
  }

  const vacancyMap = new Map<string, VacancyInput>();
  for (const v of vacancies) vacancyMap.set(v.id, v);

  // ── Active candidates ──────────────────────────────────────────────────
  const activeCandidates = candidates.filter(
    (c) => !TERMINAL_STAGES.has(c.current_stage),
  );

  // ── Overview ──────────────────────────────────────────────────────────
  const openVacancies = vacancies.filter((v) => v.status === "open");

  const candidatesByStage: Record<string, number> = {};
  for (const c of activeCandidates) {
    candidatesByStage[c.current_stage] =
      (candidatesByStage[c.current_stage] ?? 0) + 1;
  }

  const pipelineDays = activeCandidates.map((c) =>
    daysBetween(c.created_at.slice(0, 10), today),
  );
  const avgDaysInPipeline = Math.round(average(pipelineDays));

  // Overdue checks: required checks past due_date for active candidates
  const activeCandidateIds = new Set(activeCandidates.map((c) => c.id));
  const allActiveChecks = checks.filter(
    (c) => activeCandidateIds.has(c.candidate_id) && c.required,
  );
  const overdueChecks = allActiveChecks.filter(
    (c) =>
      c.due_date !== null &&
      c.due_date < today &&
      !isCheckComplete(c.status) &&
      c.status !== "verified",
  );

  // Outstanding references: requested but not received/satisfactory for active candidates
  const activeRefs = references.filter((r) =>
    activeCandidateIds.has(r.candidate_id),
  );
  const outstandingRefs = activeRefs.filter(
    (r) =>
      r.status === "requested" ||
      r.status === "chased" ||
      r.status === "not_requested",
  );

  // Compliance rate: active candidates with ALL required checks verified
  let fullyCompliant = 0;
  let dbsComplete = 0;
  let schedule2Complete = 0;

  for (const cand of activeCandidates) {
    const candChecks = checksByCandidate.get(cand.id) ?? [];
    const requiredChecks = candChecks.filter((c) => c.required);
    const allVerified =
      requiredChecks.length > 0 &&
      requiredChecks.every((c) => c.status === "verified");
    if (allVerified) fullyCompliant++;

    // DBS specifically
    const dbsCheck = candChecks.find((c) => c.check_type === "enhanced_dbs");
    if (dbsCheck && dbsCheck.status === "verified") dbsComplete++;

    // Schedule 2: all four core check types present and verified
    const s2Met = SCHEDULE_2_CHECKS.every((type) => {
      const ch = candChecks.find((c) => c.check_type === type);
      return ch && ch.status === "verified";
    });
    if (s2Met) schedule2Complete++;
  }

  const complianceRate =
    activeCandidates.length > 0
      ? Math.round((fullyCompliant / activeCandidates.length) * 100)
      : 100;

  const dbsCompletionRate =
    activeCandidates.length > 0
      ? Math.round((dbsComplete / activeCandidates.length) * 100)
      : 100;

  const schedule2CompletionRate =
    activeCandidates.length > 0
      ? Math.round((schedule2Complete / activeCandidates.length) * 100)
      : 100;

  const overview: RecruitmentOverview = {
    total_vacancies: vacancies.length,
    open_vacancies: openVacancies.length,
    total_candidates: candidates.length,
    active_candidates: activeCandidates.length,
    candidates_by_stage: candidatesByStage,
    avg_days_in_pipeline: avgDaysInPipeline,
    overdue_checks: overdueChecks.length,
    outstanding_references: outstandingRefs.length,
    compliance_rate: complianceRate,
    dbs_completion_rate: dbsCompletionRate,
    schedule2_completion_rate: schedule2CompletionRate,
  };

  // ── Candidate Profiles ─────────────────────────────────────────────────
  const candidate_profiles: CandidateRecruitmentProfile[] =
    activeCandidates.map((cand) => {
      const candChecks = checksByCandidate.get(cand.id) ?? [];
      const candRefs = refsByCandidate.get(cand.id) ?? [];
      const candOffers = offersByCandidate.get(cand.id) ?? [];

      const requiredChecks = candChecks.filter((c) => c.required);
      const completedChecks = requiredChecks.filter((c) =>
        isCheckComplete(c.status),
      );
      const overdueForCandidate = requiredChecks.filter(
        (c) =>
          c.due_date !== null &&
          c.due_date < today &&
          !isCheckComplete(c.status),
      );

      // DBS
      const dbsCheck = candChecks.find((c) => c.check_type === "enhanced_dbs");
      const dbsStatus: CheckStatus | "none" = dbsCheck
        ? dbsCheck.status
        : "none";

      // References
      const refsReceived = candRefs.filter(
        (r) =>
          r.status === "received" ||
          r.status === "satisfactory",
      ).length;
      const hasRecentEmployerRef = candRefs.some(
        (r) =>
          r.is_most_recent_employer &&
          (r.status === "received" || r.status === "satisfactory"),
      );

      // Verbal verifications
      const verbalDone = candRefs.filter(
        (r) => r.verbal_verification_completed,
      ).length;

      // Risk flags
      const riskFlags: string[] = [];
      if (dbsStatus === "none" || dbsStatus === "not_started") {
        riskFlags.push("DBS not started");
      }
      if (dbsStatus === "concern_flagged" || dbsStatus === "failed") {
        riskFlags.push("DBS concern flagged");
      }
      if (overdueForCandidate.length > 0) {
        riskFlags.push(`${overdueForCandidate.length} overdue check(s)`);
      }
      if (
        candRefs.length > 0 &&
        refsReceived === 0 &&
        cand.current_stage !== "enquiry" &&
        cand.current_stage !== "application_received" &&
        cand.current_stage !== "sift"
      ) {
        riskFlags.push("No references received");
      }
      if (candRefs.some((r) => r.discrepancy_flag)) {
        riskFlags.push("Reference discrepancy flagged");
      }
      if (candChecks.some((c) => c.override_used)) {
        riskFlags.push("Override used on check");
      }

      // Conditional offer
      const hasOffer = candOffers.length > 0;
      const exceptionalStart = candOffers.some((o) => o.exceptional_start);

      // Can start: all required checks verified, DBS verified, 2+ refs satisfactory
      const allRequiredVerified =
        requiredChecks.length > 0 &&
        requiredChecks.every((c) => c.status === "verified");
      const refsSatisfactory = candRefs.filter(
        (r) => r.status === "satisfactory",
      ).length;
      const canStart =
        allRequiredVerified && refsSatisfactory >= 2 && dbsStatus === "verified";

      const daysInPipeline = daysBetween(cand.created_at.slice(0, 10), today);

      const vacancy = vacancyMap.get(cand.vacancy_id);

      return {
        candidate_id: cand.id,
        candidate_name: cand.name,
        vacancy_title: vacancy?.title ?? "Unknown",
        current_stage: cand.current_stage,
        days_in_pipeline: daysInPipeline,
        total_checks: requiredChecks.length,
        completed_checks: completedChecks.length,
        check_completion_pct:
          requiredChecks.length > 0
            ? Math.round((completedChecks.length / requiredChecks.length) * 100)
            : 100,
        overdue_checks: overdueForCandidate.length,
        dbs_status: dbsStatus,
        references_received: refsReceived,
        references_total: candRefs.length,
        has_recent_employer_ref: hasRecentEmployerRef,
        verbal_verifications_done: verbalDone,
        verbal_verifications_total: candRefs.length,
        risk_flags: riskFlags,
        has_conditional_offer: hasOffer,
        exceptional_start: exceptionalStart,
        can_start: canStart,
      };
    });

  // ── Check Type Analysis ────────────────────────────────────────────────
  const checkTypeMap = new Map<CheckType, CheckInput[]>();
  for (const c of allActiveChecks) {
    const arr = checkTypeMap.get(c.check_type) ?? [];
    arr.push(c);
    checkTypeMap.set(c.check_type, arr);
  }

  const check_analysis: CheckTypeAnalysis[] = [...checkTypeMap.entries()]
    .map(([check_type, items]) => {
      const verified = items.filter((c) => c.status === "verified").length;
      const inProgress = items.filter(
        (c) =>
          c.status === "in_progress" ||
          c.status === "requested" ||
          c.status === "received",
      ).length;
      const notStarted = items.filter(
        (c) => c.status === "not_started",
      ).length;
      const overdue = items.filter(
        (c) =>
          c.due_date !== null &&
          c.due_date < today &&
          !isCheckComplete(c.status),
      ).length;
      const concernFlagged = items.filter((c) => c.concern_flag).length;

      return {
        check_type,
        total: items.length,
        verified,
        in_progress: inProgress,
        not_started: notStarted,
        overdue,
        concern_flagged: concernFlagged,
        completion_rate:
          items.length > 0 ? Math.round((verified / items.length) * 100) : 100,
      };
    })
    .sort((a, b) => a.completion_rate - b.completion_rate); // worst completion first

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: RecruitmentAlert[] = [];

  // Critical: candidates in advanced stages without DBS
  const advancedNoDbs = candidate_profiles.filter(
    (p) =>
      ADVANCED_STAGES.has(p.current_stage) &&
      (p.dbs_status === "none" || p.dbs_status === "not_started"),
  );
  for (const p of advancedNoDbs) {
    alerts.push({
      severity: "critical",
      message: `${p.candidate_name} is at ${formatStage(p.current_stage)} without a DBS check started. No candidate may start work without an enhanced DBS (Reg 32, Schedule 2).`,
    });
  }

  // Critical: DBS concern flagged
  const dbsConcerns = candidate_profiles.filter(
    (p) =>
      p.dbs_status === "concern_flagged" || p.dbs_status === "failed",
  );
  for (const p of dbsConcerns) {
    alerts.push({
      severity: "critical",
      message: `${p.candidate_name} has a DBS concern flagged. A risk assessment must be completed before any decision to proceed. Document rationale fully.`,
    });
  }

  // High: overdue checks
  if (overdueChecks.length > 0) {
    const candidatesWithOverdue = new Set(overdueChecks.map((c) => c.candidate_id));
    alerts.push({
      severity: "high",
      message: `${overdueChecks.length} check(s) overdue across ${candidatesWithOverdue.size} candidate(s). Delays in completing checks compromise safer recruitment timelines and SCR compliance.`,
    });
  }

  // High: exceptional starts
  const exceptionalStarters = candidate_profiles.filter(
    (p) => p.exceptional_start,
  );
  if (exceptionalStarters.length > 0) {
    for (const p of exceptionalStarters) {
      alerts.push({
        severity: "high",
        message: `${p.candidate_name} has an exceptional start arrangement. Ensure risk assessment and mitigation plan are in place with documented rationale and RM approval.`,
      });
    }
  }

  // Medium: references not received for candidates beyond interview stage
  const POST_INTERVIEW = new Set<CandidateStage>([
    "references_requested",
    "references_received",
    "conditional_offer",
    "pre_start_checks",
    "final_clearance",
    "onboarding",
  ]);

  const noRefsPostInterview = candidate_profiles.filter(
    (p) =>
      POST_INTERVIEW.has(p.current_stage) &&
      p.references_received === 0,
  );
  for (const p of noRefsPostInterview) {
    alerts.push({
      severity: "medium",
      message: `${p.candidate_name} has progressed to ${formatStage(p.current_stage)} but has no references received. Schedule 2 requires at least two references before appointment.`,
    });
  }

  // Medium: reference discrepancies
  const discrepancyCandidates = candidate_profiles.filter((p) =>
    p.risk_flags.includes("Reference discrepancy flagged"),
  );
  for (const p of discrepancyCandidates) {
    alerts.push({
      severity: "medium",
      message: `Reference discrepancy flagged for ${p.candidate_name}. Investigate and document the discrepancy — this may affect suitability decisions.`,
    });
  }

  // Low: candidates in pipeline for extended periods (> 60 days)
  const longPipeline = candidate_profiles.filter(
    (p) => p.days_in_pipeline > 60,
  );
  if (longPipeline.length > 0) {
    alerts.push({
      severity: "low",
      message: `${longPipeline.length} candidate(s) in the pipeline for over 60 days. Prolonged recruitment processes may indicate bottlenecks or require re-assessment.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraRecruitmentInsight[] = [];

  // Critical: any candidate at pre-start or beyond without full Schedule 2
  const advancedNoSchedule2 = candidate_profiles.filter(
    (p) => ADVANCED_STAGES.has(p.current_stage) && p.check_completion_pct < 100,
  );
  if (advancedNoSchedule2.length > 0) {
    insights.push({
      severity: "critical",
      text: `${advancedNoSchedule2.length} candidate(s) in advanced stages without full check completion. Reg 33 and Schedule 2 require all checks to be verified before a candidate can begin work. Proceeding without clearance is a regulatory breach.`,
    });
  }

  // Warning: low DBS completion rate
  if (dbsCompletionRate < 50 && activeCandidates.length > 0) {
    insights.push({
      severity: "warning",
      text: `Only ${dbsCompletionRate}% of active candidates have a verified DBS. Enhanced DBS with barred list check is the single most critical safeguarding requirement for staff in children's homes. Prioritise DBS submissions.`,
    });
  }

  // Warning: outstanding references
  if (outstandingRefs.length > 0 && activeCandidates.length > 0) {
    const pct = Math.round(
      (outstandingRefs.length / activeRefs.length) * 100,
    );
    if (pct >= 50) {
      insights.push({
        severity: "warning",
        text: `${pct}% of references are still outstanding. Ofsted expects references to be received, verbally verified, and checked for discrepancies before appointment. Chase outstanding referees promptly.`,
      });
    }
  }

  // Warning: overdue checks
  if (overdueChecks.length > 0) {
    insights.push({
      severity: "warning",
      text: `${overdueChecks.length} pre-employment check(s) are overdue. Timeliness in completing checks demonstrates a proactive approach to safeguarding and prevents SCR gaps.`,
    });
  }

  // Positive: all active candidates have DBS verified
  if (
    dbsCompletionRate === 100 &&
    activeCandidates.length > 0
  ) {
    insights.push({
      severity: "positive",
      text: `All ${activeCandidates.length} active candidate(s) have a verified DBS. This demonstrates robust management of the most critical pre-employment check — an inspector would note this positively.`,
    });
  }

  // Positive: full Schedule 2 compliance
  if (
    schedule2CompletionRate === 100 &&
    activeCandidates.length > 0
  ) {
    insights.push({
      severity: "positive",
      text: `All active candidates meet full Schedule 2 requirements. The SCR is complete for every candidate in the pipeline — a clear indicator of strong safer recruitment practice.`,
    });
  }

  // Positive: verbal verification of all references
  const allRefsVerballyVerified =
    activeRefs.length > 0 &&
    activeRefs.every(
      (r) =>
        r.verbal_verification_completed ||
        r.status === "not_requested" ||
        r.status === "requested" ||
        r.status === "chased",
    );
  const receivedRefs = activeRefs.filter(
    (r) => r.status === "received" || r.status === "satisfactory",
  );
  const allReceivedVerbally =
    receivedRefs.length > 0 &&
    receivedRefs.every((r) => r.verbal_verification_completed);
  if (allReceivedVerbally && receivedRefs.length >= 2) {
    insights.push({
      severity: "positive",
      text: `All ${receivedRefs.length} received references have been verbally verified. This extra diligence goes beyond minimum requirements and strengthens the evidence base for suitability assessments.`,
    });
  }

  // Positive: no overdue checks
  if (overdueChecks.length === 0 && allActiveChecks.length > 0) {
    insights.push({
      severity: "positive",
      text: `No overdue pre-employment checks across ${allActiveChecks.length} active check(s). Timely completion of safer recruitment checks demonstrates well-organised SCR management.`,
    });
  }

  return {
    overview,
    candidate_profiles,
    check_analysis,
    alerts,
    insights,
  };
}

// ── Formatting ──────────────────────────────────────────────────────────────

function formatStage(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
