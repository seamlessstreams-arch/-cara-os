import { below, formatRate, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF DISCIPLINARY & CONDUCT INTELLIGENCE ENGINE
// Home-level: analyses disciplinary cases, investigation quality, LADO
// compliance, suspension management, and learning to surface intelligence
// for registered managers.
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers).
// LADO procedures (Working Together 2023). SCCIF: "Well-led and managed", "Safe".
// DBS referral duty.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffDisciplinaryRecordInput {
  id: string;
  staff_id: string;
  date_raised: string;
  category: string; // "misconduct"|"gross_misconduct"|"capability"|"attendance"
  severity: string; // "minor"|"serious"|"gross"
  stage: string; // "investigation"|"hearing"|"appeal"|"resolved"|"no_case"
  has_allegation_detail: boolean;
  has_investigator: boolean;
  investigation_started: boolean;
  investigation_completed: boolean;
  investigation_duration_days: number; // 0 if not completed
  suspended: boolean;
  suspension_reviewed: boolean; // suspension_review_dates.length > 0
  has_hearing: boolean;
  outcome_recorded: boolean;
  lado_referral_made: boolean;
  lado_referral_timely: boolean; // within 1 day of date_raised for serious/gross
  dbs_update_required: boolean;
  has_support_plan: boolean;
  has_lessons_learned: boolean;
  policy_reviewed: boolean;
}

export interface StaffDisciplinaryInput {
  today: string;
  total_staff: number;
  cases: StaffDisciplinaryRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffDisciplinaryRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DisciplinaryInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DisciplinaryRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffDisciplinaryConductResult {
  disciplinary_rating: StaffDisciplinaryRating;
  disciplinary_score: number | null;
  headline: string;
  total_cases: number;
  open_cases: number;
  resolved_cases: number;
  gross_misconduct_count: number;
  serious_misconduct_count: number;
  suspended_count: number;
  lado_referral_rate: number | null;
  investigation_completion_rate: number | null;
  average_investigation_days: number | null;
  outcome_recording_rate: number | null;
  lessons_learned_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: DisciplinaryRecommendation[];
  insights: DisciplinaryInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffDisciplinaryRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffDisciplinaryConductIntelligence(
  input: StaffDisciplinaryInput,
): StaffDisciplinaryConductResult {
  const { today, total_staff, cases } = input;

  // ── Insufficient data ──────────────────────────────────────────────
  if (total_staff === 0) {
    return {
      disciplinary_rating: "insufficient_data",
      disciplinary_score: 0,
      headline: "No staff data available — unable to assess disciplinary and conduct management.",
      total_cases: 0,
      open_cases: 0,
      resolved_cases: 0,
      gross_misconduct_count: 0,
      serious_misconduct_count: 0,
      suspended_count: 0,
      lado_referral_rate: null,
      investigation_completion_rate: null,
      average_investigation_days: 0,
      outcome_recording_rate: null,
      lessons_learned_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Special case: no cases with staff present ──────────────────────
  if (cases.length === 0) {
    return {
      disciplinary_rating: "outstanding",
      disciplinary_score: 88,
      headline: "No disciplinary cases recorded — strong staff conduct and professional standards.",
      total_cases: 0,
      open_cases: 0,
      resolved_cases: 0,
      gross_misconduct_count: 0,
      serious_misconduct_count: 0,
      suspended_count: 0,
      lado_referral_rate: null,
      investigation_completion_rate: null,
      average_investigation_days: 0,
      outcome_recording_rate: null,
      lessons_learned_rate: null,
      strengths: [
        "No disciplinary cases on record — indicates strong staff conduct and professional culture.",
      ],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "Zero disciplinary cases with an active workforce suggests effective recruitment, induction, and ongoing staff management.",
          severity: "positive",
        },
      ],
    };
  }

  // ── Special case: all cases older than 365 days ────────────────────
  const allOld = cases.every(
    (c) => daysBetween(c.date_raised, today) > 365,
  );

  if (allOld) {
    return {
      disciplinary_rating: "good",
      disciplinary_score: 75,
      headline: "All disciplinary cases are historical (>12 months) — no recent conduct concerns.",
      total_cases: cases.length,
      open_cases: cases.filter(
        (c) => c.stage !== "resolved" && c.stage !== "no_case",
      ).length,
      resolved_cases: cases.filter(
        (c) => c.stage === "resolved" || c.stage === "no_case",
      ).length,
      gross_misconduct_count: cases.filter(
        (c) => c.severity === "gross",
      ).length,
      serious_misconduct_count: cases.filter(
        (c) => c.severity === "serious",
      ).length,
      suspended_count: cases.filter((c) => c.suspended).length,
      lado_referral_rate: rate(
        cases.filter(
          (c) =>
            (c.severity === "serious" || c.severity === "gross") &&
            c.lado_referral_made,
        ).length,
        cases.filter(
          (c) => c.severity === "serious" || c.severity === "gross",
        ).length,
      ),
      investigation_completion_rate: rate(
        cases.filter((c) => c.investigation_completed).length,
        cases.length,
      ),
      average_investigation_days: (() => {
        const completed = cases.filter(
          (c) => c.investigation_completed && c.investigation_duration_days > 0,
        );
        return completed.length > 0
          ? Math.round(
              completed.reduce(
                (sum, c) => sum + c.investigation_duration_days,
                0,
              ) / completed.length,
            )
          : null;
      })(),
      outcome_recording_rate: rate(
        cases.filter(
          (c) =>
            (c.stage === "resolved" || c.stage === "no_case") &&
            c.outcome_recorded,
        ).length,
        cases.filter(
          (c) => c.stage === "resolved" || c.stage === "no_case",
        ).length,
      ),
      lessons_learned_rate: rate(
        cases.filter((c) => c.has_lessons_learned).length,
        cases.length,
      ),
      strengths: [
        "No recent disciplinary activity — all cases are historical, suggesting improved staff conduct.",
      ],
      concerns: [],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Continue monitoring staff conduct and ensure lessons from historical cases remain embedded in practice.",
          urgency: "planned",
          regulatory_ref: "CHR 2015 Reg 33",
        },
      ],
      insights: [
        {
          text: "All disciplinary cases are over 12 months old — the home has maintained a clean conduct record in the recent period.",
          severity: "positive",
        },
      ],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────
  const totalCases = cases.length;

  const openCases = cases.filter(
    (c) => c.stage !== "resolved" && c.stage !== "no_case",
  );
  const resolvedCases = cases.filter(
    (c) => c.stage === "resolved" || c.stage === "no_case",
  );

  const grossMisconductCount = cases.filter(
    (c) => c.severity === "gross",
  ).length;
  const seriousMisconductCount = cases.filter(
    (c) => c.severity === "serious",
  ).length;
  const suspendedCount = cases.filter((c) => c.suspended).length;

  const seriousOrGross = cases.filter(
    (c) => c.severity === "serious" || c.severity === "gross",
  );
  const ladoReferralsMade = seriousOrGross.filter(
    (c) => c.lado_referral_made,
  ).length;
  const ladoReferralRate = rate(ladoReferralsMade, seriousOrGross.length);

  const investigationCompletionRate = rate(
    cases.filter((c) => c.investigation_completed).length,
    totalCases,
  );

  const completedInvestigations = cases.filter(
    (c) => c.investigation_completed && c.investigation_duration_days > 0,
  );
  const averageInvestigationDays =
    completedInvestigations.length > 0
      ? Math.round(
          completedInvestigations.reduce(
            (sum, c) => sum + c.investigation_duration_days,
            0,
          ) / completedInvestigations.length,
        )
      : null;

  const outcomeRecordingRate = rate(
    resolvedCases.filter((c) => c.outcome_recorded).length,
    resolvedCases.length,
  );

  const lessonsLearnedRate = rate(
    cases.filter((c) => c.has_lessons_learned).length,
    totalCases,
  );

  // ── Scoring ───────────────────────────────────────────────────────
  let score = 52;

  // 1. Investigation quality (has_allegation_detail AND has_investigator AND investigation_started)
  const investigationQualityCount = cases.filter(
    (c) =>
      c.has_allegation_detail && c.has_investigator && c.investigation_started,
  ).length;
  const investigationQualityRate = rate(investigationQualityCount, totalCases);

  if (meets(investigationQualityRate, 98)) score += 6;
  else if (meets(investigationQualityRate, 85)) score += 3;
  else if (below(investigationQualityRate, 50)) score -= 3;
  else if (below(investigationQualityRate, 70)) score -= 5;

  // 2. Timeliness (investigation_duration_days <= 30 for completed cases)
  const completedCases = cases.filter((c) => c.investigation_completed);
  if (completedCases.length === 0) {
    score -= 1;
  } else {
    const timelyCount = completedCases.filter(
      (c) => c.investigation_duration_days <= 30,
    ).length;
    const timelyRate = rate(timelyCount, completedCases.length);
    if (meets(timelyRate, 90)) score += 5;
    else if (meets(timelyRate, 70)) score += 2;
    else if (below(timelyRate, 50)) score -= 5;
  }

  // 3. LADO compliance (lado_referral_made for all serious/gross severity cases)
  if (seriousOrGross.length === 0) {
    score += 1;
  } else {
    const ladoCompliance = rate(ladoReferralsMade, seriousOrGross.length);
    if (ladoCompliance === 100) score += 5;
    else if (meets(ladoCompliance, 80)) score += 2;
    else if (below(ladoCompliance, 60)) score -= 4;
  }

  // 4. Suspension management (suspension_reviewed for all suspended cases)
  const suspendedCases = cases.filter((c) => c.suspended);
  if (suspendedCases.length === 0) {
    score += 1;
  } else {
    const reviewedCount = suspendedCases.filter(
      (c) => c.suspension_reviewed,
    ).length;
    const suspensionReviewRate = rate(reviewedCount, suspendedCases.length);
    if (suspensionReviewRate === 100) score += 5;
    else if (meets(suspensionReviewRate, 80)) score += 2;
    else if (below(suspensionReviewRate, 50)) score -= 4;
  }

  // 5. Outcome & resolution (outcome_recorded for completed/resolved stages)
  if (resolvedCases.length === 0) {
    score -= 1;
  } else {
    const outcomeCount = resolvedCases.filter(
      (c) => c.outcome_recorded,
    ).length;
    const outcomeRate = rate(outcomeCount, resolvedCases.length);
    if (meets(outcomeRate, 95)) score += 4;
    else if (meets(outcomeRate, 80)) score += 2;
    else if (below(outcomeRate, 60)) score -= 4;
  }

  // 6. Learning & improvement (has_lessons_learned AND policy_reviewed)
  const learningCount = cases.filter(
    (c) => c.has_lessons_learned && c.policy_reviewed,
  ).length;
  const learningRate = rate(learningCount, totalCases);
  if (meets(learningRate, 80)) score += 5;
  else if (meets(learningRate, 60)) score += 2;
  else if (below(learningRate, 40)) score -= 3;

  // ── Additional penalties ──────────────────────────────────────────

  // Unresolved cases >60 days old: -2 per case (max -6)
  let unresolvedPenalty = 0;
  for (const c of openCases) {
    const age = daysBetween(c.date_raised, today);
    if (age > 60) {
      unresolvedPenalty += 2;
    }
  }
  unresolvedPenalty = Math.min(unresolvedPenalty, 6);
  score -= unresolvedPenalty;

  // Gross misconduct without LADO referral: -5 per instance
  const grossNoLado = cases.filter(
    (c) => c.severity === "gross" && !c.lado_referral_made,
  );
  score -= grossNoLado.length * 5;

  // Suspended staff without review >14 days: -3 penalty
  const suspendedNoReview = cases.filter(
    (c) => c.suspended && !c.suspension_reviewed,
  );
  const suspendedNoReviewOld = suspendedNoReview.filter(
    (c) => daysBetween(c.date_raised, today) > 14,
  );
  if (suspendedNoReviewOld.length > 0) {
    score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(investigationQualityRate, 98)) {
    strengths.push(
      `Investigation quality at ${investigationQualityRate}% — all cases have detailed allegations, assigned investigators, and timely starts.`,
    );
  }

  if (completedCases.length > 0) {
    const timelyCount = completedCases.filter(
      (c) => c.investigation_duration_days <= 30,
    ).length;
    const timelyRate = rate(timelyCount, completedCases.length);
    if (meets(timelyRate, 90)) {
      strengths.push(
        `${timelyRate}% of investigations completed within 30 days — timely case management.`,
      );
    }
  }

  if (seriousOrGross.length > 0 && ladoReferralRate === 100) {
    strengths.push(
      "100% LADO referral compliance for serious and gross misconduct cases — strong safeguarding practice.",
    );
  }

  if (suspendedCases.length > 0) {
    const reviewedCount = suspendedCases.filter(
      (c) => c.suspension_reviewed,
    ).length;
    if (rate(reviewedCount, suspendedCases.length) === 100) {
      strengths.push(
        "All suspended staff have had suspension reviews — robust suspension management.",
      );
    }
  }

  if (resolvedCases.length > 0 && meets(outcomeRecordingRate, 95)) {
    strengths.push(
      `${outcomeRecordingRate}% of resolved cases have outcomes recorded — thorough case closure.`,
    );
  }

  if (meets(learningRate, 80)) {
    strengths.push(
      `${learningRate}% of cases have lessons learned and policy review completed — embedded reflective practice.`,
    );
  }

  if (seriousOrGross.length === 0 && suspendedCases.length === 0) {
    strengths.push(
      "No serious or gross misconduct cases and no suspensions — well-managed conduct environment.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (below(investigationQualityRate, 70)) {
    concerns.push(
      `Investigation quality at ${investigationQualityRate}% — cases lack proper allegation details, investigators, or timely starts.`,
    );
  }

  if (completedCases.length > 0) {
    const timelyCount = completedCases.filter(
      (c) => c.investigation_duration_days <= 30,
    ).length;
    const timelyRate = rate(timelyCount, completedCases.length);
    if (below(timelyRate, 50)) {
      concerns.push(
        `Only ${timelyRate}% of investigations completed within 30 days — significant delays in case progression.`,
      );
    }
  }

  if (seriousOrGross.length > 0 && below(ladoReferralRate, 60)) {
    concerns.push(
      `LADO referral rate at ${ladoReferralRate}% for serious/gross cases — below 60% compliance threshold.`,
    );
  }

  for (const c of grossNoLado) {
    concerns.push(
      `Gross misconduct case ${c.id} has no LADO referral — mandatory regulatory requirement under Working Together 2023.`,
    );
  }

  for (const c of openCases) {
    const age = daysBetween(c.date_raised, today);
    if (age > 60) {
      concerns.push(
        `Case ${c.id} has been unresolved for ${age} days — exceeds 60-day resolution target.`,
      );
    }
  }

  if (suspendedCases.length > 0) {
    const reviewedCount = suspendedCases.filter(
      (c) => c.suspension_reviewed,
    ).length;
    const suspReviewRate = rate(reviewedCount, suspendedCases.length);
    if (below(suspReviewRate, 50)) {
      concerns.push(
        `Only ${suspReviewRate}% of suspended staff have had suspension reviews — duty of care risk.`,
      );
    }
  }

  if (suspendedNoReviewOld.length > 0) {
    concerns.push(
      `${suspendedNoReviewOld.length} suspended staff member(s) without review for over 14 days — immediate action required.`,
    );
  }

  if (resolvedCases.length > 0 && below(outcomeRecordingRate, 60)) {
    concerns.push(
      `Only ${outcomeRecordingRate}% of resolved cases have outcomes recorded — poor case closure practice.`,
    );
  }

  if (below(learningRate, 40)) {
    concerns.push(
      `Only ${learningRate}% of cases have lessons learned and policy review — the home is not learning from disciplinary matters.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────
  const recs: DisciplinaryRecommendation[] = [];
  let rank = 1;

  if (grossNoLado.length > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation: `Complete LADO referral for ${grossNoLado.length} gross misconduct case(s) — mandatory requirement under Working Together 2023.`,
      urgency: "immediate",
      regulatory_ref: "LADO (Working Together 2023)",
    });
  }

  if (suspendedNoReviewOld.length > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation: `Review suspension arrangements for ${suspendedNoReviewOld.length} staff member(s) without review >14 days — duty of care and fairness require regular review.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34",
    });
  }

  const longOpenCases = openCases.filter(
    (c) => daysBetween(c.date_raised, today) > 60,
  );
  if (longOpenCases.length > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation: `Progress ${longOpenCases.length} unresolved case(s) exceeding 60 days — set clear timelines for resolution.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (below(investigationQualityRate, 70) && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Improve investigation quality — ensure all cases have detailed allegations, assigned investigators, and timely investigation starts.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (seriousOrGross.length > 0 && below(ladoReferralRate, 80) && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Review LADO referral procedures — all serious and gross misconduct cases must be referred promptly.",
      urgency: "immediate",
      regulatory_ref: "LADO (Working Together 2023)",
    });
  }

  if (below(learningRate, 40) && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Embed lessons learned and policy review into every disciplinary case closure — ensure organisational learning from conduct matters.",
      urgency: "soon",
      regulatory_ref: "SCCIF: Well-led and managed",
    });
  }

  if (resolvedCases.length > 0 && below(outcomeRecordingRate, 60) && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Record clear outcomes for all resolved disciplinary cases — essential for audit trail and regulatory compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  const finalRecs = recs.slice(0, 5);

  // ── Insights ──────────────────────────────────────────────────────
  const insights: DisciplinaryInsight[] = [];

  if (grossMisconductCount > 0) {
    insights.push({
      text: `${grossMisconductCount} gross misconduct case(s) on record — Ofsted will scrutinise investigation thoroughness, LADO compliance, and DBS referral duty.`,
      severity: "critical",
    });
  }

  if (grossNoLado.length > 0) {
    insights.push({
      text: `${grossNoLado.length} gross misconduct case(s) without LADO referral — this is a significant regulatory failure that Ofsted will view as a safeguarding concern.`,
      severity: "critical",
    });
  }

  if (suspendedNoReviewOld.length > 0) {
    insights.push({
      text: `${suspendedNoReviewOld.length} suspended staff without review for over 14 days — prolonged suspension without review is a duty of care concern.`,
      severity: "critical",
    });
  }

  if (
    meets(investigationQualityRate, 98) &&
    completedCases.length > 0 &&
    meets(learningRate, 80)
  ) {
    insights.push({
      text: `Investigation quality at ${investigationQualityRate}% with ${learningRate}% learning and policy review — the home demonstrates robust disciplinary governance and reflective practice.`,
      severity: "positive",
    });
  }

  if (longOpenCases.length > 0) {
    insights.push({
      text: `${longOpenCases.length} case(s) unresolved beyond 60 days — prolonged investigations can undermine staff morale and regulatory confidence.`,
      severity: "warning",
    });
  }

  if (
    seriousOrGross.length > 0 &&
    ladoReferralRate === 100 &&
    resolvedCases.length > 0 &&
    meets(outcomeRecordingRate, 95)
  ) {
    insights.push({
      text: `100% LADO compliance with ${outcomeRecordingRate}% outcome recording — disciplinary processes are thorough and well-documented.`,
      severity: "positive",
    });
  }

  if (openCases.length === 0 && resolvedCases.length > 0 && meets(learningRate, 80)) {
    insights.push({
      text: "All cases resolved with strong lessons-learned culture — demonstrates effective case management and organisational learning.",
      severity: "positive",
    });
  }

  const finalInsights = insights.slice(0, 3);

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding disciplinary and conduct management — ${formatRate(investigationQualityRate)} investigation quality with robust LADO compliance.`;
  } else if (rating === "good") {
    headline =
      "Good disciplinary and conduct management — minor gaps in timeliness, learning, or compliance to address.";
  } else if (rating === "adequate") {
    headline =
      "Adequate disciplinary management — investigation quality, LADO compliance, or case resolution need strengthening.";
  } else {
    headline =
      "Inadequate — serious gaps in disciplinary process, investigation quality, or safeguarding compliance.";
  }

  return {
    disciplinary_rating: rating,
    disciplinary_score: score,
    headline,
    total_cases: totalCases,
    open_cases: openCases.length,
    resolved_cases: resolvedCases.length,
    gross_misconduct_count: grossMisconductCount,
    serious_misconduct_count: seriousMisconductCount,
    suspended_count: suspendedCount,
    lado_referral_rate: ladoReferralRate,
    investigation_completion_rate: investigationCompletionRate,
    average_investigation_days: averageInvestigationDays,
    outcome_recording_rate: outcomeRecordingRate,
    lessons_learned_rate: lessonsLearnedRate,
    strengths,
    concerns,
    recommendations: finalRecs,
    insights: finalInsights,
  };
}
