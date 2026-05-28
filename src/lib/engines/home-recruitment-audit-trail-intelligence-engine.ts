// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RECRUITMENT AUDIT TRAIL INTELLIGENCE ENGINE
// Home-level: aggregates recruitment audit trail entries, conditional offers,
// candidate profiles, and vacancies to assess quality and completeness of the
// home's recruitment audit trail — critical for Ofsted inspection of safer
// recruitment practices. CHR 2015 Reg 32. SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AuditEntryInput {
  id: string;
  candidate_id: string;
  vacancy_id: string;
  actor_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  has_before_state: boolean;
  has_after_state: boolean;
  has_notes: boolean;
  created_at: string;
}

export interface ConditionalOfferInput {
  id: string;
  candidate_id: string;
  status: string;
  has_conditions: boolean;
  conditions_count: number;
  exceptional_start: boolean;
  has_risk_mitigation: boolean;
  has_final_clearance: boolean;
  proposed_start_date: string;
  created_at: string;
}

export interface CandidateProfileInput {
  id: string;
  stage: string;
  compliance_status: string;
  has_dbs: boolean;
  has_references: boolean;
  references_count: number;
  checks_count: number;
  created_at: string;
}

export interface VacancyInput {
  id: string;
  status: string;
  candidates_count: number;
  created_at: string;
}

export interface RecruitmentAuditTrailInput {
  today: string;
  total_staff: number;
  audit_entries: AuditEntryInput[];
  offers: ConditionalOfferInput[];
  candidates: CandidateProfileInput[];
  vacancies: VacancyInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RecruitmentAuditRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RecruitmentAuditTrailResult {
  audit_rating: RecruitmentAuditRating;
  audit_score: number;
  headline: string;
  total_audit_entries: number;
  unique_candidates_audited: number;
  audit_completeness_rate: number;
  notes_coverage_rate: number;
  state_tracking_rate: number;
  offers_with_conditions_rate: number;
  exceptional_start_compliance: number;
  average_audit_depth: number;
  vacancy_fill_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[];
  insights: {
    text: string;
    severity: "critical" | "warning" | "positive";
  }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RecruitmentAuditRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result (insufficient data) ────────────────────────────────────────

function emptyResult(): RecruitmentAuditTrailResult {
  return {
    audit_rating: "insufficient_data",
    audit_score: 0,
    headline: "No recruitment audit trail data available — unable to assess safer recruitment practices.",
    total_audit_entries: 0,
    unique_candidates_audited: 0,
    audit_completeness_rate: 0,
    notes_coverage_rate: 0,
    state_tracking_rate: 0,
    offers_with_conditions_rate: 0,
    exceptional_start_compliance: 0,
    average_audit_depth: 0,
    vacancy_fill_rate: 0,
    strengths: [],
    concerns: [
      "No recruitment audit trail data found — Ofsted expects a comprehensive, auditable record of all safer recruitment activity.",
    ],
    recommendations: [
      {
        rank: 1,
        recommendation:
          "Implement a recruitment audit trail system that logs every stage change, check verification, reference receipt, and conditional offer with full before/after states and notes.",
        urgency: "immediate",
        regulatory_ref: "Reg 32",
      },
    ],
    insights: [
      {
        text: "No recruitment audit trail data exists. Without a verifiable audit trail, the home cannot evidence safer recruitment compliance during Ofsted inspection. This is a critical leadership gap.",
        severity: "critical",
      },
    ],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeRecruitmentAuditTrail(
  input: RecruitmentAuditTrailInput,
): RecruitmentAuditTrailResult {
  const { audit_entries, offers, candidates, vacancies } = input;

  // ── Special case: truly empty ──────────────────────────────────────
  if (
    audit_entries.length === 0 &&
    candidates.length === 0 &&
    offers.length === 0
  ) {
    return emptyResult();
  }

  // ── Special case: candidates exist but no audit entries ────────────
  if (audit_entries.length === 0 && candidates.length > 0) {
    return {
      audit_rating: "inadequate",
      audit_score: 15,
      headline:
        "Recruitment audit trail is missing — candidates exist but no audit entries have been recorded.",
      total_audit_entries: 0,
      unique_candidates_audited: 0,
      audit_completeness_rate: 0,
      notes_coverage_rate: 0,
      state_tracking_rate: 0,
      offers_with_conditions_rate: pct(
        offers.filter((o) => o.has_conditions).length,
        offers.length,
      ),
      exceptional_start_compliance: computeExceptionalStartCompliance(offers),
      average_audit_depth: 0,
      vacancy_fill_rate: pct(
        vacancies.filter((v) => v.status === "filled").length,
        vacancies.length,
      ),
      strengths: [],
      concerns: [
        "No audit trail entries exist despite active candidate records — this represents a fundamental gap in safer recruitment governance.",
        `${candidates.length} candidate(s) have no auditable recruitment history.`,
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately begin logging all recruitment activity including stage changes, check verifications, reference receipts, and offers with full before/after states and notes.",
          urgency: "immediate",
          regulatory_ref: "Reg 32",
        },
        {
          rank: 2,
          recommendation:
            "Retrospectively document the recruitment journey for all existing candidates to establish an audit trail.",
          urgency: "immediate",
          regulatory_ref: "Reg 32",
        },
      ],
      insights: [
        {
          text: "Candidates are progressing through recruitment without any auditable trail. Ofsted will view this as a serious safer recruitment failure — every stage change, check, and decision must be logged with timestamps and accountability.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Core Metrics ───────────────────────────────────────────────────

  const totalAuditEntries = audit_entries.length;

  // Unique candidates with at least one audit entry
  const candidateIds = new Set(audit_entries.map((e) => e.candidate_id));
  const uniqueCandidatesAudited = candidateIds.size;

  // Audit completeness: entries that have BOTH before/after state AND notes
  const completeEntries = audit_entries.filter(
    (e) => e.has_before_state && e.has_after_state && e.has_notes,
  );
  const auditCompletenessRate = pct(completeEntries.length, totalAuditEntries);

  // Notes coverage: entries with notes
  const entriesWithNotes = audit_entries.filter((e) => e.has_notes);
  const notesCoverageRate = pct(entriesWithNotes.length, totalAuditEntries);

  // State tracking: entries with BOTH before and after state
  const entriesWithState = audit_entries.filter(
    (e) => e.has_before_state && e.has_after_state,
  );
  const stateTrackingRate = pct(entriesWithState.length, totalAuditEntries);

  // Offers with conditions documented
  const offersWithConditions = offers.filter((o) => o.has_conditions);
  const offersWithConditionsRate = pct(
    offersWithConditions.length,
    offers.length,
  );

  // Exceptional start compliance
  const exceptionalStartCompliance =
    computeExceptionalStartCompliance(offers);

  // Average audit depth: avg entries per candidate (use all candidates, not just audited ones)
  const candidateCount = candidates.length > 0 ? candidates.length : uniqueCandidatesAudited;
  const averageAuditDepth =
    candidateCount > 0
      ? Math.round((totalAuditEntries / candidateCount) * 10) / 10
      : 0;

  // Vacancy fill rate
  const filledVacancies = vacancies.filter((v) => v.status === "filled");
  const vacancyFillRate = pct(filledVacancies.length, vacancies.length);

  // ── Scoring ────────────────────────────────────────────────────────

  let score = 52;

  // Bonus: notes coverage
  if (notesCoverageRate >= 90) score += 5;
  else if (notesCoverageRate >= 80) score += 3;

  // Bonus: state tracking
  if (stateTrackingRate >= 80) score += 5;
  else if (stateTrackingRate >= 60) score += 3;

  // Bonus: audit completeness
  if (auditCompletenessRate >= 90) score += 6;
  else if (auditCompletenessRate >= 70) score += 3;

  // Bonus: average audit depth
  if (averageAuditDepth >= 4) score += 4;
  else if (averageAuditDepth >= 2) score += 2;

  // Bonus: offers with conditions
  if (offers.length > 0) {
    if (offersWithConditionsRate >= 100) score += 4;
    else if (offersWithConditionsRate >= 80) score += 2;
  }

  // Bonus: exceptional start compliance (skip if no exceptional starts)
  const exceptionalStarts = offers.filter((o) => o.exceptional_start);
  if (exceptionalStarts.length > 0) {
    if (exceptionalStartCompliance >= 100) score += 4;
  }

  // Penalty: any candidate with 0 audit entries
  const allCandidateIds = new Set(candidates.map((c) => c.id));
  const candidatesWithZeroEntries = [...allCandidateIds].filter(
    (cid) => !candidateIds.has(cid),
  );
  if (candidatesWithZeroEntries.length > 0) {
    score -= 8;
  }

  // Penalty: notes coverage < 50%
  if (notesCoverageRate < 50) {
    score -= 5;
  }

  // Penalty: state tracking < 40%
  if (stateTrackingRate < 40) {
    score -= 5;
  }

  score = clamp(score, 0, 100);

  const auditRating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────

  const headline = buildHeadline(
    auditRating,
    score,
    totalAuditEntries,
    uniqueCandidatesAudited,
    auditCompletenessRate,
    notesCoverageRate,
  );

  // ── Strengths ──────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (notesCoverageRate >= 90) {
    strengths.push(
      `Excellent audit trail documentation — ${notesCoverageRate}% of entries include notes, demonstrating thorough record-keeping.`,
    );
  } else if (notesCoverageRate >= 80) {
    strengths.push(
      `Good notes coverage at ${notesCoverageRate}% — most recruitment decisions are documented with supporting notes.`,
    );
  }

  if (stateTrackingRate >= 80) {
    strengths.push(
      `Strong state tracking at ${stateTrackingRate}% — before/after states are recorded consistently, providing clear audit evidence.`,
    );
  } else if (stateTrackingRate >= 60) {
    strengths.push(
      `Reasonable state tracking at ${stateTrackingRate}% — the majority of entries capture before/after changes.`,
    );
  }

  if (auditCompletenessRate >= 90) {
    strengths.push(
      `Outstanding audit completeness at ${auditCompletenessRate}% — nearly all entries have full state tracking and notes.`,
    );
  } else if (auditCompletenessRate >= 70) {
    strengths.push(
      `Good audit completeness at ${auditCompletenessRate}% — most entries include both state changes and supporting notes.`,
    );
  }

  if (averageAuditDepth >= 4) {
    strengths.push(
      `Deep audit trail with an average of ${averageAuditDepth} entries per candidate, showing comprehensive journey documentation.`,
    );
  }

  if (offers.length > 0 && offersWithConditionsRate >= 100) {
    strengths.push(
      "All conditional offers have documented conditions — demonstrating robust conditional offer governance.",
    );
  } else if (offers.length > 0 && offersWithConditionsRate >= 80) {
    strengths.push(
      `${offersWithConditionsRate}% of conditional offers have documented conditions — good offer governance.`,
    );
  }

  if (exceptionalStarts.length > 0 && exceptionalStartCompliance >= 100) {
    strengths.push(
      "All exceptional starts have risk mitigation documented — compliant with safer recruitment requirements.",
    );
  }

  if (vacancyFillRate >= 80) {
    strengths.push(
      `Strong vacancy fill rate at ${vacancyFillRate}% — recruitment is effective at filling positions.`,
    );
  }

  if (candidatesWithZeroEntries.length === 0 && candidates.length > 0) {
    strengths.push(
      "Every candidate has at least one audit entry — no gaps in the recruitment audit trail.",
    );
  }

  // ── Concerns ───────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (candidatesWithZeroEntries.length > 0) {
    concerns.push(
      `${candidatesWithZeroEntries.length} candidate(s) have no audit trail entries — this is a significant safer recruitment gap.`,
    );
  }

  if (notesCoverageRate < 50) {
    concerns.push(
      `Notes coverage is critically low at ${notesCoverageRate}% — most recruitment decisions lack supporting documentation.`,
    );
  } else if (notesCoverageRate < 80) {
    concerns.push(
      `Notes coverage at ${notesCoverageRate}% is below expected standards — recruitment decisions should be documented with notes.`,
    );
  }

  if (stateTrackingRate < 40) {
    concerns.push(
      `State tracking is critically low at ${stateTrackingRate}% — before/after changes are not being captured for most recruitment events.`,
    );
  } else if (stateTrackingRate < 60) {
    concerns.push(
      `State tracking at ${stateTrackingRate}% needs improvement — a higher proportion of entries should capture before/after states.`,
    );
  }

  if (auditCompletenessRate < 50) {
    concerns.push(
      `Only ${auditCompletenessRate}% of audit entries are fully complete (notes + state tracking) — the audit trail lacks depth.`,
    );
  }

  if (offers.length > 0 && offersWithConditionsRate < 80) {
    concerns.push(
      `Only ${offersWithConditionsRate}% of conditional offers have conditions documented — offer governance needs strengthening.`,
    );
  }

  if (
    exceptionalStarts.length > 0 &&
    exceptionalStartCompliance < 100
  ) {
    concerns.push(
      `Not all exceptional starts have risk mitigation documented — ${100 - exceptionalStartCompliance}% lack required safeguards.`,
    );
  }

  if (averageAuditDepth < 2 && candidates.length > 0) {
    concerns.push(
      `Average audit depth of ${averageAuditDepth} entries per candidate is very low — recruitment journeys are not being comprehensively logged.`,
    );
  }

  // ── Recommendations ────────────────────────────────────────────────

  const recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[] = [];
  let rank = 0;

  if (candidatesWithZeroEntries.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Urgently create audit trail entries for the ${candidatesWithZeroEntries.length} candidate(s) with no recorded recruitment activity.`,
      urgency: "immediate",
      regulatory_ref: "Reg 32",
    });
  }

  if (notesCoverageRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Mandate that all recruitment events include notes explaining the decision or action taken.",
      urgency: "immediate",
      regulatory_ref: "Reg 32",
    });
  } else if (notesCoverageRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve notes coverage by requiring notes for all recruitment stage changes, check verifications, and offer decisions.",
      urgency: "soon",
      regulatory_ref: "Reg 32",
    });
  }

  if (stateTrackingRate < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the system captures before/after states for every recruitment event to provide a clear change history.",
      urgency: "immediate",
      regulatory_ref: "Reg 32",
    });
  } else if (stateTrackingRate < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase state tracking coverage by ensuring before/after snapshots are recorded for all stage transitions and status changes.",
      urgency: "soon",
    });
  }

  if (
    exceptionalStarts.length > 0 &&
    exceptionalStartCompliance < 100
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document risk mitigation for all exceptional starts — this is a regulatory requirement before any candidate begins work without full clearance.",
      urgency: "immediate",
      regulatory_ref: "Reg 32",
    });
  }

  if (offers.length > 0 && offersWithConditionsRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all conditional offers have their conditions clearly documented in the audit trail.",
      urgency: "soon",
      regulatory_ref: "Reg 32",
    });
  }

  if (auditCompletenessRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve overall audit completeness by combining state tracking with notes for every recruitment event.",
      urgency: "soon",
    });
  }

  if (averageAuditDepth < 2 && candidates.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the depth of the audit trail by logging more granular events throughout the candidate journey — aim for at least 4 entries per candidate.",
      urgency: "planned",
    });
  }

  if (vacancyFillRate < 50 && vacancies.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review vacancy management processes — a low fill rate may indicate recruitment challenges that need addressing.",
      urgency: "planned",
    });
  }

  // ── Insights ───────────────────────────────────────────────────────

  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  if (candidatesWithZeroEntries.length > 0) {
    insights.push({
      text: `${candidatesWithZeroEntries.length} candidate(s) have no audit trail entries. Ofsted expects every recruitment decision to be fully auditable. Candidates without audit entries represent a serious safer recruitment risk.`,
      severity: "critical",
    });
  }

  if (notesCoverageRate < 50) {
    insights.push({
      text: `Only ${notesCoverageRate}% of audit entries include notes. Without contemporaneous notes, the home cannot demonstrate the rationale behind recruitment decisions during inspection.`,
      severity: "critical",
    });
  } else if (notesCoverageRate < 80) {
    insights.push({
      text: `Notes coverage at ${notesCoverageRate}% means some recruitment decisions lack documented rationale. Improving this will strengthen the audit trail for inspection.`,
      severity: "warning",
    });
  } else if (notesCoverageRate >= 90) {
    insights.push({
      text: `${notesCoverageRate}% notes coverage demonstrates a disciplined approach to documenting recruitment decisions — this will stand up well to Ofsted scrutiny.`,
      severity: "positive",
    });
  }

  if (stateTrackingRate < 40) {
    insights.push({
      text: `State tracking at ${stateTrackingRate}% is critically low. Without before/after states, the audit trail cannot evidence what changed and when — a key Ofsted expectation.`,
      severity: "critical",
    });
  } else if (stateTrackingRate < 60) {
    insights.push({
      text: `State tracking at ${stateTrackingRate}% needs improvement. Capturing before/after states for all events creates an unambiguous record of the recruitment journey.`,
      severity: "warning",
    });
  } else if (stateTrackingRate >= 80) {
    insights.push({
      text: `${stateTrackingRate}% state tracking rate provides a strong evidence base showing exactly what changed at each step of the recruitment process.`,
      severity: "positive",
    });
  }

  if (
    exceptionalStarts.length > 0 &&
    exceptionalStartCompliance < 100
  ) {
    const nonCompliantCount = exceptionalStarts.filter(
      (o) => !o.has_risk_mitigation,
    ).length;
    insights.push({
      text: `${nonCompliantCount} exceptional start(s) lack risk mitigation documentation. Ofsted will expect evidence that risks were assessed and mitigated before allowing any candidate to start before full clearance.`,
      severity: "critical",
    });
  } else if (
    exceptionalStarts.length > 0 &&
    exceptionalStartCompliance >= 100
  ) {
    insights.push({
      text: `All ${exceptionalStarts.length} exceptional start(s) have risk mitigation properly documented, demonstrating compliant management of early starts.`,
      severity: "positive",
    });
  }

  if (auditCompletenessRate >= 90) {
    insights.push({
      text: `${auditCompletenessRate}% audit completeness shows the home maintains a thorough, inspection-ready recruitment audit trail.`,
      severity: "positive",
    });
  } else if (auditCompletenessRate < 50) {
    insights.push({
      text: `Only ${auditCompletenessRate}% of audit entries are fully complete. Most entries lack either notes or state tracking, weakening the overall audit trail.`,
      severity: "warning",
    });
  }

  if (averageAuditDepth >= 4) {
    insights.push({
      text: `An average of ${averageAuditDepth} audit entries per candidate indicates comprehensive logging of the recruitment journey from application to appointment.`,
      severity: "positive",
    });
  } else if (averageAuditDepth < 2 && candidates.length > 0) {
    insights.push({
      text: `With only ${averageAuditDepth} entries per candidate on average, the audit trail is shallow. Aim for at least 4 entries per candidate to evidence a thorough recruitment process.`,
      severity: "warning",
    });
  }

  return {
    audit_rating: auditRating,
    audit_score: score,
    headline,
    total_audit_entries: totalAuditEntries,
    unique_candidates_audited: uniqueCandidatesAudited,
    audit_completeness_rate: auditCompletenessRate,
    notes_coverage_rate: notesCoverageRate,
    state_tracking_rate: stateTrackingRate,
    offers_with_conditions_rate: offersWithConditionsRate,
    exceptional_start_compliance: exceptionalStartCompliance,
    average_audit_depth: averageAuditDepth,
    vacancy_fill_rate: vacancyFillRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

// ── Internal helpers ────────────────────────────────────────────────────────

function computeExceptionalStartCompliance(
  offers: ConditionalOfferInput[],
): number {
  const exceptional = offers.filter((o) => o.exceptional_start);
  if (exceptional.length === 0) return 0;
  const compliant = exceptional.filter((o) => o.has_risk_mitigation);
  return pct(compliant.length, exceptional.length);
}

function buildHeadline(
  rating: RecruitmentAuditRating,
  score: number,
  totalEntries: number,
  uniqueCandidates: number,
  completenessRate: number,
  notesCoverage: number,
): string {
  switch (rating) {
    case "outstanding":
      return `Outstanding recruitment audit trail — ${totalEntries} entries across ${uniqueCandidates} candidate(s) with ${completenessRate}% completeness and ${notesCoverage}% notes coverage.`;
    case "good":
      return `Good recruitment audit trail — ${totalEntries} entries across ${uniqueCandidates} candidate(s) demonstrate solid safer recruitment record-keeping.`;
    case "adequate":
      return `Adequate recruitment audit trail — ${totalEntries} entries recorded but completeness at ${completenessRate}% and notes coverage at ${notesCoverage}% need improvement.`;
    case "inadequate":
      return `Inadequate recruitment audit trail — significant gaps in documentation undermine safer recruitment assurance.`;
    default:
      return "No recruitment audit trail data available — unable to assess safer recruitment practices.";
  }
}
