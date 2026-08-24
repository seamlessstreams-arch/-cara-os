// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME POLICY COMPLIANCE INTELLIGENCE ENGINE
// Home-level: analyses policy currency, staff acknowledgement rates,
// regulatory coverage, and governance to assess policy management.
// CHR 2015 Reg 35, Reg 16. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PolicyInput {
  id: string;
  category: string;
  status: string;              // current | due_review | overdue | draft | archived
  next_review_date: string;
  last_reviewed: string;
  acknowledged_count: number;
  total_staff_required: number;
  has_statutory_basis: boolean;
  has_key_points: boolean;
}

export interface HomePolicyInput {
  today: string;
  policies: PolicyInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PolicyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ComplianceProfile {
  total_policies: number;
  active_count: number;
  current_count: number;
  overdue_count: number;
  due_review_count: number;
  draft_count: number;
  archived_count: number;
  currency_rate: number | null;
}

export interface AcknowledgementProfile {
  avg_acknowledgement_rate: number | null;
  fully_acknowledged_count: number;
  below_threshold_count: number;    // policies where ack < 80%
}

export interface CoverageProfile {
  unique_categories: number;
  has_safeguarding: boolean;
  has_behaviour: boolean;
  has_medication: boolean;
  has_health_safety: boolean;
  has_complaints: boolean;
  has_missing_persons: boolean;
  has_fire_safety: boolean;
}

export interface GovernanceProfile {
  statutory_basis_rate: number | null;
  key_points_rate: number | null;
  avg_days_since_review: number | null;
}

export interface PolicyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PolicyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomePolicyResult {
  policy_rating: PolicyRating;
  policy_score: number | null;
  headline: string;
  compliance_profile: ComplianceProfile;
  acknowledgement_profile: AcknowledgementProfile;
  coverage_profile: CoverageProfile;
  governance_profile: GovernanceProfile;
  strengths: string[];
  concerns: string[];
  recommendations: PolicyRecommendation[];
  insights: PolicyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PolicyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Required Category Set ───────────────────────────────────────────────────

const REQUIRED_CATEGORIES = new Set([
  "safeguarding", "behaviour", "medication", "health_safety",
  "complaints", "missing_persons", "fire_safety",
]);

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomePolicyCompliance(
  input: HomePolicyInput,
): HomePolicyResult {
  const { today, policies } = input;

  // Insufficient data: 0 policies
  if (policies.length === 0) {
    return {
      policy_rating: "insufficient_data",
      policy_score: 0,
      headline: "No home policies found — policy framework not established.",
      compliance_profile: emptyComplianceProfile(),
      acknowledgement_profile: emptyAcknowledgementProfile(),
      coverage_profile: emptyCoverageProfile(),
      governance_profile: emptyGovernanceProfile(),
      strengths: [],
      concerns: ["No policies found — Ofsted expects a comprehensive policy framework covering all aspects of care."],
      recommendations: [{ rank: 1, recommendation: "Develop and implement a complete policy framework covering safeguarding, behaviour support, medication, health & safety, complaints, missing persons, and fire safety at minimum.", urgency: "immediate", regulatory_ref: "Reg 35" }],
      insights: [{ text: "No policies found. A children's home must have a comprehensive set of policies that staff know and follow. Ofsted will judge the home as inadequately led without a policy framework.", severity: "critical" }],
    };
  }

  // ── Classify Policies ─────────────────────────────────────────────
  const archived = policies.filter(p => p.status === "archived");
  const active = policies.filter(p => p.status !== "archived");
  const drafts = active.filter(p => p.status === "draft");
  const nonDraft = active.filter(p => p.status !== "draft");

  // Determine overdue: explicit "overdue" status OR past review date for non-archived non-draft
  const overdueSet = new Set<string>();
  const dueReviewSet = new Set<string>();
  for (const p of nonDraft) {
    if (p.status === "overdue" || (p.next_review_date < today && p.next_review_date !== "")) {
      overdueSet.add(p.id);
    } else if (p.status === "due_review") {
      dueReviewSet.add(p.id);
    }
  }

  const overdueCount = overdueSet.size;
  const dueReviewCount = dueReviewSet.size;
  const currentCount = nonDraft.filter(p => !overdueSet.has(p.id) && !dueReviewSet.has(p.id)).length;
  const currencyRate = rate(currentCount + dueReviewCount, active.length);

  const complianceProfile: ComplianceProfile = {
    total_policies: policies.length,
    active_count: active.length,
    current_count: currentCount,
    overdue_count: overdueCount,
    due_review_count: dueReviewCount,
    draft_count: drafts.length,
    archived_count: archived.length,
    currency_rate: currencyRate,
  };

  // ── Acknowledgement Profile ───────────────────────────────────────
  let totalAckRate = 0;
  let fullyAck = 0;
  let belowThreshold = 0;

  for (const p of active) {
    const ackRate = p.total_staff_required > 0
      ? Math.round((p.acknowledged_count / p.total_staff_required) * 100)
      : 100; // no staff required = considered acknowledged
    totalAckRate += ackRate;
    if (ackRate >= 100) fullyAck++;
    if (ackRate < 80) belowThreshold++;
  }

  const avgAckRate = active.length > 0 ? Math.round(totalAckRate / active.length) : null;

  const acknowledgementProfile: AcknowledgementProfile = {
    avg_acknowledgement_rate: avgAckRate,
    fully_acknowledged_count: fullyAck,
    below_threshold_count: belowThreshold,
  };

  // ── Coverage Profile ──────────────────────────────────────────────
  const activeCategories = new Set(active.map(p => p.category));

  const coverageProfile: CoverageProfile = {
    unique_categories: activeCategories.size,
    has_safeguarding: activeCategories.has("safeguarding"),
    has_behaviour: activeCategories.has("behaviour"),
    has_medication: activeCategories.has("medication"),
    has_health_safety: activeCategories.has("health_safety"),
    has_complaints: activeCategories.has("complaints"),
    has_missing_persons: activeCategories.has("missing_persons"),
    has_fire_safety: activeCategories.has("fire_safety"),
  };

  const coveredRequired = [...REQUIRED_CATEGORIES].filter(c => activeCategories.has(c)).length;

  // ── Governance Profile ────────────────────────────────────────────
  const withStatutoryBasis = active.filter(p => p.has_statutory_basis).length;
  const withKeyPoints = active.filter(p => p.has_key_points).length;
  const statutoryRate = rate(withStatutoryBasis, active.length);
  const keyPointsRate = rate(withKeyPoints, active.length);

  let totalDaysSinceReview = 0;
  let reviewedCount = 0;
  for (const p of active) {
    if (p.last_reviewed && p.last_reviewed <= today) {
      const days = daysBetween(p.last_reviewed, today);
      if (days >= 0) {
        totalDaysSinceReview += days;
        reviewedCount++;
      }
    }
  }
  const avgDaysSinceReview = reviewedCount > 0
    ? Math.round(totalDaysSinceReview / reviewedCount)
    : null;

  const governanceProfile: GovernanceProfile = {
    statutory_basis_rate: statutoryRate,
    key_points_rate: keyPointsRate,
    avg_days_since_review: avgDaysSinceReview,
  };

  // ── Safeguarding Policy Status ────────────────────────────────────
  const safeguardingPolicies = active.filter(p => p.category === "safeguarding");
  const safeguardingCurrent = safeguardingPolicies.some(p => !overdueSet.has(p.id));
  const safeguardingExists = safeguardingPolicies.length > 0;

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Policy currency rate (±5)
  if (meets(currencyRate, 90)) score += 5;
  else if (meets(currencyRate, 75)) score += 2;
  else score -= 3;

  // 2. Overdue count (±4)
  if (overdueCount === 0) score += 4;
  else if (overdueCount === 1) score += 1;
  else score -= 3;

  // 3. Staff acknowledgement avg (±4)
  if ((avgAckRate ?? 0) >= 90) score += 4;
  else if ((avgAckRate ?? 0) >= 75) score += 2;
  else score -= 2;

  // 4. Fully acknowledged policies (±3)
  const fullyAckRate = rate(fullyAck, active.length);
  if (meets(fullyAckRate, 90)) score += 3;
  else if (meets(fullyAckRate, 75)) score += 1;
  else score -= 1;

  // 5. Regulatory coverage (±3)
  if (coveredRequired >= 7) score += 3;
  else if (coveredRequired >= 5) score += 2;
  else if (coveredRequired >= 3) score += 1;
  else score -= 1;

  // 6. Statutory basis documented (±3)
  if (meets(statutoryRate, 100)) score += 3;
  else if (meets(statutoryRate, 80)) score += 1;
  else score -= 1;

  // 7. Key points documented (±3)
  if (meets(keyPointsRate, 100)) score += 3;
  else if (meets(keyPointsRate, 80)) score += 1;
  else score -= 1;

  // 8. Safeguarding policy current (±3)
  if (safeguardingExists && safeguardingCurrent) score += 3;
  else if (safeguardingExists) score -= 1; // exists but overdue
  else score -= 3; // missing entirely

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(currencyRate, 90)) strengths.push(`${formatRate(currencyRate)} of policies current — well-maintained policy framework.`);
  if (overdueCount === 0) strengths.push("No overdue policies — review schedule is being followed.");
  if ((avgAckRate ?? 0) >= 90) strengths.push(`${(avgAckRate ?? 0)}% average staff acknowledgement — staff are reading and signing policies.`);
  if (meets(fullyAckRate, 90) && active.length > 0) strengths.push(`${fullyAck} of ${active.length} policies fully acknowledged by all staff.`);
  if (coveredRequired >= 7) strengths.push(`All ${coveredRequired} required regulatory areas covered — comprehensive policy framework.`);
  if (meets(statutoryRate, 100)) strengths.push("All policies reference statutory basis — strong regulatory alignment.");
  if (safeguardingCurrent && safeguardingExists) strengths.push("Safeguarding policy is current — critical governance requirement met.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (overdueCount > 0) concerns.push(`${overdueCount} polic${overdueCount > 1 ? "ies" : "y"} overdue for review — immediate action needed.`);
  if (below(currencyRate, 75)) concerns.push(`Only ${formatRate(currencyRate)} of policies are current — significant policy maintenance gap.`);
  if ((avgAckRate ?? 0) < 75) concerns.push(`Only ${(avgAckRate ?? 0)}% average staff acknowledgement — staff may not be aware of current policies.`);
  if (belowThreshold > 0) concerns.push(`${belowThreshold} polic${belowThreshold > 1 ? "ies" : "y"} with less than 80% staff acknowledgement.`);
  if (!safeguardingExists) concerns.push("No safeguarding policy found — this is a critical governance failure.");
  if (safeguardingExists && !safeguardingCurrent) concerns.push("Safeguarding policy is overdue for review — this must be addressed immediately.");
  if (coveredRequired < 5) concerns.push(`Only ${coveredRequired} of 7 required regulatory categories covered — policy framework is incomplete.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: PolicyRecommendation[] = [];
  let rank = 1;

  if (!safeguardingExists) {
    recs.push({ rank: rank++, recommendation: "Create a safeguarding policy immediately — this is a fundamental requirement for any children's home.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (safeguardingExists && !safeguardingCurrent) {
    recs.push({ rank: rank++, recommendation: "Review and update the safeguarding policy — it is overdue and must be current at all times.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (overdueCount > 0) {
    recs.push({ rank: rank++, recommendation: `Review ${overdueCount} overdue polic${overdueCount > 1 ? "ies" : "y"} — schedule reviews and assign owners for each.`, urgency: "immediate", regulatory_ref: "Reg 35" });
  }
  if ((avgAckRate ?? 0) < 75) {
    recs.push({ rank: rank++, recommendation: "Improve staff policy acknowledgement — include policy reading in supervision and induction.", urgency: "soon", regulatory_ref: "Reg 35" });
  }
  if (coveredRequired < 5) {
    recs.push({ rank: rank++, recommendation: "Develop policies for missing regulatory areas — ensure safeguarding, behaviour, medication, H&S, complaints, missing persons, and fire safety are all covered.", urgency: "soon", regulatory_ref: "Reg 35" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: PolicyInsight[] = [];

  if (overdueCount === 0 && (avgAckRate ?? 0) >= 90 && coveredRequired >= 7) {
    insights.push({ text: `All policies current, ${formatRate(avgAckRate)} staff acknowledgement, and ${coveredRequired} regulatory areas covered. This evidences outstanding governance — Ofsted will see a well-led home where policies are living documents, not filed and forgotten.`, severity: "positive" });
  }
  if (overdueCount >= 2) {
    insights.push({ text: `${overdueCount} policies overdue for review. Ofsted inspectors will check that policies are reviewed regularly and reflect current practice. Multiple overdue policies suggest governance oversight has lapsed.`, severity: "critical" });
  }
  if (!safeguardingExists || (safeguardingExists && !safeguardingCurrent)) {
    insights.push({ text: "The safeguarding policy is missing or overdue. This is the most critical policy in any children's home — Ofsted will view this as a serious leadership and management failure.", severity: "critical" });
  }
  if ((avgAckRate ?? 0) < 75) {
    insights.push({ text: `Only ${formatRate(avgAckRate)} staff acknowledgement rate. Policies are only effective if staff know them. Ofsted may ask individual staff about policies during inspection — low acknowledgement rates leave the home vulnerable.`, severity: "warning" });
  }
  if (belowThreshold > 0 && (avgAckRate ?? 0) >= 75) {
    insights.push({ text: `${belowThreshold} polic${belowThreshold > 1 ? "ies have" : "y has"} below 80% staff acknowledgement. While overall rates are reasonable, specific gaps may leave some staff unaware of important procedures.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding policy governance — ${active.length} policies current, ${formatRate(avgAckRate)} staff acknowledgement across ${activeCategories.size} areas.`;
  } else if (rating === "good") {
    headline = `Good policy compliance — ${currentCount} of ${active.length} policies current with ${formatRate(avgAckRate)} acknowledgement.`;
  } else if (rating === "adequate") {
    headline = "Adequate policy compliance — gaps in currency, staff acknowledgement, or coverage need addressing.";
  } else {
    headline = "Policy compliance is inadequate — significant gaps in policy currency, acknowledgement, or regulatory coverage.";
  }

  return {
    policy_rating: rating,
    policy_score: score,
    headline,
    compliance_profile: complianceProfile,
    acknowledgement_profile: acknowledgementProfile,
    coverage_profile: coverageProfile,
    governance_profile: governanceProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyComplianceProfile(): ComplianceProfile {
  return {
    total_policies: 0, active_count: 0, current_count: 0, overdue_count: 0,
    due_review_count: 0, draft_count: 0, archived_count: 0, currency_rate: 0,
  };
}

function emptyAcknowledgementProfile(): AcknowledgementProfile {
  return { avg_acknowledgement_rate: 0, fully_acknowledged_count: 0, below_threshold_count: 0 };
}

function emptyCoverageProfile(): CoverageProfile {
  return {
    unique_categories: 0, has_safeguarding: false, has_behaviour: false,
    has_medication: false, has_health_safety: false, has_complaints: false,
    has_missing_persons: false, has_fire_safety: false,
  };
}

function emptyGovernanceProfile(): GovernanceProfile {
  return { statutory_basis_rate: 0, key_points_rate: 0, avg_days_since_review: 0 };
}
