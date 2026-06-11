// ══════════════════════════════════════════════════════════════════════════════
// CARA — VACANCY SETUP PACK ENGINE
//
// One pack per vacancy answering "is this vacancy safe to recruit against?":
//   • readiness checklist (safeguarding advert wording, approval, values
//     profile, safer-recruitment-trained panel, qualification expectation)
//   • the values-led job-advert scaffold   (reuses manager-assistant engine)
//   • the structured interview pack + scoring matrix (reuses interview-pack
//     engine — same categories the recruitment record stores)
//   • the Schedule 2 safer-recruitment checklist the role will require
//
// Pure and deterministic (injected `today`). Drafts and checklists only —
// adverts are manager-approved before going anywhere, and panel decisions
// stay human (the reused engines carry their own disclaimers).
// ══════════════════════════════════════════════════════════════════════════════

import type { Vacancy } from "@/types/recruitment";
import type { TrainingRecord } from "@/types";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";
import {
  buildJobAdvertScaffold,
  ASSISTANT_DISCLAIMER,
} from "@/lib/engines/manager-assistant-engine";
import {
  buildInterviewPack,
  type InterviewPack,
} from "@/lib/engines/interview-pack-engine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReadinessItem {
  key: string;
  label: string;
  status: "ready" | "action_needed";
  detail: string;
  action: string | null;
}

export interface PanelMemberEligibility {
  staff_id: string;
  name: string;
  course_name: string;
  status: "current" | "expiring_soon" | "expired";
  expiry_date: string | null;
}

export interface VacancySetupPack {
  generated_for: string;
  vacancy: { id: string; title: string; role_code: string; status: Vacancy["status"]; approval_status: Vacancy["approval_status"] };
  ready_to_recruit: boolean;
  readiness: ReadinessItem[];
  qualification_expectation: string;
  panel: {
    eligible: PanelMemberEligibility[];
    lapsed: PanelMemberEligibility[];
    note: string;
  };
  advert_draft: string;
  advert_disclaimer: string;
  interview_pack: InterviewPack;
  safer_recruitment_checklist: { item: string; detail: string }[];
}

export interface VacancySetupInput {
  today: string;
  vacancy: Vacancy;
  employer: EmployerValuesProfile | null;
  staff: { id: string; full_name: string }[];
  training_records: TrainingRecord[];
}

// ── Role mappings ─────────────────────────────────────────────────────────────

const ROLE_TO_INTERVIEW_KEY: Record<string, string> = {
  RCW: "residential_care_worker",
  SRCW: "team_leader",
  TL: "team_leader",
  DM: "deputy_manager",
  RM: "registered_manager",
};

const QUALIFICATION_EXPECTATION: Record<string, string> = {
  RCW: "Level 3 Diploma for Residential Childcare (or enrolment within 6 months of starting, completed within 2 years).",
  SRCW: "Level 3 Diploma for Residential Childcare, with evidence of supervisory development (Level 4/5 desirable).",
  TL: "Level 3 Diploma for Residential Childcare, with evidence of supervisory development (Level 4/5 desirable).",
  DM: "Level 5 Diploma in Leadership and Management for Residential Childcare — held or actively working towards.",
  RM: "Level 5 Diploma in Leadership and Management for Residential Childcare, plus the experience Regulation 28 requires.",
};

const SAFER_REC_COURSE = /safer\s*recruitment/i;

// ── Engine ────────────────────────────────────────────────────────────────────

export function buildVacancySetupPack(input: VacancySetupInput): VacancySetupPack {
  const { vacancy, employer, today } = input;

  // ── Panel eligibility from recorded safer-recruitment training ──
  const staffName = new Map(input.staff.map((s) => [s.id, s.full_name]));
  const eligible: PanelMemberEligibility[] = [];
  const lapsed: PanelMemberEligibility[] = [];
  for (const t of input.training_records) {
    if (!SAFER_REC_COURSE.test(t.course_name)) continue;
    const entry: PanelMemberEligibility = {
      staff_id: t.staff_id,
      name: staffName.get(t.staff_id) ?? t.staff_id,
      course_name: t.course_name,
      status: t.status === "expired" ? "expired" : t.status === "expiring_soon" ? "expiring_soon" : "current",
      expiry_date: t.expiry_date,
    };
    if (entry.status === "expired") lapsed.push(entry);
    else eligible.push(entry);
  }
  eligible.sort((a, b) => a.name.localeCompare(b.name));
  lapsed.sort((a, b) => a.name.localeCompare(b.name));

  // ── Readiness checklist ──
  const readiness: ReadinessItem[] = [];
  const hasStatement = !!vacancy.safeguarding_statement?.trim();
  readiness.push({
    key: "safeguarding_statement",
    label: "Advert carries a safeguarding statement",
    status: hasStatement ? "ready" : "action_needed",
    detail: hasStatement
      ? `"${(vacancy.safeguarding_statement ?? "").slice(0, 120)}${(vacancy.safeguarding_statement ?? "").length > 120 ? "…" : ""}"`
      : "No safeguarding statement is recorded on the vacancy.",
    action: hasStatement ? null : "Add the home's safeguarding commitment to the vacancy before advertising.",
  });

  const approved = vacancy.approval_status === "approved" && !!vacancy.approved_by;
  readiness.push({
    key: "approval",
    label: "Vacancy approved by a manager",
    status: approved ? "ready" : "action_needed",
    detail: approved ? `Approved by ${vacancy.approved_by}` : `Approval status: ${vacancy.approval_status}.`,
    action: approved ? null : "Record manager approval before the advert goes out.",
  });

  readiness.push({
    key: "values_profile",
    label: "Employer values profile in place",
    status: employer ? "ready" : "action_needed",
    detail: employer
      ? `Values-led advert and interview prompts drawn from ${employer.home_name}'s recorded profile.`
      : "No employer values profile recorded — the advert and interview prompts fall back to generic wording.",
    action: employer ? null : "Complete the Employer Values Profile so recruitment reflects what the home stands for.",
  });

  readiness.push({
    key: "panel_safer_recruitment",
    label: "At least one panel member trained in safer recruitment",
    status: eligible.length > 0 ? "ready" : "action_needed",
    detail:
      eligible.length > 0
        ? `${eligible.length} staff member${eligible.length === 1 ? "" : "s"} hold current safer-recruitment training.`
        : lapsed.length > 0
          ? "Only lapsed safer-recruitment training is on record."
          : "No safer-recruitment training is recorded for any staff member.",
    action: eligible.length > 0 ? null : "Record (or arrange) safer-recruitment training before convening an interview panel.",
  });

  readiness.push({
    key: "regulated_activity",
    label: "Regulated activity confirmed",
    status: "ready",
    detail: "This role is regulated activity with children — the checklist below requires an enhanced DBS with children's barred-list check before any unsupervised work.",
    action: null,
  });

  const qualificationExpectation =
    QUALIFICATION_EXPECTATION[vacancy.role_code] ?? QUALIFICATION_EXPECTATION.RCW;
  readiness.push({
    key: "qualification_expectation",
    label: "Qualification expectation set",
    status: "ready",
    detail: qualificationExpectation,
    action: null,
  });

  const readyOverall = readiness.every((r) => r.status === "ready");

  // ── Reused drafts ──
  const advert = buildJobAdvertScaffold(vacancy, employer);
  const interviewKey = ROLE_TO_INTERVIEW_KEY[vacancy.role_code] ?? "residential_care_worker";
  const interviewPack = buildInterviewPack({ role: interviewKey, employer });

  // ── The Schedule 2 checklist this role will require ──
  const checklist: { item: string; detail: string }[] = [
    { item: "Proof of identity with recent photograph", detail: "Verified against original documents, likeness confirmed." },
    { item: "Enhanced DBS with children's barred-list check", detail: "No unsupervised work with children until the position is confirmed safe and a manager approves." },
    { item: "Right-to-work evidence", detail: "Checked before employment begins; follow-up scheduled if permission is time-limited." },
    { item: "Two written references, including the most recent employer", detail: "Open references and candidate-supplied references are never accepted." },
    { item: "Verification of why the last employment ended", detail: "Reason for leaving confirmed with the referee, not just the candidate." },
    { item: "Full employment history with written explanations for gaps", detail: "Every gap over 28 days explained in writing and accepted by a manager." },
    { item: `Qualification evidence — ${qualificationExpectation}`, detail: "Certificates verified for relevance and authenticity." },
    { item: "Health declaration / fitness for the role", detail: "Role-related questions only; adjustments considered; reviewed by an authorised manager." },
    { item: "Structured interview with safeguarding exploration", detail: "Same core questions for every candidate; panel scores recorded with rationale." },
    { item: "Final suitability decision recorded by a named manager", detail: "The system tracks and evidences — the decision is always human." },
  ];

  return {
    generated_for: today,
    vacancy: {
      id: vacancy.id,
      title: vacancy.title,
      role_code: vacancy.role_code,
      status: vacancy.status,
      approval_status: vacancy.approval_status,
    },
    ready_to_recruit: readyOverall,
    readiness,
    qualification_expectation: qualificationExpectation,
    panel: {
      eligible,
      lapsed,
      note:
        "Convene a panel of at least two, with at least one member holding current safer-recruitment training. Panel membership is recorded on each interview.",
    },
    advert_draft: advert,
    advert_disclaimer: ASSISTANT_DISCLAIMER,
    interview_pack: interviewPack,
    safer_recruitment_checklist: checklist,
  };
}
