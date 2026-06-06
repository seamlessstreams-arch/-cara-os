// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE EVENT ROUTING ENGINE
//
// "Record once, update everywhere."
//
// This engine classifies a Care Event and determines:
//   1. Which routes it must follow (daily log, incidents, evidence banks, etc.)
//   2. Which evidence prompts to generate
//   3. Whether manager review / Reg 40 triage is required
//   4. Whether it contributes to Reg 45 / Annex A evidence
//   5. Which background jobs to queue
//
// All routing decisions are based on the event's category and content flags.
// Routes are idempotent — re-running never creates duplicates.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CareEvent, CareEventCategory, RouteType, EvidencePrompt, JobType, RoutingSummary,
} from "@/types/care-events";
import { requiresReg40FromText } from "./reg40-keywords";

// ── Classification result ─────────────────────────────────────────────────────

export interface ClassificationResult {
  category: CareEventCategory;
  requires_manager_review: boolean;
  requires_reg40_triage: boolean;
  contributes_to_reg45: boolean;
  contributes_to_annex_a: boolean;
  is_safeguarding: boolean;
  routes: RouteType[];
  evidence_prompts: EvidencePrompt[];
  background_jobs: JobType[];
  reg45_suggested_text: string | null;
  annex_a_section: string | null;
  annex_a_suggested_text: string | null;
}

// ── Category routing rules ────────────────────────────────────────────────────

const ROUTES_BY_CATEGORY: Record<CareEventCategory, RouteType[]> = {
  general:                ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"],
  behaviour:              ["daily_log", "child_daily_summary", "management_oversight", "filing_cabinet", "saved_time", "reg45_evidence", "annex_a_evidence"],
  health:                 ["daily_log", "child_daily_summary", "health_record", "filing_cabinet", "saved_time", "annex_a_evidence"],
  medication:             ["daily_log", "child_daily_summary", "medication_record", "management_oversight", "filing_cabinet", "saved_time"],
  education:              ["daily_log", "child_daily_summary", "education_record", "filing_cabinet", "saved_time", "annex_a_evidence"],
  family_contact:         ["daily_log", "child_daily_summary", "family_contact_record", "filing_cabinet", "saved_time"],
  professional_contact:   ["daily_log", "child_daily_summary", "professional_contact_record", "filing_cabinet", "saved_time"],
  safeguarding:           ["daily_log", "child_daily_summary", "safeguarding_record", "incident", "management_oversight", "reg40_triage", "reg44_evidence", "reg45_evidence", "annex_a_evidence", "filing_cabinet", "saved_time"],
  missing_episode:        ["daily_log", "child_daily_summary", "missing_episode", "incident", "management_oversight", "reg40_triage", "reg44_evidence", "reg45_evidence", "annex_a_evidence", "filing_cabinet", "saved_time"],
  physical_intervention:  ["daily_log", "child_daily_summary", "physical_intervention", "incident", "management_oversight", "reg40_triage", "reg44_evidence", "reg45_evidence", "annex_a_evidence", "filing_cabinet", "saved_time"],
  restraint:              ["daily_log", "child_daily_summary", "physical_intervention", "incident", "management_oversight", "reg40_triage", "reg44_evidence", "reg45_evidence", "annex_a_evidence", "filing_cabinet", "saved_time"],
  complaint:              ["daily_log", "child_daily_summary", "complaint_record", "management_oversight", "reg44_evidence", "reg45_evidence", "annex_a_evidence", "filing_cabinet", "saved_time"],
  activity:               ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"],
  wellbeing:              ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time", "reg45_evidence"],
  sleep:                  ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"],
  food:                   ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"],
  finance:                ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"],
  other:                  ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"],
};

// ── Manager review required ───────────────────────────────────────────────────

const REQUIRES_MANAGER_REVIEW: Set<CareEventCategory> = new Set([
  "safeguarding", "missing_episode", "physical_intervention", "restraint",
  "complaint", "medication", "behaviour",
]);

// ── Reg 40 triage required ────────────────────────────────────────────────────

const REQUIRES_REG40: Set<CareEventCategory> = new Set([
  "safeguarding", "missing_episode", "physical_intervention", "restraint",
]);

// ── Contributes to Reg 45 ─────────────────────────────────────────────────────

const CONTRIBUTES_TO_REG45: Set<CareEventCategory> = new Set([
  "safeguarding", "missing_episode", "physical_intervention", "restraint",
  "complaint", "behaviour", "wellbeing",
]);

// ── Contributes to Annex A ────────────────────────────────────────────────────

const CONTRIBUTES_TO_ANNEX_A: Set<CareEventCategory> = new Set([
  "safeguarding", "missing_episode", "physical_intervention", "restraint",
  "complaint", "health", "education",
]);

// ── Safeguarding categories ───────────────────────────────────────────────────

const SAFEGUARDING_CATEGORIES: Set<CareEventCategory> = new Set([
  "safeguarding", "missing_episode",
]);

// ── Background jobs by category ───────────────────────────────────────────────

const JOBS_BY_CATEGORY: Partial<Record<CareEventCategory, JobType[]>> = {
  safeguarding:          ["reg45_summary_update", "annex_a_snapshot_update", "inspection_readiness_update", "saved_time_metrics"],
  missing_episode:       ["reg45_summary_update", "annex_a_snapshot_update", "inspection_readiness_update", "saved_time_metrics"],
  physical_intervention: ["reg45_summary_update", "annex_a_snapshot_update", "inspection_readiness_update", "saved_time_metrics"],
  restraint:             ["reg45_summary_update", "annex_a_snapshot_update", "inspection_readiness_update", "saved_time_metrics"],
  complaint:             ["reg45_summary_update", "annex_a_snapshot_update", "saved_time_metrics"],
  behaviour:             ["reg45_summary_update", "saved_time_metrics"],
};

// ── Evidence prompts by category ──────────────────────────────────────────────

const EVIDENCE_PROMPTS_BY_CATEGORY: Partial<Record<CareEventCategory, Omit<EvidencePrompt, "id" | "completed" | "answer">[]>> = {
  safeguarding: [
    { question: "What was the nature of the disclosure or concern?", required: true },
    { question: "Who was informed and when?", required: true },
    { question: "What immediate actions were taken to keep the child safe?", required: true },
    { question: "Is a strategy discussion or referral required?", required: false },
  ],
  missing_episode: [
    { question: "What time was the child last seen?", required: true },
    { question: "What actions were taken to locate the child?", required: true },
    { question: "Were police notified? If so, what was the reference number?", required: true },
    { question: "Were contextual safeguarding risks identified?", required: false },
  ],
  physical_intervention: [
    { question: "What behaviour necessitated the intervention?", required: true },
    { question: "What de-escalation was attempted before physical intervention?", required: true },
    { question: "What technique was used and for how long?", required: true },
    { question: "Were there any injuries? Has a body map been completed?", required: true },
    { question: "Who was present as a witness?", required: false },
  ],
  restraint: [
    { question: "What behaviour necessitated the restraint?", required: true },
    { question: "What de-escalation was attempted first?", required: true },
    { question: "What technique and duration?", required: true },
    { question: "Injuries? Body map completed?", required: true },
  ],
  medication: [
    { question: "Was this a refusal, error, or administration record?", required: true },
    { question: "Has the MAR been updated?", required: true },
    { question: "Does a prescriber or pharmacist need to be contacted?", required: false },
  ],
  complaint: [
    { question: "Who raised the complaint and what is the nature of it?", required: true },
    { question: "Has an acknowledgement been sent?", required: true },
    { question: "What is the intended investigation/resolution process?", required: false },
  ],
};

// ── Annex A section mapping ───────────────────────────────────────────────────

const ANNEX_A_SECTION: Partial<Record<CareEventCategory, string>> = {
  safeguarding:          "children",
  missing_episode:       "children",
  physical_intervention: "children",
  restraint:             "children",
  complaint:             "children",
  health:                "children",
  education:             "children",
};

// ── Reg 45 suggested text builder ─────────────────────────────────────────────

function buildReg45Text(event: Pick<CareEvent, "category" | "title" | "content" | "event_date">): string {
  const date = event.event_date;
  const intro: Partial<Record<CareEventCategory, string>> = {
    safeguarding:          `Safeguarding concern on ${date}`,
    missing_episode:       `Missing episode on ${date}`,
    physical_intervention: `Physical intervention on ${date}`,
    restraint:             `Restraint on ${date}`,
    complaint:             `Complaint on ${date}`,
    behaviour:             `Significant behaviour event on ${date}`,
    wellbeing:             `Wellbeing event on ${date}`,
  };
  const lead = intro[event.category] ?? `Care event on ${date}`;
  return `${lead}: ${event.title}. ${event.content.slice(0, 300)}${event.content.length > 300 ? "…" : ""}`;
}

// ── Main classification function ──────────────────────────────────────────────

export function classifyCareEvent(
  event: Pick<CareEvent, "category" | "title" | "content" | "event_date" | "is_significant">
): ClassificationResult {
  const { category } = event;

  const routes: RouteType[] = [...(ROUTES_BY_CATEGORY[category] ?? ["daily_log", "child_daily_summary", "filing_cabinet", "saved_time"])];

  // Significant events always get management oversight
  if (event.is_significant && !routes.includes("management_oversight")) {
    routes.push("management_oversight");
  }

  const requiresManagerReview = REQUIRES_MANAGER_REVIEW.has(category) || event.is_significant;
  // Flag for Reg 40 triage by category OR by high-precision text indicators
  // (death, serious illness/accident, allegation against staff, police), so
  // notifiable events logged under other categories (e.g. health, behaviour)
  // still surface for a human to triage.
  const requiresReg40 =
    REQUIRES_REG40.has(category) || requiresReg40FromText(event.title, event.content);
  const contributesToReg45 = CONTRIBUTES_TO_REG45.has(category) || event.is_significant;
  const contributesToAnnexA = CONTRIBUTES_TO_ANNEX_A.has(category);
  const isSafeguarding = SAFEGUARDING_CATEGORIES.has(category);

  // Build evidence prompts with stable IDs
  const rawPrompts = EVIDENCE_PROMPTS_BY_CATEGORY[category] ?? [];
  const evidencePrompts: EvidencePrompt[] = rawPrompts.map((p, i) => ({
    id: `ep_${category}_${i}`,
    question: p.question,
    required: p.required,
    completed: false,
    answer: undefined,
  }));

  // Background jobs
  const jobs: JobType[] = [...(JOBS_BY_CATEGORY[category] ?? ["saved_time_metrics"])];

  // Reg 45 suggested text
  const reg45Text = contributesToReg45 ? buildReg45Text(event) : null;

  // Annex A
  const annexSection = ANNEX_A_SECTION[category] ?? null;
  const annexText = contributesToAnnexA && annexSection
    ? `${category.replace(/_/g, " ")} event on ${event.event_date}: ${event.title}`
    : null;

  return {
    category,
    requires_manager_review: requiresManagerReview,
    requires_reg40_triage: requiresReg40,
    contributes_to_reg45: contributesToReg45,
    contributes_to_annex_a: contributesToAnnexA,
    is_safeguarding: isSafeguarding,
    routes,
    evidence_prompts: evidencePrompts,
    background_jobs: jobs,
    reg45_suggested_text: reg45Text,
    annex_a_section: annexSection,
    annex_a_suggested_text: annexText,
  };
}

// ── Route description for UI routing preview ──────────────────────────────────

export function buildRoutingPreview(routes: RouteType[]): string[] {
  const labels: Record<RouteType, string> = {
    daily_log:                  "Daily running log",
    child_daily_summary:        "Child daily summary",
    incident:                   "Incident record",
    missing_episode:            "Missing episode record",
    physical_intervention:      "Physical intervention record",
    health_record:              "Health record",
    medication_record:          "Medication record",
    education_record:           "Education record",
    family_contact_record:      "Family contact record",
    professional_contact_record:"Professional contact record",
    complaint_record:           "Complaint record",
    safeguarding_record:        "Safeguarding record",
    risk_assessment_task:       "Risk assessment review task",
    behaviour_plan_task:        "Behaviour plan review task",
    followup_task:              "Follow-up task",
    management_oversight:       "Management oversight queue",
    reg40_triage:               "Regulation 40 triage queue",
    reg44_evidence:             "Regulation 44 evidence",
    reg45_evidence:             "Regulation 45 evidence bank",
    annex_a_evidence:           "Annex A evidence bank",
    filing_cabinet:             "Filing cabinet",
    saved_time:                 "Saved-time tracker",
  };
  return routes.map((r) => labels[r] ?? r);
}

// ── Routing summary builder ───────────────────────────────────────────────────

export function buildRoutingSummary(routes: RouteType[]): RoutingSummary {
  const taskRoutes: RouteType[] = ["risk_assessment_task", "behaviour_plan_task", "followup_task", "management_oversight"];
  const recordRoutes: RouteType[] = [
    "daily_log", "child_daily_summary", "incident", "missing_episode",
    "physical_intervention", "health_record", "medication_record", "education_record",
    "family_contact_record", "professional_contact_record", "complaint_record",
    "safeguarding_record", "filing_cabinet",
  ];

  const records_updated = routes.filter((r) => recordRoutes.includes(r)).length;
  const tasks_created = routes.filter((r) => taskRoutes.includes(r)).length;
  const reg45_count = routes.includes("reg45_evidence") ? 1 : 0;
  const annex_a_count = routes.includes("annex_a_evidence") ? 1 : 0;

  const areaLabels: Partial<Record<RouteType, string>> = {
    daily_log:           "Daily log",
    child_daily_summary: "Child daily summary",
    management_oversight:"Management oversight",
    reg40_triage:        "Regulation 40 triage",
    reg45_evidence:      "Regulation 45 evidence",
    annex_a_evidence:    "Annex A evidence",
    filing_cabinet:      "Filing cabinet",
    incident:            "Incident record",
    safeguarding_record: "Safeguarding record",
    missing_episode:     "Missing episode",
    physical_intervention:"Physical intervention",
  };

  const areas_updated = routes
    .filter((r) => r in areaLabels)
    .map((r) => areaLabels[r]!);

  return { records_updated, tasks_created, reg45_count, annex_a_count, areas_updated };
}
