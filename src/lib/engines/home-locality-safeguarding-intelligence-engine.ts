// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LOCALITY SAFEGUARDING INTELLIGENCE ENGINE
// Home-level: measures the home's awareness and response to local community
// risks — locality risk mapping, exploitation screening coverage, mitigation
// effectiveness, review currency, safety planning, and contextual safeguarding
// awareness.
// CHR 2015 Reg 12 (Duty of Care), Reg 34 (Location Risk Assessment),
// Reg 35 (Behaviour Management).
// SCCIF: "Safety of children", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LocalityRiskInput {
  id: string;
  category: string; // "cse" | "ccse" | "county_lines" | "gangs" | "radicalisation" | "substance_misuse" | etc.
  risk_level: string; // "high" | "medium" | "low"
  location: string;
  has_description: boolean;
  has_intelligence: boolean;
  mitigations_count: number;
  effective_mitigations: number;
  last_reviewed: string; // ISO date
  next_review: string; // ISO date
  has_impact_assessment: boolean;
}

export interface ExploitationScreeningInput {
  id: string;
  child_id: string;
  date: string; // ISO date
  exploitation_type: string;
  risk_level: string; // "high" | "medium" | "low"
  previous_risk_level: string;
  status: string; // "referred" | "open" | "closed" | "monitoring"
  risk_indicators_count: number;
  indicators_present: number;
  protective_factors_count: number;
  has_safety_plan: boolean;
  has_direct_work: boolean;
  has_management_oversight: boolean;
  multi_agency_count: number;
  social_worker_notified: boolean;
  nrm_referral: boolean;
}

export interface MissingEpisodeInput {
  id: string;
  child_id: string;
  date_missing: string; // ISO date
  date_returned: string; // ISO date or ""
  return_interview_completed: boolean;
  police_notified: boolean;
  social_worker_notified: boolean;
}

export interface LocalitySafeguardingInput {
  today: string;
  total_children: number;
  risks: LocalityRiskInput[];
  screenings: ExploitationScreeningInput[];
  missing: MissingEpisodeInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LocalitySafeguardingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LocalitySafeguardingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface LocalitySafeguardingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface LocalitySafeguardingResult {
  locality_rating: LocalitySafeguardingRating;
  locality_score: number;
  headline: string;
  total_risks: number;
  mitigation_effectiveness: number;
  review_currency_rate: number;
  screening_coverage: number;
  high_risk_count: number;
  safety_plan_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: LocalitySafeguardingRecommendation[];
  insights: LocalitySafeguardingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function toRating(score: number): LocalitySafeguardingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeLocalitySafeguarding(
  input: LocalitySafeguardingInput,
): LocalitySafeguardingResult {
  const { today, total_children, risks, screenings: allScreenings, missing: allMissing } = input;

  // Special case: no children → insufficient data
  if (total_children === 0) {
    return {
      locality_rating: "insufficient_data",
      locality_score: 0,
      headline: "No children placed — locality safeguarding data not available.",
      total_risks: risks.length,
      mitigation_effectiveness: 0,
      review_currency_rate: 0,
      screening_coverage: 0,
      high_risk_count: 0,
      safety_plan_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No children currently placed in this home. Locality safeguarding metrics require active placements to assess.", severity: "warning" }],
    };
  }

  // 180-day rolling window for screenings and missing
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 180);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const screenings = allScreenings.filter(s => s.date >= cutoffStr && s.date <= today);
  const missing = allMissing.filter(m => m.date_missing >= cutoffStr && m.date_missing <= today);

  // Special case: 0 risks AND 0 screenings AND 0 missing with children → good (no community risks = positive)
  if (risks.length === 0 && screenings.length === 0 && missing.length === 0) {
    return {
      locality_rating: "good",
      locality_score: 75,
      headline: "No community risks identified — locality risk profile is clear with no active concerns.",
      total_risks: 0,
      mitigation_effectiveness: 0,
      review_currency_rate: 0,
      screening_coverage: 0,
      high_risk_count: 0,
      safety_plan_rate: 0,
      strengths: ["No identified locality risks, exploitation screenings, or missing episodes — the community risk profile is currently clear."],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Maintain proactive locality risk mapping — conduct regular environmental scans to ensure emerging risks are identified early, even when the current profile is clear.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 34" }],
      insights: [{ text: "No locality risks, exploitation screenings, or missing episodes recorded. While this is positive, ensure the home maintains proactive environmental scanning and contextual safeguarding awareness. Ofsted expects homes to demonstrate active engagement with their locality risk profile under Reg 34.", severity: "positive" }],
    };
  }

  // ── Compute Metrics ───────────────────────────────────────────────────

  // Locality risk metrics
  const totalRisks = risks.length;
  const highRiskCount = risks.filter(r => r.risk_level === "high").length;

  // Mitigation effectiveness: pct of effective mitigations across all risks
  const totalMitigations = risks.reduce((sum, r) => sum + r.mitigations_count, 0);
  const totalEffective = risks.reduce((sum, r) => sum + r.effective_mitigations, 0);
  const mitigationEffectiveness = pct(totalEffective, totalMitigations);

  // Review currency: risk is "current" if last_reviewed within 30 days of today
  const currentRisks = risks.filter(r => {
    const daysAgo = daysBetween(r.last_reviewed, today);
    return daysAgo <= 30;
  });
  const reviewCurrencyRate = pct(currentRisks.length, risks.length);

  // Screening coverage: pct of unique children with at least one screening in last 180 days
  const screenedChildren = new Set(screenings.map(s => s.child_id));
  const screeningCoverage = pct(screenedChildren.size, total_children);

  // Safety plan rate: pct of screenings with has_safety_plan
  const withSafetyPlan = screenings.filter(s => s.has_safety_plan);
  const safetyPlanRate = pct(withSafetyPlan.length, screenings.length);

  // High risk screenings
  const highRiskScreenings = screenings.filter(s => s.risk_level === "high");

  // Management oversight rate
  const withOversight = screenings.filter(s => s.has_management_oversight);
  const managementOversightRate = pct(withOversight.length, screenings.length);

  // Return interview rate for missing episodes
  const returnedMissing = missing.filter(m => m.date_returned !== "");
  const returnInterviewRate = pct(
    returnedMissing.filter(m => m.return_interview_completed).length,
    returnedMissing.length,
  );

  // Impact assessment rate for risks
  const withImpactAssessment = risks.filter(r => r.has_impact_assessment);
  const impactAssessmentRate = pct(withImpactAssessment.length, risks.length);

  // ── Scoring: Base 52 + 6 modifiers ────────────────────────────────────

  let score = 52;

  // 1. Mitigation effectiveness (effective_mitigations / mitigations_count across all risks)
  if (totalMitigations === 0) {
    score -= 2;
  } else {
    if (mitigationEffectiveness >= 90) score += 6;
    else if (mitigationEffectiveness >= 75) score += 3;
    else if (mitigationEffectiveness < 50) score -= 6;
    else if (mitigationEffectiveness < 65) score -= 3;
  }

  // 2. Review currency (locality risks reviewed within 30 days)
  if (risks.length === 0) {
    // no penalty — handled by special case above or no risks to review
    score += 0;
  } else {
    if (reviewCurrencyRate >= 90) score += 5;
    else if (reviewCurrencyRate >= 70) score += 2;
    else if (reviewCurrencyRate < 50) score -= 5;
  }

  // 3. Screening coverage (unique children screened in last 180 days)
  if (screenings.length === 0) {
    // No screenings could be ok if no exploitation risk, or concerning if risks exist
    if (highRiskCount > 0) score -= 4;
    else score -= 1;
  } else {
    if (screeningCoverage >= 90) score += 5;
    else if (screeningCoverage >= 70) score += 2;
    else if (screeningCoverage < 50) score -= 5;
  }

  // 4. Safety planning (screenings with safety plans)
  if (screenings.length === 0) {
    score += 0; // neutral — no screenings to plan for
  } else {
    if (safetyPlanRate >= 90) score += 5;
    else if (safetyPlanRate >= 70) score += 2;
    else if (safetyPlanRate < 50) score -= 4;
  }

  // 5. Risk intelligence quality (has_description AND has_intelligence on locality risks)
  const risksWithIntel = risks.filter(r => r.has_description && r.has_intelligence);
  const intelRate = pct(risksWithIntel.length, risks.length);
  if (risks.length === 0) {
    score += 0;
  } else {
    if (intelRate >= 90) score += 5;
    else if (intelRate >= 70) score += 2;
    else if (intelRate < 50) score -= 4;
  }

  // 6. Missing episode response (return interviews + police/social worker notifications)
  if (missing.length === 0) {
    score += 2; // no missing episodes is positive
  } else {
    const policeRate = pct(missing.filter(m => m.police_notified).length, missing.length);
    const swRate = pct(missing.filter(m => m.social_worker_notified).length, missing.length);
    if (returnInterviewRate >= 90 && policeRate >= 90 && swRate >= 90) score += 5;
    else if (returnInterviewRate >= 70 && policeRate >= 70) score += 2;
    else if (returnInterviewRate < 50) score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (totalMitigations > 0 && mitigationEffectiveness >= 90) {
    strengths.push(`${mitigationEffectiveness}% mitigation effectiveness — locality risk mitigations are working effectively to protect children.`);
  } else if (totalMitigations > 0 && mitigationEffectiveness >= 75) {
    strengths.push(`${mitigationEffectiveness}% mitigation effectiveness — good evidence that locality risk mitigations are reducing exposure.`);
  }

  if (risks.length > 0 && reviewCurrencyRate >= 90) {
    strengths.push(`${reviewCurrencyRate}% of locality risks reviewed within 30 days — risk mapping is current and actively maintained.`);
  } else if (risks.length > 0 && reviewCurrencyRate >= 70) {
    strengths.push(`${reviewCurrencyRate}% review currency rate — most locality risks are being reviewed regularly.`);
  }

  if (screenings.length > 0 && screeningCoverage >= 90) {
    strengths.push(`${screeningCoverage}% screening coverage — exploitation screening is comprehensive across all children.`);
  } else if (screenings.length > 0 && screeningCoverage >= 70) {
    strengths.push(`${screeningCoverage}% screening coverage — good exploitation screening coverage across children.`);
  }

  if (screenings.length > 0 && safetyPlanRate >= 90) {
    strengths.push(`${safetyPlanRate}% of screenings have safety plans — proactive safety planning is embedded in exploitation response.`);
  }

  if (risks.length > 0 && intelRate >= 90) {
    strengths.push(`${intelRate}% of locality risks have full intelligence records — contextual safeguarding awareness is thorough.`);
  }

  if (missing.length > 0 && returnInterviewRate >= 90) {
    strengths.push(`${returnInterviewRate}% return interview completion — missing episodes are being followed up comprehensively.`);
  }

  if (missing.length === 0 && total_children > 0) {
    strengths.push("No missing episodes in the last 180 days — children are settled and safe in their placements.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (totalMitigations > 0 && mitigationEffectiveness < 50) {
    concerns.push(`Only ${mitigationEffectiveness}% mitigation effectiveness — ${totalMitigations - totalEffective} mitigations are not demonstrably reducing locality risks, leaving children potentially exposed.`);
  }

  if (risks.length > 0 && reviewCurrencyRate < 50) {
    const staleCount = risks.length - currentRisks.length;
    concerns.push(`Only ${reviewCurrencyRate}% review currency — ${staleCount} locality ${staleCount === 1 ? "risk has" : "risks have"} not been reviewed within 30 days, meaning the home's risk map may not reflect current community threats.`);
  }

  if (screenings.length > 0 && screeningCoverage < 50) {
    const unscreened = total_children - screenedChildren.size;
    concerns.push(`Only ${screeningCoverage}% screening coverage — ${unscreened} ${unscreened === 1 ? "child has" : "children have"} not been screened for exploitation in the last 180 days.`);
  }

  if (screenings.length > 0 && safetyPlanRate < 50) {
    const withoutPlan = screenings.length - withSafetyPlan.length;
    concerns.push(`Only ${safetyPlanRate}% of screenings have safety plans — ${withoutPlan} ${withoutPlan === 1 ? "screening lacks" : "screenings lack"} a documented safety plan to protect the child.`);
  }

  if (risks.length > 0 && intelRate < 50) {
    concerns.push(`Only ${intelRate}% of locality risks have full intelligence — without descriptions and intelligence, the home cannot demonstrate contextual safeguarding awareness.`);
  }

  if (highRiskCount > 0 && screenings.length === 0) {
    concerns.push(`${highRiskCount} high-risk locality ${highRiskCount === 1 ? "threat" : "threats"} identified but no exploitation screenings completed — children may be exposed to community risks without assessment.`);
  }

  if (returnedMissing.length > 0 && returnInterviewRate < 50) {
    const withoutInterview = returnedMissing.length - returnedMissing.filter(m => m.return_interview_completed).length;
    concerns.push(`Only ${returnInterviewRate}% return interview rate — ${withoutInterview} returned missing ${withoutInterview === 1 ? "episode lacks" : "episodes lack"} a return interview, missing opportunities to understand push/pull factors.`);
  }

  if (highRiskScreenings.length > 0) {
    const withoutSafety = highRiskScreenings.filter(s => !s.has_safety_plan);
    if (withoutSafety.length > 0) {
      concerns.push(`${withoutSafety.length} high-risk exploitation ${withoutSafety.length === 1 ? "screening lacks" : "screenings lack"} a safety plan — children at highest risk must have documented protective measures.`);
    }
  }

  if (risks.length > 0 && impactAssessmentRate < 50) {
    concerns.push(`Only ${impactAssessmentRate}% of locality risks have impact assessments — the home cannot fully evidence how community risks affect individual children.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recs: LocalitySafeguardingRecommendation[] = [];
  let rank = 1;

  if (totalMitigations > 0 && mitigationEffectiveness < 50) {
    recs.push({ rank: rank++, recommendation: "Review and strengthen locality risk mitigations — current measures are not demonstrably effective. Each identified community risk must have evidenced, working mitigations.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 34" });
  }

  if (risks.length > 0 && reviewCurrencyRate < 50) {
    recs.push({ rank: rank++, recommendation: "Implement monthly locality risk review cycle — all identified community risks must be reviewed at least every 30 days to ensure the risk map reflects current threats.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 34" });
  }

  if (screenings.length > 0 && screeningCoverage < 50) {
    recs.push({ rank: rank++, recommendation: "Extend exploitation screening to all children — every child should receive at least one screening within a 180-day period to identify vulnerability to community risks.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  if (highRiskCount > 0 && screenings.length === 0) {
    recs.push({ rank: rank++, recommendation: "Implement exploitation screening urgently — high-risk locality threats exist but no children have been screened. All children must be assessed against identified community risks.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  if (screenings.length > 0 && safetyPlanRate < 50) {
    recs.push({ rank: rank++, recommendation: "Develop safety plans for all exploitation screenings — each screening should result in a documented safety plan with clear protective actions and responsible professionals.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 35" });
  }

  if (risks.length > 0 && intelRate < 50) {
    recs.push({ rank: rank++, recommendation: "Improve locality risk intelligence quality — each risk should have a full description and intelligence record to evidence contextual safeguarding awareness.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 34" });
  }

  if (returnedMissing.length > 0 && returnInterviewRate < 50) {
    recs.push({ rank: rank++, recommendation: "Ensure return interviews are completed for every missing episode — understanding push and pull factors is essential for preventing future episodes and identifying exploitation.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  if (risks.length > 0 && impactAssessmentRate < 50) {
    recs.push({ rank: rank++, recommendation: "Complete impact assessments for all locality risks — each community risk needs an assessment of how it specifically affects the children placed in this home.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 34" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: LocalitySafeguardingInsight[] = [];

  if (totalMitigations > 0 && mitigationEffectiveness >= 90 && risks.length > 0 && reviewCurrencyRate >= 90 && intelRate >= 90) {
    insights.push({ text: `Locality safeguarding is exemplary — ${mitigationEffectiveness}% mitigation effectiveness, ${reviewCurrencyRate}% review currency, and ${intelRate}% intelligence quality. The home demonstrates comprehensive contextual safeguarding awareness with active, evidenced responses to community risks. Ofsted will see a home that fully understands and manages its locality risk profile.`, severity: "positive" });
  }

  if (screenings.length > 0 && screeningCoverage >= 90 && safetyPlanRate >= 90) {
    insights.push({ text: `Strong exploitation screening practice — ${screeningCoverage}% coverage with ${safetyPlanRate}% safety plan completion shows that the home is proactively identifying and responding to exploitation risks. This evidences a robust approach to the SCCIF "Safety of children" judgement area.`, severity: "positive" });
  }

  if (missing.length === 0 && total_children > 0 && screenings.length > 0 && screeningCoverage >= 70) {
    insights.push({ text: `No missing episodes combined with ${screeningCoverage}% screening coverage suggests effective preventive safeguarding. The home's contextual safeguarding approach is helping keep children safe from community risks.`, severity: "positive" });
  }

  if (totalMitigations > 0 && mitigationEffectiveness < 50) {
    insights.push({ text: `Mitigation effectiveness is critically low at ${mitigationEffectiveness}%. More than half of the mitigations in place are not demonstrably working. Without effective mitigations, identified locality risks pose an active threat to children's safety. Ofsted will view this as a failure to manage known community risks under Reg 34.`, severity: "critical" });
  }

  if (risks.length > 0 && reviewCurrencyRate < 50) {
    insights.push({ text: `Review currency of ${reviewCurrencyRate}% means most locality risks have not been reviewed recently. Community threats evolve rapidly — county lines routes shift, gang territories change, and exploitation patterns adapt. A stale risk map provides false assurance and fails to meet the ongoing assessment requirement under Reg 34.`, severity: "critical" });
  }

  if (highRiskCount > 0 && screenings.length === 0) {
    insights.push({ text: `${highRiskCount} high-risk locality ${highRiskCount === 1 ? "threat" : "threats"} identified with no exploitation screenings completed. This is a critical safeguarding gap — children are living in an area with identified high risks but have not been individually assessed for vulnerability. Ofsted will view this as a fundamental failure in contextual safeguarding.`, severity: "critical" });
  }

  if (screenings.length > 0 && managementOversightRate < 50) {
    insights.push({ text: `Only ${managementOversightRate}% of exploitation screenings have management oversight. Without senior review, screening quality cannot be assured and escalation pathways may be missed. This weakens the governance framework under the SCCIF "Well-led and managed" judgement.`, severity: "warning" });
  }

  if (returnedMissing.length > 0 && returnInterviewRate < 50) {
    insights.push({ text: `Only ${returnInterviewRate}% return interview completion rate. Return interviews are a critical safeguarding tool — they help identify exploitation, understand push and pull factors, and inform safety planning. Without them, the home is missing vital intelligence about why children go missing and what risks they face in the community.`, severity: "critical" });
  }

  if (missing.length > 3) {
    insights.push({ text: `${missing.length} missing episodes in the last 180 days indicates a pattern that requires urgent review. Repeated missing episodes may indicate exploitation, placement instability, or unmet needs that are driving children away. Each episode should be analysed for patterns and triggers.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding locality safeguarding — ${mitigationEffectiveness}% mitigation effectiveness, ${reviewCurrencyRate}% review currency, ${screeningCoverage}% screening coverage.`;
  } else if (rating === "good") {
    headline = "Good locality safeguarding practice — solid risk mapping and screening with minor gaps in coverage or review currency.";
  } else if (rating === "adequate") {
    headline = "Adequate locality safeguarding — risk awareness and exploitation screening need improvement to fully protect children from community risks.";
  } else {
    headline = "Locality safeguarding is inadequate — significant gaps in risk mapping, exploitation screening, or mitigation effectiveness leave children exposed to community risks.";
  }

  return {
    locality_rating: rating,
    locality_score: score,
    headline,
    total_risks: totalRisks,
    mitigation_effectiveness: mitigationEffectiveness,
    review_currency_rate: reviewCurrencyRate,
    screening_coverage: screeningCoverage,
    high_risk_count: highRiskCount,
    safety_plan_rate: safetyPlanRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
