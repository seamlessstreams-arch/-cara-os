// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT COMMAND CENTRE ENGINE
//
// Per-candidate compliance roll-up for the regulated safer-recruitment module:
// traffic light, start-eligibility gate, blockers, reference chase ladder,
// next best action, missing-evidence report and an Ofsted-ready staff-file
// index (Schedule 2 of the Children's Homes Regulations 2015).
//
// Pure and deterministic: all clock access via the injected `today`. Reuses
// evaluateCandidateRules + computeComplianceScore rather than duplicating the
// underlying rule set.
//
// SAFETY CONTRACT (hard rules, mirrored in tests):
//   • start_eligibility can NEVER be "cleared" without a recorded human
//     final-clearance sign-off — the engine only reports, a manager decides.
//   • "exceptional_supervised_only" requires identity + DBS evidence, a
//     recorded approver AND documented risk mitigation; otherwise the
//     candidate stays not-eligible and the gaps are listed as blockers.
//   • The engine never hides risk: every red condition is enumerated.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CandidateProfile,
  CandidateCheck,
  CandidateReference,
  CandidateInterview,
  EmploymentHistoryEntry,
  GapExplanation,
  ConditionalOffer,
  Vacancy,
  RulesBlocker,
  RulesWarning,
} from "@/types/recruitment";
import { evaluateCandidateRules, computeComplianceScore, CHECK_TYPE_LABELS } from "@/lib/recruitment-rules";

// ── Result types ──────────────────────────────────────────────────────────────

export type TrafficLight = "red" | "amber" | "green";

export type StartEligibility =
  | "not_eligible"
  | "conditional"
  | "exceptional_supervised_only"
  | "cleared";

export type ChaseState =
  | "awaiting"          // < 2 days since request
  | "remind_48h"        // 2–4 days
  | "second_reminder"   // 5–6 days
  | "escalate_manager"  // 7–9 days
  | "suggest_alternative"; // 10+ days

export interface ReferenceChaseItem {
  reference_id: string;
  referee_name: string;
  organisation: string;
  is_most_recent_employer: boolean;
  days_waiting: number;
  state: ChaseState;
  action: string;
}

export interface FileIndexItem {
  key: string;
  item: string;
  status: "on_file" | "pending" | "missing";
  detail: string;
}

export interface MissingEvidenceItem {
  item: string;
  why_it_matters: string;
  action: string;
}

export interface ExceptionalStartStatus {
  active: boolean;
  approved_by: string | null;
  has_risk_mitigation: boolean;
  identity_evidenced: boolean;
  dbs_evidenced: boolean;
  missing: string[];
  daily_review_due: boolean;
}

export interface CommandCandidate {
  candidate_id: string;
  name: string;
  role_applied: string;
  stage: string;
  days_since_application: number;
  traffic_light: TrafficLight;
  traffic_reasons: string[];
  start_eligibility: StartEligibility;
  eligibility_reason: string;
  compliance_score: number;
  blockers: RulesBlocker[];
  warnings: RulesWarning[];
  next_action: { label: string; detail: string; urgency: "urgent" | "high" | "normal" };
  references_summary: { required: number; received: number; satisfactory: number; most_recent_employer_received: boolean };
  reference_chases: ReferenceChaseItem[];
  checks_outstanding: string[];
  human_signoff: { by: string; at: string } | null;
  exceptional_start: ExceptionalStartStatus | null;
  missing_evidence: MissingEvidenceItem[];
  staff_file_index: FileIndexItem[];
  one_line_status: string;
}

export interface CommandSummary {
  total_candidates: number;
  red: number;
  amber: number;
  green: number;
  cleared: number;
  exceptional_active: number;
  references_outstanding: number;
  chases_needing_escalation: number;
  headline: string;
}

export interface SaferRecruitmentCommandResult {
  generated_for: string;
  summary: CommandSummary;
  candidates: CommandCandidate[];
}

export interface CommandCandidateInput {
  profile: CandidateProfile;
  vacancy: Vacancy | null;
  checks: CandidateCheck[];
  references: CandidateReference[];
  employment_history: EmploymentHistoryEntry[];
  gaps: GapExplanation[];
  interviews: CandidateInterview[];
  offer: ConditionalOffer | null;
}

export interface SaferRecruitmentCommandInput {
  today: string; // YYYY-MM-DD
  candidates: CommandCandidateInput[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTIVE_STAGES_EXCLUDED = new Set(["unsuccessful", "withdrawn", "appointed"]);

const SATISFACTORY_REF = new Set(["satisfactory"]);
const RECEIVED_REF = new Set(["received", "satisfactory", "unsatisfactory", "concerns_noted", "verbal_only"]);
const OUTSTANDING_REF = new Set(["requested", "chased"]);

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso.slice(0, 10) + "T00:00:00Z").getTime();
  const to = new Date(toIso.slice(0, 10) + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function chaseState(daysWaiting: number): ChaseState {
  if (daysWaiting >= 10) return "suggest_alternative";
  if (daysWaiting >= 7) return "escalate_manager";
  if (daysWaiting >= 5) return "second_reminder";
  if (daysWaiting >= 2) return "remind_48h";
  return "awaiting";
}

const CHASE_ACTIONS: Record<ChaseState, string> = {
  awaiting: "Sent — allow 48 hours before the first reminder",
  remind_48h: "Send the first reminder now",
  second_reminder: "Send the second reminder and offer a phone call",
  escalate_manager: "Escalate to the manager — consider phoning the referee directly",
  suggest_alternative: "No response after 10 days — ask the candidate for an alternative referee and record the rationale",
};

function checkOf(checks: CandidateCheck[], type: CandidateCheck["check_type"]): CandidateCheck | undefined {
  return checks.find((c) => c.check_type === type);
}

function isEvidenced(check: CandidateCheck | undefined): boolean {
  return !!check && ["received", "verified", "override_approved"].includes(check.status);
}

function isVerified(check: CandidateCheck | undefined): boolean {
  return !!check && ["verified", "override_approved"].includes(check.status);
}

// ── Per-candidate evaluation ──────────────────────────────────────────────────

function evaluateCandidate(input: CommandCandidateInput, today: string): CommandCandidate {
  const { profile, vacancy, checks, references, employment_history, gaps, interviews, offer } = input;

  const rules = evaluateCandidateRules(profile, checks, references, gaps, offer);
  const complianceScore = computeComplianceScore(checks);

  // ── References ──
  const received = references.filter((r) => RECEIVED_REF.has(r.status));
  const satisfactory = references.filter((r) => SATISFACTORY_REF.has(r.status));
  const mostRecentReceived = references.some((r) => r.is_most_recent_employer && RECEIVED_REF.has(r.status));
  const chases: ReferenceChaseItem[] = references
    .filter((r) => OUTSTANDING_REF.has(r.status) && r.requested_at)
    .map((r) => {
      const daysWaiting = daysBetween(r.requested_at as string, today);
      const state = chaseState(daysWaiting);
      return {
        reference_id: r.id,
        referee_name: r.referee_name,
        organisation: r.organisation_name,
        is_most_recent_employer: r.is_most_recent_employer,
        days_waiting: daysWaiting,
        state,
        action: CHASE_ACTIONS[state],
      };
    })
    .sort((a, b) => b.days_waiting - a.days_waiting);

  // ── Checks outstanding ──
  const checksOutstanding = checks
    .filter((c) => c.required && !isVerified(c))
    .map((c) => CHECK_TYPE_LABELS[c.check_type] ?? c.check_type);

  // ── Human sign-off ──
  const humanSignoff = offer?.final_clearance_completed_at && offer.final_clearance_by
    ? { by: offer.final_clearance_by, at: offer.final_clearance_completed_at }
    : null;

  // ── Exceptional start ──
  const identityCheck = checkOf(checks, "identity");
  const dbsCheck = checkOf(checks, "enhanced_dbs");
  let exceptional: ExceptionalStartStatus | null = null;
  if (offer?.exceptional_start) {
    const missing: string[] = [];
    const identityEvidenced = isVerified(identityCheck);
    const dbsEvidenced = isEvidenced(dbsCheck) && !dbsCheck?.concern_flag;
    if (!identityEvidenced) missing.push("Proof of identity must be verified before any exceptional start");
    if (!dbsEvidenced) missing.push("The DBS certificate must be seen (and concern-free) before any exceptional start");
    if (!offer.exceptional_start_approved_by) missing.push("Registered Manager / RI approval must be recorded");
    if (!offer.exceptional_start_risk_mitigation) missing.push("A written risk assessment and supervision plan must be documented");
    exceptional = {
      active: missing.length === 0 && !humanSignoff,
      approved_by: offer.exceptional_start_approved_by,
      has_risk_mitigation: !!offer.exceptional_start_risk_mitigation,
      identity_evidenced: identityEvidenced,
      dbs_evidenced: dbsEvidenced,
      missing,
      // An exceptional start is reviewed every day until the outstanding
      // checks are complete — so while it is active, review is always due.
      daily_review_due: missing.length === 0 && !humanSignoff,
    };
  }

  // ── Traffic light ──
  // Any rule blocker is red. Warnings / in-flight evidence is amber.
  // Green requires a complete pack AND the human sign-off.
  const trafficReasons: string[] = [];
  let traffic: TrafficLight;
  const fullyEvidenced =
    checksOutstanding.length === 0 &&
    satisfactory.length >= 2 &&
    mostRecentReceived &&
    gaps.every((g) => g.status === "satisfactory" || g.status === "unsatisfactory") &&
    !gaps.some((g) => g.status === "unsatisfactory");
  if (rules.blockers.length > 0) {
    traffic = "red";
    trafficReasons.push(...rules.blockers.map((b) => b.message));
  } else if (fullyEvidenced && humanSignoff) {
    traffic = "green";
    trafficReasons.push("All required checks verified, references satisfactory and final sign-off recorded");
  } else {
    traffic = "amber";
    if (checksOutstanding.length > 0) trafficReasons.push(`${checksOutstanding.length} required check(s) not yet verified: ${checksOutstanding.join(", ")}`);
    if (chases.length > 0) trafficReasons.push(`${chases.length} reference(s) sent but not returned`);
    const pendingGaps = gaps.filter((g) => g.status === "explanation_received" || g.status === "escalated");
    if (pendingGaps.length > 0) trafficReasons.push(`${pendingGaps.length} gap explanation(s) awaiting manager review`);
    if (fullyEvidenced && !humanSignoff) trafficReasons.push("Pack complete — awaiting the manager's final suitability sign-off");
    if (trafficReasons.length === 0) trafficReasons.push("Checks in progress — nothing currently overdue");
  }

  // ── Start eligibility (the hard gate) ──
  let eligibility: StartEligibility;
  let eligibilityReason: string;
  if (fullyEvidenced && humanSignoff && rules.blockers.length === 0) {
    eligibility = "cleared";
    eligibilityReason = `Cleared to start — final suitability sign-off recorded by ${humanSignoff.by}`;
  } else if (exceptional && exceptional.active) {
    eligibility = "exceptional_supervised_only";
    eligibilityReason = "Exceptional start approved: supervised work only, never counted in ratios, no sole charge, outstanding checks chased daily";
  } else if (offer && ["conditional_sent", "conditional_accepted"].includes(offer.status) && rules.blockers.length === 0) {
    eligibility = "conditional";
    eligibilityReason = "Conditional offer in progress — must not start until all checks complete and the manager signs off";
  } else {
    eligibility = "not_eligible";
    eligibilityReason = rules.blockers.length > 0
      ? "Blocked — outstanding safer-recruitment issues must be resolved"
      : "Not yet at conditional-offer stage";
  }

  // ── Staff file index (Schedule 2 / Ofsted evidence pack) ──
  const interviewDone = interviews.find((i) => i.completed_at && i.recommendation);
  const mostRecentJob = [...employment_history].sort((a, b) => (b.start_date > a.start_date ? 1 : -1))[0];
  const fileIndex: FileIndexItem[] = [
    fileItem("identity", "Proof of identity with recent photograph", isVerified(identityCheck) ? "on_file" : isEvidenced(identityCheck) ? "pending" : "missing",
      isVerified(identityCheck) ? "Identity documents verified" : "Identity evidence not yet verified against original documents"),
    fileItem("dbs", "Enhanced DBS with children's barred-list check", isVerified(dbsCheck) && !dbsCheck?.concern_flag ? "on_file" : isEvidenced(dbsCheck) ? "pending" : "missing",
      dbsCheck?.certificate_number ? `Certificate ${dbsCheck.certificate_number} recorded` : "Certificate details not yet recorded"),
    fileItem("references", "Two written references", satisfactory.length >= 2 ? "on_file" : received.length >= 2 ? "pending" : "missing",
      `${received.length} received, ${satisfactory.length} assessed satisfactory`),
    fileItem("most_recent_employer", "Reference from the most recent employer", mostRecentReceived ? "on_file" : "missing",
      mostRecentReceived ? "Most-recent-employer reference received" : "Required unless a lawful rationale and mitigation are recorded"),
    fileItem("reason_for_leaving", "Verification of why the last employment ended", mostRecentJob?.reason_for_leaving && mostRecentJob.verified ? "on_file" : mostRecentJob?.reason_for_leaving ? "pending" : "missing",
      mostRecentJob?.reason_for_leaving ? `Stated: ${mostRecentJob.reason_for_leaving}` : "No reason for leaving recorded for the most recent role"),
    fileItem("employment_history", "Full employment history", employment_history.length > 0 ? "on_file" : "missing",
      `${employment_history.length} employment entr${employment_history.length === 1 ? "y" : "ies"} recorded`),
    fileItem("gaps", "Written explanation for all employment gaps", gaps.length === 0 || gaps.every((g) => g.status === "satisfactory") ? "on_file" : gaps.some((g) => g.status === "explanation_received") ? "pending" : "missing",
      gaps.length === 0 ? "No gaps over the threshold detected" : `${gaps.filter((g) => g.status === "satisfactory").length}/${gaps.length} gap explanation(s) accepted`),
    fileItem("right_to_work", "Right-to-work evidence", isVerified(checkOf(checks, "right_to_work")) ? "on_file" : "missing",
      isVerified(checkOf(checks, "right_to_work")) ? "Right to work verified" : "Must be checked before employment begins"),
    fileItem("qualifications", "Documentary evidence of relevant qualifications", isVerified(checkOf(checks, "professional_qualifications")) ? "on_file" : isEvidenced(checkOf(checks, "professional_qualifications")) ? "pending" : "missing",
      "Certificates verified for relevance and authenticity"),
    fileItem("medical", "Health declaration / medical fitness", isVerified(checkOf(checks, "medical_fitness")) ? "on_file" : "missing",
      "Role-related fitness confirmed by an authorised manager"),
    fileItem("interview", "Interview record with safeguarding exploration", interviewDone && interviewDone.safeguarding_question_asked ? "on_file" : interviewDone ? "pending" : "missing",
      interviewDone ? `Panel recommendation: ${interviewDone.recommendation}` : "No completed, signed-off interview record"),
    fileItem("signoff", "Final suitability decision by an authorised manager", humanSignoff ? "on_file" : "missing",
      humanSignoff ? `Signed off by ${humanSignoff.by}` : "The final decision must be made and recorded by a human manager"),
  ];

  const missingEvidence: MissingEvidenceItem[] = fileIndex
    .filter((f) => f.status !== "on_file")
    .map((f) => ({
      item: f.item,
      why_it_matters: WHY_IT_MATTERS[f.key] ?? "Required for a complete Schedule 2 safer-recruitment file",
      action: f.detail,
    }));

  // ── Next best action ──
  const nextAction = pickNextAction(rules.blockers, chases, checksOutstanding, fullyEvidenced, humanSignoff, exceptional, gaps);

  // ── One-line status (the manager-facing summary) ──
  const name = `${profile.first_name} ${profile.last_name}`;
  const lightWord = traffic === "red" ? "Red" : traffic === "amber" ? "Amber" : "Green";
  const oneLine = `${lightWord}: ${trafficReasons[0]}${trafficReasons.length > 1 ? ` (+${trafficReasons.length - 1} more)` : ""}. Next: ${nextAction.label}.`;

  return {
    candidate_id: profile.id,
    name,
    role_applied: vacancy?.title ?? "Residential role",
    stage: profile.current_stage,
    days_since_application: daysBetween(profile.created_at, today),
    traffic_light: traffic,
    traffic_reasons: trafficReasons,
    start_eligibility: eligibility,
    eligibility_reason: eligibilityReason,
    compliance_score: complianceScore,
    blockers: rules.blockers,
    warnings: rules.warnings,
    next_action: nextAction,
    references_summary: {
      required: 2,
      received: received.length,
      satisfactory: satisfactory.length,
      most_recent_employer_received: mostRecentReceived,
    },
    reference_chases: chases,
    checks_outstanding: checksOutstanding,
    human_signoff: humanSignoff,
    exceptional_start: exceptional,
    missing_evidence: missingEvidence,
    staff_file_index: fileIndex,
    one_line_status: oneLine,
  };
}

function fileItem(key: string, item: string, status: FileIndexItem["status"], detail: string): FileIndexItem {
  return { key, item, status, detail };
}

const WHY_IT_MATTERS: Record<string, string> = {
  identity: "Schedule 2 requires positive proof of identity before working in a children's home",
  dbs: "No unsupervised work with children until the DBS and barred-list position is confirmed safe",
  references: "Two written references are required evidence of suitability",
  most_recent_employer: "Ofsted expects the most recent employer's account of conduct and suitability",
  reason_for_leaving: "Why previous employment ended must be verified so concerns cannot be left behind",
  employment_history: "A full history is the basis for spotting unexplained gaps and patterns",
  gaps: "Unexplained gaps are a classic safer-recruitment red flag and block clearance",
  right_to_work: "Employment cannot lawfully begin without a right-to-work check",
  qualifications: "The role's required qualifications must be evidenced, not asserted",
  medical: "Fitness for the role must be confirmed, with adjustments considered",
  interview: "The interview must evidence safeguarding exploration, not just a chat",
  signoff: "The final suitability decision always belongs to a human manager",
};

function pickNextAction(
  blockers: RulesBlocker[],
  chases: ReferenceChaseItem[],
  checksOutstanding: string[],
  fullyEvidenced: boolean,
  humanSignoff: { by: string; at: string } | null,
  exceptional: ExceptionalStartStatus | null,
  gaps: GapExplanation[],
): CommandCandidate["next_action"] {
  const dbsConcern = blockers.find((b) => b.code === "DBS_CONCERN");
  if (dbsConcern) return { label: "Review the DBS concern with the Registered Manager today", detail: dbsConcern.message, urgency: "urgent" };
  const unsat = blockers.find((b) => b.code === "REFERENCE_UNSATISFACTORY");
  if (unsat) return { label: "Manager decision needed on the unsatisfactory reference", detail: unsat.message, urgency: "urgent" };
  const discrepancy = blockers.find((b) => b.code === "REFERENCE_DISCREPANCY");
  if (discrepancy) return { label: "Verify the reference discrepancy by phone and record the outcome", detail: discrepancy.message, urgency: "high" };
  if (exceptional && exceptional.missing.length > 0) {
    return { label: "Complete the exceptional-start controls before any start", detail: exceptional.missing[0], urgency: "urgent" };
  }
  const rtw = blockers.find((b) => b.code === "RTW_NOT_VERIFIED");
  if (rtw) return { label: "Verify right-to-work documents", detail: rtw.message, urgency: "high" };
  const gapBlock = blockers.find((b) => b.code === "GAPS_UNEXPLAINED");
  if (gapBlock) return { label: "Chase the written gap explanation", detail: gapBlock.message, urgency: "high" };
  const pendingGapReview = gaps.find((g) => g.status === "explanation_received");
  if (pendingGapReview) return { label: "Review the received gap explanation and record a decision", detail: `Gap ${pendingGapReview.gap_start} → ${pendingGapReview.gap_end} (${pendingGapReview.gap_days} days)`, urgency: "normal" };
  const escalated = chases.find((c) => c.state === "escalate_manager" || c.state === "suggest_alternative");
  if (escalated) return { label: `Chase reference from ${escalated.referee_name}`, detail: escalated.action, urgency: "high" };
  const due = chases.find((c) => c.state === "remind_48h" || c.state === "second_reminder");
  if (due) return { label: `Send a reference reminder to ${due.referee_name}`, detail: due.action, urgency: "normal" };
  const refBlock = blockers.find((b) => b.code.startsWith("REF"));
  if (refBlock) return { label: "Resolve outstanding reference requirements", detail: refBlock.message, urgency: "high" };
  if (fullyEvidenced && !humanSignoff) {
    return { label: "Final suitability sign-off by the Registered Manager", detail: "The pack is complete — the decision is the manager's to make and record", urgency: "high" };
  }
  if (checksOutstanding.length > 0) {
    return { label: `Progress the ${checksOutstanding[0]} check`, detail: `${checksOutstanding.length} required check(s) still to verify`, urgency: "normal" };
  }
  if (humanSignoff) return { label: "Cleared — schedule induction and onboarding", detail: "Move into the onboarding pathway", urgency: "normal" };
  return { label: "Progress the candidate to the next stage", detail: "No outstanding safer-recruitment actions detected", urgency: "normal" };
}

// ── Home-level roll-up ────────────────────────────────────────────────────────

export function computeSaferRecruitmentCommand(input: SaferRecruitmentCommandInput): SaferRecruitmentCommandResult {
  const active = input.candidates.filter((c) => !ACTIVE_STAGES_EXCLUDED.has(c.profile.current_stage));
  const evaluated = active
    .map((c) => evaluateCandidate(c, input.today))
    .sort((a, b) => {
      const order: Record<TrafficLight, number> = { red: 0, amber: 1, green: 2 };
      if (order[a.traffic_light] !== order[b.traffic_light]) return order[a.traffic_light] - order[b.traffic_light];
      return b.days_since_application - a.days_since_application;
    });

  const red = evaluated.filter((c) => c.traffic_light === "red").length;
  const amber = evaluated.filter((c) => c.traffic_light === "amber").length;
  const green = evaluated.filter((c) => c.traffic_light === "green").length;
  const cleared = evaluated.filter((c) => c.start_eligibility === "cleared").length;
  const exceptionalActive = evaluated.filter((c) => c.exceptional_start?.active).length;
  const refsOutstanding = evaluated.reduce((n, c) => n + c.reference_chases.length, 0);
  const escalations = evaluated.reduce(
    (n, c) => n + c.reference_chases.filter((r) => r.state === "escalate_manager" || r.state === "suggest_alternative").length,
    0,
  );

  const headlineParts: string[] = [];
  if (red > 0) headlineParts.push(`${red} candidate${red === 1 ? "" : "s"} blocked on safer-recruitment issues`);
  if (refsOutstanding > 0) headlineParts.push(`${refsOutstanding} reference${refsOutstanding === 1 ? "" : "s"} outstanding (${escalations} needing escalation)`);
  if (exceptionalActive > 0) headlineParts.push(`${exceptionalActive} exceptional start${exceptionalActive === 1 ? "" : "s"} under daily review`);
  if (cleared > 0) headlineParts.push(`${cleared} cleared to start`);
  const headline = headlineParts.length > 0
    ? headlineParts.join(" · ")
    : evaluated.length === 0
      ? "No active candidates in the pipeline"
      : "Pipeline healthy — checks progressing, nothing blocked";

  return {
    generated_for: input.today,
    summary: {
      total_candidates: evaluated.length,
      red,
      amber,
      green,
      cleared,
      exceptional_active: exceptionalActive,
      references_outstanding: refsOutstanding,
      chases_needing_escalation: escalations,
      headline,
    },
    candidates: evaluated,
  };
}
