// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ADMISSION & PLACEMENT INTELLIGENCE ENGINE
// Home-level: analyses admission referrals to assess placement matching quality,
// impact assessment compliance, decision timeliness, referral volume, and
// alignment with the Statement of Purpose.
// CHR 2015 Reg 14. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AdmissionReferralInput {
  id: string;
  referral_date: string;
  referral_source: string;                     // local_authority | agency | emergency | internal_transfer | court_directed
  status: string;                              // new | under_assessment | impact_assessment | panel_decision | accepted | declined | withdrawn | placed
  presenting_needs_count: number;
  risk_factors_count: number;
  impact_assessment_complete: boolean;
  has_matching_considerations: boolean;
  has_decision_reason: boolean;
  decision_date: string;
  days_to_decision: number;                    // -1 if no decision yet
}

export interface HomeAdmissionInput {
  today: string;
  total_children: number;
  registered_beds: number;
  referrals: AdmissionReferralInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AdmissionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ReferralProfile {
  total_referrals: number;
  active: number;
  accepted: number;
  declined: number;
  withdrawn: number;
  placed: number;
  emergency_count: number;
  acceptance_rate: number;
}

export interface AssessmentProfile {
  impact_assessment_rate: number;
  matching_consideration_rate: number;
  decision_documented_rate: number;
  avg_days_to_decision: number;
  pending_over_14_days: number;
}

export interface QualityProfile {
  avg_needs_per_referral: number;
  avg_risk_factors_per_referral: number;
  declined_with_reason_rate: number;
  occupancy_rate: number;
}

export interface AdmissionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AdmissionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeAdmissionResult {
  admission_rating: AdmissionRating;
  admission_score: number;
  headline: string;
  referral_profile: ReferralProfile;
  assessment_profile: AssessmentProfile;
  quality_profile: QualityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: AdmissionRecommendation[];
  insights: AdmissionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AdmissionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeAdmission(
  input: HomeAdmissionInput,
): HomeAdmissionResult {
  const { today, total_children, registered_beds, referrals } = input;

  // Insufficient data
  if (referrals.length === 0) {
    return {
      admission_rating: "insufficient_data",
      admission_score: 0,
      headline: "No admission referral data available.",
      referral_profile: emptyRefProfile(),
      assessment_profile: emptyAssProfile(),
      quality_profile: emptyQualProfile(total_children, registered_beds),
      strengths: [],
      concerns: ["No admission referral data found."],
      recommendations: [{ rank: 1, recommendation: "Ensure all admission referrals are logged in the system — Ofsted expects a clear record of the referral and matching process.", urgency: "soon", regulatory_ref: "Reg 14" }],
      insights: [{ text: "No admission referral data exists. Ofsted expects transparent evidence of the referral, matching, and impact assessment process for every child considered for placement.", severity: "critical" }],
    };
  }

  // ── Referral Profile ────────────────────────────────────────────────
  const active = referrals.filter(r => ["new", "under_assessment", "impact_assessment", "panel_decision"].includes(r.status)).length;
  const accepted = referrals.filter(r => r.status === "accepted").length;
  const declined = referrals.filter(r => r.status === "declined").length;
  const withdrawn = referrals.filter(r => r.status === "withdrawn").length;
  const placed = referrals.filter(r => r.status === "placed").length;
  const emergency = referrals.filter(r => r.referral_source === "emergency").length;

  const decided = referrals.filter(r => ["accepted", "declined", "placed"].includes(r.status));
  const acceptedOrPlaced = decided.filter(r => r.status === "accepted" || r.status === "placed").length;
  const acceptanceRate = pct(acceptedOrPlaced, decided.length);

  const refProfile: ReferralProfile = {
    total_referrals: referrals.length,
    active,
    accepted,
    declined,
    withdrawn,
    placed,
    emergency_count: emergency,
    acceptance_rate: acceptanceRate,
  };

  // ── Assessment Profile ──────────────────────────────────────────────
  // Impact assessments should be done for all non-withdrawn referrals
  const nonWithdrawn = referrals.filter(r => r.status !== "withdrawn");
  const withImpact = nonWithdrawn.filter(r => r.impact_assessment_complete).length;
  const impactRate = pct(withImpact, nonWithdrawn.length);

  const withMatching = nonWithdrawn.filter(r => r.has_matching_considerations).length;
  const matchingRate = pct(withMatching, nonWithdrawn.length);

  const withDecisionReason = decided.filter(r => r.has_decision_reason).length;
  const decisionDocRate = pct(withDecisionReason, decided.length);

  // Average days to decision for decided referrals
  const decisionDays = decided.filter(r => r.days_to_decision >= 0).map(r => r.days_to_decision);
  const avgDaysToDecision = decisionDays.length > 0
    ? Math.round(decisionDays.reduce((a, b) => a + b, 0) / decisionDays.length)
    : 0;

  // Pending referrals over 14 days old without decision
  const pendingOver14 = referrals.filter(r =>
    ["new", "under_assessment", "impact_assessment", "panel_decision"].includes(r.status) &&
    r.days_to_decision === -1 &&
    r.referral_date <= today, // ensure it's a real referral date
  ).length;
  // More accurate: check if referral_date is more than 14 days ago
  const pendingOver14Days = referrals.filter(r => {
    if (!["new", "under_assessment", "impact_assessment", "panel_decision"].includes(r.status)) return false;
    const refDate = new Date(r.referral_date);
    const todayDate = new Date(today);
    const diffDays = (todayDate.getTime() - refDate.getTime()) / 86_400_000;
    return diffDays > 14;
  }).length;

  const assessProfile: AssessmentProfile = {
    impact_assessment_rate: impactRate,
    matching_consideration_rate: matchingRate,
    decision_documented_rate: decisionDocRate,
    avg_days_to_decision: avgDaysToDecision,
    pending_over_14_days: pendingOver14Days,
  };

  // ── Quality Profile ─────────────────────────────────────────────────
  const avgNeeds = referrals.length > 0
    ? Math.round((referrals.reduce((a, r) => a + r.presenting_needs_count, 0) / referrals.length) * 10) / 10
    : 0;

  const avgRisk = referrals.length > 0
    ? Math.round((referrals.reduce((a, r) => a + r.risk_factors_count, 0) / referrals.length) * 10) / 10
    : 0;

  const declinedWithReason = referrals.filter(r => r.status === "declined" && r.has_decision_reason).length;
  const declinedReasonRate = pct(declinedWithReason, declined);

  const occupancyRate = registered_beds > 0 ? pct(total_children, registered_beds) : 0;

  const qualProfile: QualityProfile = {
    avg_needs_per_referral: avgNeeds,
    avg_risk_factors_per_referral: avgRisk,
    declined_with_reason_rate: declinedReasonRate,
    occupancy_rate: occupancyRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 54;

  // 1. Impact assessment rate (±5)
  if (impactRate >= 80) score += 5;
  else if (impactRate >= 60) score += 2;
  else score -= 4;

  // 2. Matching consideration rate (±4)
  if (matchingRate >= 80) score += 4;
  else if (matchingRate >= 60) score += 2;
  else score -= 3;

  // 3. Decision documentation (±4)
  if (decided.length > 0) {
    if (decisionDocRate >= 80) score += 4;
    else if (decisionDocRate >= 60) score += 2;
    else score -= 3;
  }

  // 4. Decision timeliness (±3)
  if (decided.length > 0) {
    if (avgDaysToDecision <= 14) score += 3;
    else if (avgDaysToDecision <= 21) score += 1;
    else score -= 2;
  }

  // 5. Pending referrals (±3)
  if (pendingOver14Days === 0) score += 3;
  else if (pendingOver14Days <= 1) score += 1;
  else score -= 3;

  // 6. Declined with reason (±3)
  if (declined > 0) {
    if (declinedReasonRate === 100) score += 3;
    else score -= 2;
  } else {
    score += 2; // no declines to worry about
  }

  // 7. Emergency referrals proportion (±2)
  const emergencyPct = pct(emergency, referrals.length);
  if (emergencyPct <= 20) score += 2;
  else if (emergencyPct <= 40) score += 0;
  else score -= 2;

  // 8. Acceptance rate reasonableness (±2) — not too high (rubber-stamping) not too low
  if (decided.length > 0) {
    if (acceptanceRate >= 30 && acceptanceRate <= 80) score += 2;
    else if (acceptanceRate > 80) score += 0; // might be rubber-stamping
    else score -= 1; // very low acceptance
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (impactRate >= 80) strengths.push(`Impact assessments completed for ${impactRate}% of referrals — matching decisions are evidence-based.`);
  if (matchingRate >= 80) strengths.push(`Matching considerations documented for ${matchingRate}% of referrals — placement stability is prioritised.`);
  if (decisionDocRate >= 80 && decided.length > 0) strengths.push(`Decision rationale documented for ${decisionDocRate}% of decisions — transparent governance.`);
  if (avgDaysToDecision <= 14 && decided.length > 0) strengths.push(`Average decision time ${avgDaysToDecision} days — referrals are processed promptly.`);
  if (declinedReasonRate === 100 && declined > 0) strengths.push("All declined referrals have documented rationale — accountability and transparency in admissions.");
  if (pendingOver14Days === 0) strengths.push("No referrals pending beyond 14 days — admission process is timely.");
  if (placed > 0 && impactRate >= 80) strengths.push(`${placed} successful placement${placed > 1 ? "s" : ""} with comprehensive impact assessment — safe, considered admissions.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (impactRate < 60 && nonWithdrawn.length > 0) concerns.push(`Impact assessments completed for only ${impactRate}% of referrals — Reg 14 requires assessment of impact on existing children.`);
  if (matchingRate < 60 && nonWithdrawn.length > 0) concerns.push(`Matching considerations documented for only ${matchingRate}% of referrals — placement matching must be thorough.`);
  if (pendingOver14Days > 0) concerns.push(`${pendingOver14Days} referral${pendingOver14Days > 1 ? "s" : ""} pending over 14 days — children and placing authorities need timely responses.`);
  if (avgDaysToDecision > 21 && decided.length > 0) concerns.push(`Average ${avgDaysToDecision} days to decision — referrals should be processed within 14 days where possible.`);
  if (declinedReasonRate < 100 && declined > 0) concerns.push("Not all declined referrals have a documented reason — transparency is essential.");
  if (emergencyPct > 40) concerns.push(`${emergencyPct}% of referrals are emergency — high emergency rate may indicate the home is being used as a last resort rather than a planned placement.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: AdmissionRecommendation[] = [];
  let rank = 1;

  if (impactRate < 60 && nonWithdrawn.length > 0) {
    recs.push({ rank: rank++, recommendation: "Complete impact assessments for all referrals before making placement decisions.", urgency: "immediate", regulatory_ref: "Reg 14" });
  }
  if (pendingOver14Days > 0) {
    recs.push({ rank: rank++, recommendation: `Process ${pendingOver14Days} outstanding referral${pendingOver14Days > 1 ? "s" : ""} pending over 14 days.`, urgency: "immediate", regulatory_ref: "Reg 14" });
  }
  if (matchingRate < 60 && nonWithdrawn.length > 0) {
    recs.push({ rank: rank++, recommendation: "Document matching considerations for all referrals — assess compatibility with existing children.", urgency: "soon", regulatory_ref: "Reg 14" });
  }
  if (declinedReasonRate < 100 && declined > 0) {
    recs.push({ rank: rank++, recommendation: "Document clear rationale for all declined referrals.", urgency: "soon", regulatory_ref: "Reg 14" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: AdmissionInsight[] = [];

  if (impactRate < 60 && nonWithdrawn.length > 0) {
    insights.push({ text: `Impact assessments completed for only ${impactRate}% of referrals. Ofsted expects every placement decision to be informed by a thorough impact assessment. This is a Reg 14 requirement and a common area of inspection criticism.`, severity: "critical" });
  }
  if (pendingOver14Days > 1) {
    insights.push({ text: `${pendingOver14Days} referrals pending beyond 14 days. Ofsted expects timely decision-making — delayed responses affect children waiting for placement and damage relationships with placing authorities.`, severity: "warning" });
  }
  if (impactRate >= 80 && matchingRate >= 80 && decisionDocRate >= 80) {
    insights.push({ text: `${impactRate}% impact assessment, ${matchingRate}% matching consideration, and ${decisionDocRate}% decision documentation rates demonstrate a rigorous, transparent admissions process — a key indicator of outstanding leadership.`, severity: "positive" });
  }
  if (declined > 0 && declinedReasonRate === 100) {
    insights.push({ text: `${declined} referral${declined > 1 ? "s" : ""} appropriately declined with documented rationale. This evidences that the home operates within its Statement of Purpose and prioritises existing children's safety — Ofsted values this discipline.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding admissions practice — ${impactRate}% impact assessment rate with ${avgDaysToDecision}-day average decision time.`;
  } else if (rating === "good") {
    headline = `Good admissions practice — thorough assessment process with ${impactRate}% impact assessment completion.`;
  } else if (rating === "adequate") {
    headline = "Adequate admissions — gaps in impact assessment, matching documentation, or decision timeliness need addressing.";
  } else {
    headline = "Admissions practice is inadequate — significant gaps in impact assessment, matching, or decision documentation.";
  }

  return {
    admission_rating: rating,
    admission_score: score,
    headline,
    referral_profile: refProfile,
    assessment_profile: assessProfile,
    quality_profile: qualProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyRefProfile(): ReferralProfile {
  return {
    total_referrals: 0, active: 0, accepted: 0, declined: 0,
    withdrawn: 0, placed: 0, emergency_count: 0, acceptance_rate: 0,
  };
}

function emptyAssProfile(): AssessmentProfile {
  return {
    impact_assessment_rate: 0, matching_consideration_rate: 0,
    decision_documented_rate: 0, avg_days_to_decision: 0,
    pending_over_14_days: 0,
  };
}

function emptyQualProfile(totalChildren: number, beds: number): QualityProfile {
  return {
    avg_needs_per_referral: 0, avg_risk_factors_per_referral: 0,
    declined_with_reason_rate: 0,
    occupancy_rate: beds > 0 ? pct(totalChildren, beds) : 0,
  };
}
