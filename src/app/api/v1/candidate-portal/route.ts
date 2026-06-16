// ══════════════════════════════════════════════════════════════════════════════
// CARA — CANDIDATE PORTAL API
// GET /api/v1/candidate-portal?candidateId=
//
// Returns a candidate's own application summary: stage, checks checklist,
// simplified values match, references received count, and next steps.
// Candidate sees only their own record — no other applicant data returned.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeValuesMatch } from "@/lib/engines/values-match-engine";
import type { CheckStatus, CheckType } from "@/types/recruitment";

const CHECK_LABELS: Record<CheckType, string> = {
  enhanced_dbs: "Enhanced DBS Certificate",
  barred_list: "Children's Barred List Check",
  right_to_work: "Right to Work Verification",
  identity: "Identity Documents",
  overseas_criminal_record: "Overseas Criminal Record Check",
  professional_qualifications: "Professional Qualifications",
  employment_history: "Employment History Verification",
  medical_fitness: "Medical Fitness Declaration",
  social_media: "Social Media & Online Check",
  references: "Character & Employment References",
  driving_licence: "Driving Licence Check",
  safeguarding_training_check: "Safeguarding Training Verification",
};

const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  not_started: "Not yet started",
  requested: "Requested — awaiting response",
  in_progress: "In progress",
  received: "Received — under review",
  verified: "Verified",
  concern_flagged: "Concern raised — under review",
  override_approved: "Approved with conditions",
  not_required: "Not required for this role",
};

const STAGE_ORDER = [
  "enquiry", "application_received", "sift", "interview_scheduled",
  "interview_completed", "references_requested", "references_received",
  "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
  "final_clearance", "onboarding", "appointed",
] as const;

const STAGE_LABELS: Record<string, string> = {
  enquiry: "Enquiry received",
  application_received: "Application received",
  sift: "Application review",
  interview_scheduled: "Interview scheduled",
  interview_completed: "Interview completed",
  references_requested: "References requested",
  references_received: "References received",
  dbs_submitted: "DBS application submitted",
  dbs_received: "DBS certificate received",
  conditional_offer: "Conditional offer made",
  pre_start_checks: "Pre-start checks",
  final_clearance: "Final clearance",
  onboarding: "Onboarding",
  appointed: "Appointed",
  unsuccessful: "Unsuccessful",
  withdrawn: "Application withdrawn",
};

function nextStepsForStage(stage: string): string[] {
  const map: Record<string, string[]> = {
    enquiry: ["Complete your formal application form."],
    application_received: ["Your application is under review. We will be in touch shortly."],
    sift: ["Your application is being reviewed by our recruitment team."],
    interview_scheduled: ["Prepare for your interview. Confirm your attendance by contacting the recruiting manager."],
    interview_completed: ["Your interview is being assessed. We will contact you with the outcome."],
    references_requested: ["We have contacted your referees. You do not need to take any action."],
    references_received: ["References received. We will be in touch shortly."],
    dbs_submitted: ["Your DBS application is processing. This typically takes 2–4 weeks."],
    dbs_received: ["DBS certificate received and under review."],
    conditional_offer: ["Review your conditional offer and confirm acceptance. Outstanding checks must be cleared before a final offer is made."],
    pre_start_checks: ["Final checks are in progress. Your start date will be confirmed once all checks are cleared."],
    final_clearance: ["All checks complete. You will receive your final offer and contract shortly."],
    onboarding: ["Welcome to the team. Please complete your induction documentation."],
    appointed: ["Your appointment is confirmed. Please contact your manager if you have any questions."],
    unsuccessful: ["We have been unable to progress your application at this time. Thank you for your interest."],
    withdrawn: ["Your application has been withdrawn. Please contact us if you believe this is an error."],
  };
  return map[stage] ?? ["Please contact the recruiting manager for an update."];
}

export async function GET(req: Request) {
  const store = getStore() as any;
  const url = new URL(req.url);

  // Default to first candidate for demo realism (Amara Osei)
  const candidateId = url.searchParams.get("candidateId") ?? "cand_001";

  const profile = (store.candidateProfiles ?? []).find((c: any) => c.id === candidateId);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Candidate not found" }, { status: 404 });
  }

  const vacancy = (store.vacancies ?? []).find((v: any) => v.id === profile.vacancy_id);
  const roleApplied = vacancy?.title ?? "Residential Care Worker";

  const checks = (store.candidateChecks ?? []).filter((c: any) => c.candidate_id === candidateId);
  const references = (store.candidateReferences ?? []).filter((r: any) => r.candidate_id === candidateId);

  const checksSummary = checks.map((c: any) => ({
    id: c.id,
    check_type: c.check_type as CheckType,
    label: CHECK_LABELS[c.check_type as CheckType] ?? c.check_type,
    status: c.status as CheckStatus,
    status_label: CHECK_STATUS_LABELS[c.status as CheckStatus] ?? c.status,
    complete: (c.status === "verified" || c.status === "not_required"),
    concern: c.concern_flag ?? false,
  }));

  const refsReceived = references.filter((r: any) =>
    ["received", "satisfactory", "unsatisfactory", "concerns_noted", "verbal_only"].includes(r.status)
  ).length;

  // Simplified values match (score + shared values only — no dimension detail)
  const employer = (store.employerValuesProfiles ?? [])[0] ?? null;
  const cvp = (store.candidateValuesProfiles ?? []).find((v: any) => v.candidate_id === candidateId);
  const matchSummary = employer && cvp ? (() => {
    const m = computeValuesMatch(employer, cvp);
    return {
      match_percent: m.match_percent,
      band: m.band,
      shared_values: m.shared_values.slice(0, 3),
    };
  })() : null;

  // Stage progress index
  const stageIndex = STAGE_ORDER.indexOf(profile.current_stage as typeof STAGE_ORDER[number]);
  const progressPercent = stageIndex >= 0
    ? Math.round(((stageIndex + 1) / STAGE_ORDER.length) * 100)
    : 0;

  return NextResponse.json({
    ok: true,
    data: {
      candidate: {
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        role_applied: roleApplied,
        current_stage: profile.current_stage,
        stage_label: STAGE_LABELS[profile.current_stage] ?? profile.current_stage,
        compliance_status: profile.compliance_status,
        progress_percent: progressPercent,
      },
      checks: checksSummary,
      checks_complete: checksSummary.filter((c: any) => c.complete).length,
      checks_total: checksSummary.length,
      references_received: refsReceived,
      references_total: references.length,
      values_match: matchSummary,
      next_steps: nextStepsForStage(profile.current_stage),
    },
  });
}
