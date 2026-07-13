// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY-ADMISSION FOLLOW-UPS (Phase 3 · Admissions · Module 2)
//
// The audit's second Admissions gap: when a child arrives as an EMERGENCY
// placement, a set of statutory follow-ups must happen on deadlines counted
// from the placement start — and Cara had nothing tracking them. This engine is
// a deterministic, read-only projection: it derives which children were
// emergency admissions (from the referral models via the M1 retro-link), then
// reads each follow-up's completion straight off the EXISTING record
// collections (risk assessments, welfare checks, health assessments, LAC
// reviews). Nothing is invented; a follow-up only shows "done" when a real
// record of that type exists for the child dated on/after placement start.
//
// Deadlines are the standard statutory rhythm in calendar days (conservative):
//   • risk assessment        — day 1
//   • first welfare check    — within 7 days
//   • initial health assessment — within 28 days
//   • first LAC review       — within 28 days (20 working days)
// ══════════════════════════════════════════════════════════════════════════════

export interface EmergencyChild {
  id: string;
  name: string;
  placement_start: string;
  /** Why this child counts as an emergency admission (source-attributed). */
  emergency_basis: string;
}

export interface DatedChildRecord {
  child_id: string;
  date?: string;
  review_date?: string;
  created_at?: string;
}

export type FollowUpStatus = "done" | "due" | "overdue";

export interface FollowUp {
  key: "risk_assessment" | "first_welfare_check" | "initial_health_assessment" | "first_lac_review";
  label: string;
  deadline_days: number;
  deadline_date: string;
  status: FollowUpStatus;
  /** Date of the record that satisfied it, when done. */
  completed_on?: string;
}

export interface EmergencyFollowUps {
  child: EmergencyChild;
  followups: FollowUp[];
  overdue_count: number;
}

const FOLLOWUP_SPECS: { key: FollowUp["key"]; label: string; deadline_days: number }[] = [
  { key: "risk_assessment", label: "Risk assessment in place", deadline_days: 1 },
  { key: "first_welfare_check", label: "First welfare check", deadline_days: 7 },
  { key: "initial_health_assessment", label: "Initial health assessment", deadline_days: 28 },
  { key: "first_lac_review", label: "First LAC review", deadline_days: 28 },
];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function recordDate(r: DatedChildRecord): string | undefined {
  return (r.date ?? r.review_date ?? r.created_at)?.slice(0, 10);
}

/** Earliest record for the child dated on/after placement start (day-granular). */
function firstOnOrAfter(records: readonly DatedChildRecord[], childId: string, startDate: string): string | undefined {
  const dates = records
    .filter((r) => r.child_id === childId)
    .map(recordDate)
    .filter((d): d is string => !!d && d >= startDate.slice(0, 10))
    .sort();
  return dates[0];
}

export interface FollowUpSources {
  riskAssessments: readonly DatedChildRecord[];
  welfareChecks: readonly DatedChildRecord[];
  healthAssessments: readonly DatedChildRecord[];
  lacReviews: readonly DatedChildRecord[];
}

/** Compute the follow-up board for one emergency-admitted child. Pure. */
export function computeEmergencyFollowUps(
  child: EmergencyChild,
  sources: FollowUpSources,
  nowIso: string,
): EmergencyFollowUps {
  const start = child.placement_start.slice(0, 10);
  const today = nowIso.slice(0, 10);
  const bySource: Record<FollowUp["key"], readonly DatedChildRecord[]> = {
    risk_assessment: sources.riskAssessments,
    first_welfare_check: sources.welfareChecks,
    initial_health_assessment: sources.healthAssessments,
    first_lac_review: sources.lacReviews,
  };

  const followups: FollowUp[] = FOLLOWUP_SPECS.map((spec) => {
    const deadline = addDays(start, spec.deadline_days);
    // Risk assessments are living documents that often PRE-DATE an emergency
    // placement (done at referral) — any record for the child satisfies it.
    const completed =
      spec.key === "risk_assessment"
        ? bySource[spec.key].some((r) => r.child_id === child.id)
          ? (firstOnOrAfter(bySource[spec.key], child.id, "0000-01-01") ?? start)
          : undefined
        : firstOnOrAfter(bySource[spec.key], child.id, start);
    const status: FollowUpStatus = completed ? "done" : today > deadline ? "overdue" : "due";
    return {
      key: spec.key,
      label: spec.label,
      deadline_days: spec.deadline_days,
      deadline_date: deadline,
      status,
      completed_on: completed,
    };
  });

  return {
    child,
    followups,
    overdue_count: followups.filter((f) => f.status === "overdue").length,
  };
}

// ── Deriving WHO was an emergency admission (source-attributed, no guessing) ──

export interface EmergencyMarkers {
  /** From AdmissionReferral: referral_source === "emergency" && status === "placed". */
  admissionReferrals: readonly { child_name: string; referral_source?: string; status?: string }[];
  /** From commissioning PlacementReferral: urgency === "emergency" with a placement_start_date. */
  placementReferrals: readonly { child_name: string; urgency?: string; placement_start_date?: string | null }[];
}

export function isEmergencyAdmission(
  childName: string,
  normalisedMatch: (referralName: string) => boolean,
  markers: EmergencyMarkers,
): string | null {
  const ad = markers.admissionReferrals.find(
    (r) => r.referral_source === "emergency" && r.status === "placed" && normalisedMatch(r.child_name),
  );
  if (ad) return "Emergency admission (admission referral, placed)";
  const pr = markers.placementReferrals.find(
    (r) => r.urgency === "emergency" && !!r.placement_start_date && normalisedMatch(r.child_name),
  );
  if (pr) return "Emergency placement (commissioning referral)";
  return null;
}
