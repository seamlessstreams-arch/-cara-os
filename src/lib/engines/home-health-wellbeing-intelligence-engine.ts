// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HEALTH & WELLBEING INTELLIGENCE ENGINE
// Home-level: synthesises health records across all children to produce an
// overall health monitoring, referral compliance, and wellbeing intelligence.
// CHR 2015 Reg 10. SCCIF: "Health", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HealthRecordInput {
  id: string;
  child_id: string;
  date: string;                            // YYYY-MM-DD
  record_type: string;                     // health_assessment | allergy | mental_health | optical | immunisation | referral | dental | condition | growth
  status: string;                          // current | monitoring | resolved | referred
  has_outcome: boolean;
  has_follow_up: boolean;
  follow_up_overdue: boolean;              // true if follow_up_date < today
}

export interface HomeMedicationInput {
  id: string;
  child_id: string;
  is_active: boolean;
}

export interface MedicationAdminInput {
  id: string;
  child_id: string;
  date: string;
  status: string;                          // administered | refused | late | missed | scheduled
}

export interface HomeHealthWellbeingInput {
  today: string;
  total_children: number;
  child_ids: string[];
  health_records: HealthRecordInput[];
  medications: HomeMedicationInput[];
  medication_administrations: MedicationAdminInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HealthWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HealthRecordsProfile {
  total_records_180d: number;
  records_per_child: number;
  record_types: Record<string, number>;
  children_with_records: string[];
  children_without_records: string[];
  health_assessments_count: number;
  mental_health_count: number;
  referrals_active: number;
  follow_up_compliance_rate: number | null; // % with follow-up not overdue; null when no record carries a follow-up
  overdue_follow_ups: number;
  records_with_outcomes: number;
  outcome_rate: number | null;              // % with documented outcome; null when no records in window
}

export interface MedicationProfile {
  active_medications: number;
  children_on_medication: string[];
  admin_records_30d: number;
  administered_rate: number | null;        // % administered out of non-scheduled; null when nothing was due
  refused_count: number;
  missed_count: number;
  late_count: number;
}

export interface HealthCoverageProfile {
  dental_coverage: boolean;                // at least 1 dental record per child in 180d
  optical_coverage: boolean;               // at least 1 optical per child in 180d
  immunisation_coverage: boolean;          // at least 1 immunisation record per child
  mental_health_monitored: boolean;        // children with MH records being monitored
  growth_monitored: boolean;               // growth records exist
}

export interface HealthInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HealthRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeHealthWellbeingResult {
  health_rating: HealthWellbeingRating;
  health_score: number;
  headline: string;
  records: HealthRecordsProfile;
  medication: MedicationProfile;
  coverage: HealthCoverageProfile;
  strengths: string[];
  concerns: string[];
  recommendations: HealthRecommendation[];
  insights: HealthInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HealthWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeHealthWellbeing(
  input: HomeHealthWellbeingInput,
): HomeHealthWellbeingResult {
  const { today, total_children, child_ids, health_records, medications, medication_administrations } = input;

  // Insufficient data: fewer than 2 records
  if (health_records.length < 2) {
    return {
      health_rating: "insufficient_data",
      health_score: 0,
      headline: "Insufficient health records to assess — ensure all children have documented health assessments.",
      records: emptyRecords(),
      medication: emptyMedication(),
      coverage: emptyCoverage(),
      strengths: [],
      concerns: health_records.length === 0
        ? ["No health records documented — this is a regulatory requirement under Reg 10."]
        : ["Very few health records — comprehensive health monitoring is expected."],
      recommendations: [{ rank: 1, recommendation: "Ensure every child has a health assessment, dental check, and optical review documented.", urgency: "immediate", regulatory_ref: "Reg 10" }],
      insights: [{ text: "Ofsted expects comprehensive health records for every child. Without these, the home cannot evidence compliance with Regulation 10.", severity: "critical" }],
    };
  }

  // ── Health Records Profile ────────────────────────────────────────────
  const recs180d = health_records.filter(r => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 180;
  });

  const recordTypes: Record<string, number> = {};
  for (const r of recs180d) {
    recordTypes[r.record_type] = (recordTypes[r.record_type] || 0) + 1;
  }

  const childrenWithRecords = [...new Set(recs180d.map(r => r.child_id))];
  const childrenWithoutRecords = child_ids.filter(id => !childrenWithRecords.includes(id));

  const healthAssessments = recs180d.filter(r => r.record_type === "health_assessment").length;
  const mentalHealth = recs180d.filter(r => r.record_type === "mental_health").length;
  const activeReferrals = recs180d.filter(r => r.record_type === "referral" && r.status === "referred").length;

  const recsWithFollowUp = recs180d.filter(r => r.has_follow_up);
  const overdueFollowUps = recsWithFollowUp.filter(r => r.follow_up_overdue).length;
  const followUpCompliance = rate(recsWithFollowUp.length - overdueFollowUps, recsWithFollowUp.length);

  const recsWithOutcome = recs180d.filter(r => r.has_outcome).length;
  const outcomeRate = rate(recsWithOutcome, recs180d.length);

  const recordsPerChild = total_children > 0
    ? Math.round((recs180d.length / total_children) * 10) / 10
    : 0;

  const recordsProfile: HealthRecordsProfile = {
    total_records_180d: recs180d.length,
    records_per_child: recordsPerChild,
    record_types: recordTypes,
    children_with_records: childrenWithRecords,
    children_without_records: childrenWithoutRecords,
    health_assessments_count: healthAssessments,
    mental_health_count: mentalHealth,
    referrals_active: activeReferrals,
    follow_up_compliance_rate: followUpCompliance,
    overdue_follow_ups: overdueFollowUps,
    records_with_outcomes: recsWithOutcome,
    outcome_rate: outcomeRate,
  };

  // ── Medication Profile ────────────────────────────────────────────────
  const activeMeds = medications.filter(m => m.is_active);
  const childrenOnMed = [...new Set(activeMeds.map(m => m.child_id))];

  const admins30d = medication_administrations.filter(a => {
    const d = daysBetween(a.date, today);
    return d >= 0 && d <= 30;
  });
  const nonScheduled = admins30d.filter(a => a.status !== "scheduled");
  const administered = nonScheduled.filter(a => a.status === "administered");
  // Null when no dose was due in the window. An empty MAR chart is not a
  // perfect administration record.
  const adminRate = rate(administered.length, nonScheduled.length);

  const refused = admins30d.filter(a => a.status === "refused").length;
  const missed = admins30d.filter(a => a.status === "missed").length;
  const late = admins30d.filter(a => a.status === "late").length;

  const medicationProfile: MedicationProfile = {
    active_medications: activeMeds.length,
    children_on_medication: childrenOnMed,
    admin_records_30d: admins30d.length,
    administered_rate: adminRate,
    refused_count: refused,
    missed_count: missed,
    late_count: late,
  };

  // ── Coverage Profile ──────────────────────────────────────────────────
  const dentalChildren = [...new Set(recs180d.filter(r => r.record_type === "dental").map(r => r.child_id))];
  const opticalChildren = [...new Set(recs180d.filter(r => r.record_type === "optical").map(r => r.child_id))];
  const immunChildren = [...new Set(health_records.filter(r => r.record_type === "immunisation").map(r => r.child_id))];
  const mhMonitored = recs180d.some(r => r.record_type === "mental_health" && (r.status === "monitoring" || r.status === "current"));
  const growthRecords = recs180d.some(r => r.record_type === "growth");

  const coverageProfile: HealthCoverageProfile = {
    dental_coverage: total_children > 0 && dentalChildren.length >= total_children,
    optical_coverage: total_children > 0 && opticalChildren.length >= total_children,
    immunisation_coverage: total_children > 0 && immunChildren.length >= total_children,
    mental_health_monitored: mhMonitored,
    growth_monitored: growthRecords,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Record volume (±12)
  if (recordsPerChild >= 3) score += 8;
  else if (recordsPerChild >= 2) score += 4;
  else if (recordsPerChild < 1) score -= 8;

  // Coverage — children with records (±10)
  if (childrenWithoutRecords.length === 0 && total_children > 0) score += 6;
  else if (childrenWithoutRecords.length >= 2) score -= 8;
  else if (childrenWithoutRecords.length === 1) score -= 3;

  // Health assessments (±8)
  if (healthAssessments >= total_children) score += 5;
  else if (healthAssessments === 0) score -= 6;

  // Follow-up compliance (±8) — unmeasured moves the score neither way
  if (followUpCompliance !== null) {
    if (followUpCompliance === 100) score += 5;
    else if (followUpCompliance >= 80) score += 2;
    else if (followUpCompliance < 60) score -= 6;
    else score -= 2;
  }

  // Outcome documentation (±6)
  if (meets(outcomeRate, 80)) score += 4;
  else if (meets(outcomeRate, 60)) score += 2;
  else if (below(outcomeRate, 40)) score -= 4;

  // Dental & optical coverage (±6)
  if (coverageProfile.dental_coverage) score += 3;
  else score -= 2;
  if (coverageProfile.optical_coverage) score += 3;
  else score -= 2;

  // Mental health monitoring (±4)
  if (mentalHealth > 0 && mhMonitored) score += 3;

  // Medication compliance (±8)
  if (activeMeds.length > 0) {
    if (adminRate === 100 && missed === 0) score += 5;
    else if (meets(adminRate, 90)) score += 2;
    else if (below(adminRate, 80)) score -= 5;
    if (missed >= 3) score -= 3;
  }

  // Overdue follow-ups penalty
  if (overdueFollowUps >= 3) score -= 5;
  else if (overdueFollowUps >= 1) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenWithoutRecords.length === 0 && total_children > 0) strengths.push("All children have documented health records — comprehensive monitoring in place.");
  if (healthAssessments >= total_children && total_children > 0) strengths.push("Health assessments completed for all children — Reg 10 compliance evidenced.");
  if (followUpCompliance === 100 && recsWithFollowUp.length > 0) strengths.push("100% follow-up compliance — all health actions are being tracked and completed on time.");
  if (meets(outcomeRate, 80)) strengths.push(`${outcomeRate}% of health records have documented outcomes — excellent recording practice.`);
  if (adminRate === 100 && activeMeds.length > 0) strengths.push("100% medication administration rate — no missed or refused doses.");
  if (coverageProfile.dental_coverage && coverageProfile.optical_coverage) strengths.push("Full dental and optical coverage across all children.");
  if (mhMonitored && mentalHealth > 0) strengths.push("Active mental health monitoring in place with CAMHS or equivalent engagement.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithoutRecords.length > 0) concerns.push(`${childrenWithoutRecords.length} child${childrenWithoutRecords.length > 1 ? "ren" : ""} with no health records in the last 180 days — all children require documented health monitoring.`);
  if (healthAssessments === 0) concerns.push("No health assessments recorded — initial health assessments are a statutory requirement within 20 days of placement.");
  if (overdueFollowUps > 0) concerns.push(`${overdueFollowUps} overdue health follow-up${overdueFollowUps > 1 ? "s" : ""} — these require urgent attention to maintain compliance.`);
  if (missed > 0) concerns.push(`${missed} missed medication administration${missed > 1 ? "s" : ""} in the last 30 days — each missed dose requires documentation and review.`);
  if (refused > 0) concerns.push(`${refused} refused medication${refused > 1 ? "s" : ""} in the last 30 days — refusals should trigger a review with the prescribing professional.`);
  if (below(outcomeRate, 50)) concerns.push(`Only ${outcomeRate}% of health records have documented outcomes — this weakens the evidence of health monitoring.`);
  if (activeMeds.length > 0 && adminRate === null) concerns.push(`${activeMeds.length} active medication${activeMeds.length > 1 ? "s" : ""} but no administration recorded in the last 30 days — administration cannot be evidenced.`);
  if (!coverageProfile.dental_coverage && total_children > 0) concerns.push("Not all children have dental records in the last 180 days — 6-monthly dental checks are expected.");
  if (!coverageProfile.optical_coverage && total_children > 0) concerns.push("Not all children have optical records in the last 180 days — annual eye tests are expected.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: HealthRecommendation[] = [];
  let rank = 1;

  if (childrenWithoutRecords.length > 0) {
    recs.push({ rank: rank++, recommendation: "Book health assessments for children without recent records — ensure compliance with Reg 10.", urgency: "immediate", regulatory_ref: "Reg 10" });
  }
  if (overdueFollowUps > 0) {
    recs.push({ rank: rank++, recommendation: `Address ${overdueFollowUps} overdue health follow-up${overdueFollowUps > 1 ? "s" : ""} — rebook and document outcomes.`, urgency: "immediate", regulatory_ref: "Reg 10" });
  }
  if (missed > 0) {
    recs.push({ rank: rank++, recommendation: "Review missed medication doses with the prescribing clinician and update MAR charts.", urgency: "soon", regulatory_ref: "Reg 23" });
  }
  if (!coverageProfile.dental_coverage && total_children > 0) {
    recs.push({ rank: rank++, recommendation: "Arrange dental check-ups for children without recent dental records.", urgency: "soon", regulatory_ref: "Reg 10" });
  }
  if (!coverageProfile.optical_coverage && total_children > 0) {
    recs.push({ rank: rank++, recommendation: "Arrange eye tests for children without recent optical records.", urgency: "planned", regulatory_ref: "Reg 10" });
  }
  if (below(outcomeRate, 60)) {
    recs.push({ rank: rank++, recommendation: "Improve outcome documentation on health records — record what happened after each appointment.", urgency: "planned", regulatory_ref: "Reg 10" });
  }
  if (activeMeds.length > 0 && adminRate === null) {
    recs.push({ rank: rank++, recommendation: "Record medication administration on the MAR chart — no administration has been logged for active medications in the last 30 days.", urgency: "immediate", regulatory_ref: "Reg 23" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: HealthInsight[] = [];

  if (childrenWithoutRecords.length > 0) {
    insights.push({ text: `${childrenWithoutRecords.length} child${childrenWithoutRecords.length > 1 ? "ren have" : " has"} no health records in 180 days. Ofsted will view this as a failure to promote health outcomes under Regulation 10.`, severity: "critical" });
  }
  if (missed >= 3) {
    insights.push({ text: `${missed} missed medication doses in 30 days. This pattern requires immediate clinical review and may indicate safeguarding concerns.`, severity: "critical" });
  }
  if (overdueFollowUps >= 2) {
    insights.push({ text: `${overdueFollowUps} overdue follow-ups suggest health actions are not being tracked effectively. This undermines the health action plan.`, severity: "warning" });
  }
  if (childrenWithoutRecords.length === 0 && total_children > 0 && recordsPerChild >= 2) {
    insights.push({ text: "Comprehensive health monitoring across all children with strong recording practice. This evidences a proactive approach to health outcomes.", severity: "positive" });
  }
  if (adminRate === 100 && activeMeds.length > 0 && missed === 0) {
    insights.push({ text: "Perfect medication administration record — no missed or refused doses. This is excellent evidence of safe medication management.", severity: "positive" });
  }
  if (coverageProfile.dental_coverage && coverageProfile.optical_coverage && coverageProfile.mental_health_monitored) {
    insights.push({ text: "Full health coverage: dental, optical, and mental health all actively monitored. This is Ofsted-outstanding standard.", severity: "positive" });
  }
  if (recordsPerChild >= 3 && followUpCompliance === 100 && recsWithFollowUp.length > 0) {
    insights.push({ text: "High record volume with complete follow-up tracking. The home can confidently evidence health outcomes to Ofsted.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding health monitoring — comprehensive records, strong coverage, and excellent follow-up compliance.";
  } else if (rating === "good") {
    headline = `Good health monitoring — ${recs180d.length} records across ${childrenWithRecords.length} children with ${formatRate(followUpCompliance, "no")} follow-up compliance.`;
  } else if (rating === "adequate") {
    headline = "Adequate health monitoring — some gaps in coverage or follow-up compliance need addressing.";
  } else {
    headline = "Health monitoring is inadequate — significant gaps in records, coverage, or follow-up compliance.";
  }

  return {
    health_rating: rating,
    health_score: score,
    headline,
    records: recordsProfile,
    medication: medicationProfile,
    coverage: coverageProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyRecords(): HealthRecordsProfile {
  return {
    total_records_180d: 0, records_per_child: 0, record_types: {},
    children_with_records: [], children_without_records: [],
    health_assessments_count: 0, mental_health_count: 0, referrals_active: 0,
    follow_up_compliance_rate: null, overdue_follow_ups: 0,
    records_with_outcomes: 0, outcome_rate: null,
  };
}

function emptyMedication(): MedicationProfile {
  return {
    active_medications: 0, children_on_medication: [],
    admin_records_30d: 0, administered_rate: null,
    refused_count: 0, missed_count: 0, late_count: 0,
  };
}

function emptyCoverage(): HealthCoverageProfile {
  return {
    dental_coverage: false, optical_coverage: false,
    immunisation_coverage: false, mental_health_monitored: false,
    growth_monitored: false,
  };
}
