// ══════════════════════════════════════════════════════════════════════════════
// HR — SAFER RECRUITMENT GATE
//
// The gate that decides whether a worker can be marked
// approved_for_unsupervised on the hr_staff_profiles table. The rule is
// strict by design: every mandatory check must be complete, OR a senior
// risk acceptance must be recorded with a written rationale.
//
// This file is the canonical source of truth for which checks are
// mandatory and how the gate is evaluated. Both the API route and the UI
// import from here so the rules cannot drift between front and back.
//
// Regulatory basis:
//   - Children's Homes Regulations 2015 Reg 32 (employment of staff)
//   - Children's Homes Regulations 2015 Reg 33 (fitness of workers)
//   - Working Together to Safeguard Children 2023
//   - Keeping Children Safe in Education 2024 (where placements include
//     regulated activity)
//   - Safer Recruitment Consortium guidance
// ══════════════════════════════════════════════════════════════════════════════

export type CheckStatus = "pending" | "complete" | "failed" | "expired" | "not_required";

export interface SaferRecruitmentRecord {
  id: string;
  staffId: string;
  homeId?: string;
  applicationFormComplete: boolean;
  employmentHistoryFull: boolean;
  gapsExplored: boolean;
  gapsExplanation?: string;
  identityCheckStatus: CheckStatus;
  rightToWorkStatus: CheckStatus;
  enhancedDbsStatus:
    | "pending"
    | "submitted"
    | "clear"
    | "flagged"
    | "expired";
  enhancedDbsNumber?: string;
  enhancedDbsIssued?: string;
  enhancedDbsRenewalDue?: string;
  barredListCheckStatus: CheckStatus;
  referencesReceivedCount: number;
  referencesVerifiedCount: number;
  interviewNotesPresent: boolean;
  valuesBasedInterviewDone: boolean;
  qualificationCheckDone: boolean;
  healthDeclarationComplete: boolean;
  recruitmentRiskAssessment?: string;
  inductionPlanPresent: boolean;
  managerSignOff: boolean;
  managerSignedOffBy?: string;
  managerSignedOffAt?: string;
  seniorRiskAcceptance: boolean;
  seniorRiskAcceptanceText?: string;
  seniorRiskAcceptanceBy?: string;
  seniorRiskAcceptanceAt?: string;
  status: "in_progress" | "complete" | "blocked" | "withdrawn";
}

export interface CheckRowResult {
  key: string;
  label: string;
  satisfied: boolean;
  reason?: string;
  evidenceRequiredIfMissing: string;
}

export type GateOutcome =
  | "approved_all_checks_complete"
  | "approved_with_senior_risk_acceptance"
  | "blocked_missing_checks"
  | "blocked_check_failed";

export interface GateEvaluation {
  outcome: GateOutcome;
  approvedForUnsupervised: boolean;
  rows: CheckRowResult[];
  blockingReasons: string[];
  unmetChecks: CheckRowResult[];
  failedChecks: CheckRowResult[];
  caraLabel: "Cara suggested draft";
  rationaleSummary: string;
  regulatoryLinks: string[];
}

const REGULATORY_LINKS = [
  "Children's Homes (England) Regulations 2015 Reg 32 (employment of staff)",
  "Children's Homes (England) Regulations 2015 Reg 33 (fitness of workers)",
  "Working Together to Safeguard Children 2023",
  "Keeping Children Safe in Education 2024",
  "Safer Recruitment Consortium guidance",
];

/**
 * Minimum number of references the gate expects to be received and verified.
 * Adjustable by deployment configuration in future, but the spec is at
 * least two written references per safer recruitment standard.
 */
const REFERENCES_REQUIRED = 2;

// ─── Pure helpers ────────────────────────────────────────────────────────────

function rowsFor(record: SaferRecruitmentRecord): CheckRowResult[] {
  const rows: CheckRowResult[] = [];

  rows.push({
    key: "application_form_complete",
    label: "Application form complete",
    satisfied: record.applicationFormComplete,
    evidenceRequiredIfMissing:
      "Completed application form on file, signed and dated by the applicant.",
  });

  rows.push({
    key: "employment_history_full",
    label: "Full employment history",
    satisfied: record.employmentHistoryFull,
    evidenceRequiredIfMissing:
      "A full employment history with no unexplained gaps, ideally from the applicant's first paid employment.",
  });

  rows.push({
    key: "gaps_explored",
    label: "Gaps explored and explained",
    satisfied: record.gapsExplored,
    reason: record.gapsExplanation,
    evidenceRequiredIfMissing:
      "Each gap in employment must be discussed at interview and the explanation recorded.",
  });

  rows.push({
    key: "identity_check",
    label: "Identity check",
    satisfied: record.identityCheckStatus === "complete",
    reason:
      record.identityCheckStatus === "failed"
        ? "Identity check has failed; see notes."
        : record.identityCheckStatus === "not_required"
          ? "Marked as not required."
          : record.identityCheckStatus === "pending"
            ? "Identity check is pending."
            : undefined,
    evidenceRequiredIfMissing:
      "Original photographic ID and proof of address verified by the home.",
  });

  rows.push({
    key: "right_to_work",
    label: "Right to work confirmed",
    satisfied: record.rightToWorkStatus === "complete",
    reason:
      record.rightToWorkStatus === "expired"
        ? "Right to work documentation has expired and must be re-evidenced."
        : record.rightToWorkStatus === "failed"
          ? "Right to work check has failed; see notes."
          : undefined,
    evidenceRequiredIfMissing:
      "Home Office Right to Work documentation evidenced and dated by the verifier.",
  });

  rows.push({
    key: "enhanced_dbs",
    label: "Enhanced DBS clear (within validity)",
    satisfied:
      record.enhancedDbsStatus === "clear" &&
      !isExpiredDate(record.enhancedDbsRenewalDue),
    reason:
      record.enhancedDbsStatus === "flagged"
        ? "Enhanced DBS has returned a flagged result; risk assessment required."
        : record.enhancedDbsStatus === "expired" ||
            isExpiredDate(record.enhancedDbsRenewalDue)
          ? "Enhanced DBS has expired or has a past renewal date."
          : record.enhancedDbsStatus === "pending"
            ? "Enhanced DBS not yet submitted."
            : record.enhancedDbsStatus === "submitted"
              ? "Enhanced DBS submitted but not yet returned."
              : undefined,
    evidenceRequiredIfMissing:
      "Enhanced DBS certificate within renewal cycle, with number, issue date, and renewal due date on file.",
  });

  rows.push({
    key: "barred_list",
    label: "Barred list check (where required)",
    satisfied:
      record.barredListCheckStatus === "complete" ||
      record.barredListCheckStatus === "not_required",
    reason:
      record.barredListCheckStatus === "failed"
        ? "Barred list check failed; the worker is not eligible for regulated activity."
        : undefined,
    evidenceRequiredIfMissing:
      "Children's barred list check evidenced for any role that includes regulated activity.",
  });

  rows.push({
    key: "references",
    label: `At least ${REFERENCES_REQUIRED} references received and verified`,
    satisfied:
      record.referencesReceivedCount >= REFERENCES_REQUIRED &&
      record.referencesVerifiedCount >= REFERENCES_REQUIRED,
    reason:
      record.referencesReceivedCount < REFERENCES_REQUIRED
        ? `Only ${record.referencesReceivedCount} reference(s) received.`
        : record.referencesVerifiedCount < REFERENCES_REQUIRED
          ? `Only ${record.referencesVerifiedCount} reference(s) have been verified.`
          : undefined,
    evidenceRequiredIfMissing: `${REFERENCES_REQUIRED} written references received and verified, including one from the most recent employer where the role involved children.`,
  });

  rows.push({
    key: "interview_notes",
    label: "Interview notes on file",
    satisfied: record.interviewNotesPresent,
    evidenceRequiredIfMissing:
      "Structured interview notes that capture answers to safeguarding and values-based questions.",
  });

  rows.push({
    key: "values_based_interview",
    label: "Values-based interview completed",
    satisfied: record.valuesBasedInterviewDone,
    evidenceRequiredIfMissing:
      "Evidence that values-based questions were asked and scored against safer recruitment indicators.",
  });

  rows.push({
    key: "qualification_check",
    label: "Qualifications verified",
    satisfied: record.qualificationCheckDone,
    evidenceRequiredIfMissing:
      "Original or verified copies of qualifications relevant to the role.",
  });

  rows.push({
    key: "health_declaration",
    label: "Health declaration complete",
    satisfied: record.healthDeclarationComplete,
    evidenceRequiredIfMissing:
      "Confidential health declaration completed by the applicant; occupational health input where indicated.",
  });

  rows.push({
    key: "induction_plan",
    label: "Induction plan in place",
    satisfied: record.inductionPlanPresent,
    evidenceRequiredIfMissing:
      "Induction plan covering safeguarding, behaviour support, recording, medication, and the home's plans.",
  });

  rows.push({
    key: "manager_sign_off",
    label: "Registered Manager sign-off",
    satisfied: record.managerSignOff,
    evidenceRequiredIfMissing:
      "Registered Manager has reviewed the file in full and signed off the recruitment record.",
  });

  return rows;
}

function isExpiredDate(iso?: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function evaluateSaferRecruitmentGate(
  record: SaferRecruitmentRecord,
): GateEvaluation {
  const rows = rowsFor(record);
  const failedChecks = rows.filter(
    (r) =>
      !r.satisfied &&
      (record.enhancedDbsStatus === "flagged" ||
        record.identityCheckStatus === "failed" ||
        record.rightToWorkStatus === "failed" ||
        record.barredListCheckStatus === "failed"),
  );
  const unmetChecks = rows.filter((r) => !r.satisfied);

  const allComplete = unmetChecks.length === 0;
  const seniorOverride =
    record.seniorRiskAcceptance &&
    !!record.seniorRiskAcceptanceText &&
    record.seniorRiskAcceptanceText.trim().length >= 30;

  let outcome: GateOutcome;
  let approvedForUnsupervised: boolean;
  const blockingReasons: string[] = [];

  if (failedChecks.length > 0) {
    outcome = "blocked_check_failed";
    approvedForUnsupervised = false;
    for (const f of failedChecks) {
      blockingReasons.push(`${f.label}: ${f.reason ?? "failed"}`);
    }
  } else if (allComplete) {
    outcome = "approved_all_checks_complete";
    approvedForUnsupervised = true;
  } else if (seniorOverride) {
    outcome = "approved_with_senior_risk_acceptance";
    approvedForUnsupervised = true;
  } else {
    outcome = "blocked_missing_checks";
    approvedForUnsupervised = false;
    for (const u of unmetChecks) {
      blockingReasons.push(`${u.label}: ${u.reason ?? "outstanding"}`);
    }
  }

  let rationaleSummary: string;
  switch (outcome) {
    case "approved_all_checks_complete":
      rationaleSummary =
        "All mandatory safer recruitment checks are complete on the evidence provided. The worker can be marked as approved for unsupervised work, subject to ongoing supervision.";
      break;
    case "approved_with_senior_risk_acceptance":
      rationaleSummary =
        "Mandatory checks are not all complete. A senior risk acceptance is on file with a written rationale, so the worker can proceed. The acceptance must be reviewed at a defined interval and any outstanding checks must still be closed.";
      break;
    case "blocked_check_failed":
      rationaleSummary =
        "One or more checks have a failed status. The worker cannot be approved for unsupervised work until those failures are resolved or a recorded decision is made.";
      break;
    case "blocked_missing_checks":
    default:
      rationaleSummary =
        "Some mandatory checks are outstanding. The worker cannot be approved for unsupervised work until the listed items are complete, or a senior risk acceptance is recorded with a written rationale.";
      break;
  }

  return {
    outcome,
    approvedForUnsupervised,
    rows,
    blockingReasons,
    unmetChecks,
    failedChecks,
    caraLabel: "Cara suggested draft",
    rationaleSummary,
    regulatoryLinks: REGULATORY_LINKS,
  };
}

/**
 * Tiny convenience: count of completed checks for headline display.
 */
export function countCompletedChecks(record: SaferRecruitmentRecord): {
  completed: number;
  total: number;
} {
  const rows = rowsFor(record);
  return {
    completed: rows.filter((r) => r.satisfied).length,
    total: rows.length,
  };
}
