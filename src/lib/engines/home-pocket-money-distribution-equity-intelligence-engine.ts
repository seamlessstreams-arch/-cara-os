// ==============================================================================
// CARA -- HOME POCKET MONEY DISTRIBUTION EQUITY INTELLIGENCE ENGINE
// Measures equitable distribution of pocket money across children, age-appropriate
// amounts, timely payments, child understanding of allowances, and transparency
// in pocket money management.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging, positive relationships), Reg 7 (Child's plan),
// SCCIF "Experiences and progress of children".
// Store keys: pocketMoneyDistributionRecords, ageAppropriatenessRecords,
//             paymentTimelinessRecords, childUnderstandingRecords,
//             transparencyRecords
// ==============================================================================

import { meets, below } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface DistributionRecordInput {
  id: string;
  child_id: string;
  child_name: string;
  child_age: number;
  period: string; // e.g. "2026-W21", "2026-05"
  amount_due: number;
  amount_paid: number;
  currency: string;
  payment_date: string | null;
  due_date: string;
  payment_method: "cash" | "bank_transfer" | "savings_account" | "card" | "other";
  reason_for_difference: string;
  approved_by: string;
  child_signed: boolean;
  staff_signed: boolean;
  notes: string;
  created_at: string;
}

export interface AgeAppropriatenessRecordInput {
  id: string;
  child_id: string;
  child_age: number;
  weekly_amount: number;
  local_authority_guidance_amount: number;
  age_band: "under_5" | "5_to_7" | "8_to_10" | "11_to_13" | "14_to_15" | "16_plus";
  amount_meets_guidance: boolean;
  amount_reviewed: boolean;
  last_review_date: string | null;
  review_included_child: boolean;
  adjustment_made: boolean;
  adjustment_reason: string;
  child_satisfied_with_amount: boolean;
  created_at: string;
}

export interface PaymentTimelinessRecordInput {
  id: string;
  child_id: string;
  period: string;
  due_date: string;
  actual_payment_date: string | null;
  days_late: number;
  reason_for_delay: string;
  child_informed_of_delay: boolean;
  compensatory_action_taken: boolean;
  payment_made: boolean;
  created_at: string;
}

export interface ChildUnderstandingRecordInput {
  id: string;
  child_id: string;
  child_age: number;
  understands_amount: boolean;
  understands_frequency: boolean;
  understands_savings_option: boolean;
  understands_how_to_request_extra: boolean;
  discussion_date: string;
  discussed_with: string; // keyworker name
  age_appropriate_explanation: boolean;
  child_has_questions: boolean;
  questions_addressed: boolean;
  child_feels_fairly_treated: boolean;
  child_knows_complaint_process: boolean;
  notes: string;
  created_at: string;
}

export interface TransparencyRecordInput {
  id: string;
  child_id: string;
  record_type: "ledger_entry" | "receipt" | "audit" | "child_review" | "statement" | "other";
  date: string;
  record_accessible_to_child: boolean;
  record_explained_to_child: boolean;
  discrepancy_found: boolean;
  discrepancy_resolved: boolean;
  discrepancy_details: string;
  independent_audit_completed: boolean;
  audit_passed: boolean;
  child_can_view_balance: boolean;
  staff_member: string;
  created_at: string;
}

export interface PocketMoneyDistributionEquityInput {
  today: string;
  total_children: number;
  distribution_records: DistributionRecordInput[];
  age_appropriateness_records: AgeAppropriatenessRecordInput[];
  payment_timeliness_records: PaymentTimelinessRecordInput[];
  child_understanding_records: ChildUnderstandingRecordInput[];
  transparency_records: TransparencyRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type PocketMoneyEquityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PocketMoneyEquityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PocketMoneyEquityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PocketMoneyDistributionEquityResult {
  equity_rating: PocketMoneyEquityRating;
  equity_score: number;
  headline: string;
  equitable_distribution_rate: number;
  age_appropriate_rate: number;
  timely_payment_rate: number;
  // fab-0: null when no records / no satisfaction components.
  child_understanding_rate: number | null;
  transparency_rate: number | null;
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: PocketMoneyEquityRecommendation[];
  insights: PocketMoneyEquityInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PocketMoneyEquityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: PocketMoneyEquityRating,
  score: number,
  headline: string,
): PocketMoneyDistributionEquityResult {
  return {
    equity_rating: rating,
    equity_score: score,
    headline,
    equitable_distribution_rate: 0,
    age_appropriate_rate: 0,
    timely_payment_rate: 0,
    child_understanding_rate: null,
    transparency_rate: null,
    child_satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computePocketMoneyDistributionEquity(
  input: PocketMoneyDistributionEquityInput,
): PocketMoneyDistributionEquityResult {
  const {
    total_children,
    distribution_records,
    age_appropriateness_records,
    payment_timeliness_records,
    child_understanding_records,
    transparency_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    distribution_records.length === 0 &&
    age_appropriateness_records.length === 0 &&
    payment_timeliness_records.length === 0 &&
    child_understanding_records.length === 0 &&
    transparency_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess pocket money distribution equity.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No pocket money distribution data recorded despite children on placement -- equitable distribution, age-appropriate amounts, timely payments, child understanding, and transparency require urgent attention.",
      ),
      concerns: [
        "No pocket money distribution, age-appropriateness, payment timeliness, child understanding, or transparency records exist despite children being on placement -- the home cannot evidence fair and equitable pocket money management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of pocket money distribution, age-appropriate amount setting, payment timeliness, child understanding discussions, and transparency audits to evidence equitable pocket money management for all children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
        },
        {
          rank: 2,
          recommendation:
            "Establish a pocket money policy that ensures equitable distribution based on age-appropriate guidance, with clear payment schedules, child involvement in amount reviews, and transparent record-keeping accessible to children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of pocket money distribution records means Ofsted cannot verify that children receive their financial entitlements equitably. This represents a fundamental gap in Reg 5 compliance and the home's duty to prepare children for independence through responsible financial management.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Equitable distribution ---
  const totalDistRecords = distribution_records.length;
  const equitablyPaid = distribution_records.filter(
    (r) => r.amount_paid >= r.amount_due,
  ).length;
  const equitableDistributionRate = pct(equitablyPaid, totalDistRecords);

  const uniqueChildrenWithDist = new Set(
    distribution_records.map((r) => r.child_id),
  ).size;

  const childDistCoverage = pct(uniqueChildrenWithDist, total_children);

  const childSigned = distribution_records.filter((r) => r.child_signed).length;
  const childSignedRate = pct(childSigned, totalDistRecords);

  const staffSigned = distribution_records.filter((r) => r.staff_signed).length;
  const staffSignedRate = pct(staffSigned, totalDistRecords);

  const dualSignedRate = pct(
    distribution_records.filter((r) => r.child_signed && r.staff_signed).length,
    totalDistRecords,
  );

  // Calculate variance across children to detect inequitable distribution
  const childTotals: Record<string, { paid: number; due: number; count: number }> = {};
  for (const r of distribution_records) {
    if (!childTotals[r.child_id]) {
      childTotals[r.child_id] = { paid: 0, due: 0, count: 0 };
    }
    childTotals[r.child_id].paid += r.amount_paid;
    childTotals[r.child_id].due += r.amount_due;
    childTotals[r.child_id].count += 1;
  }

  const childPaymentRatios = Object.values(childTotals).map(
    (t) => (t.due > 0 ? t.paid / t.due : 1),
  );
  let distributionVariance = 0;
  if (childPaymentRatios.length > 1) {
    const avgRatio =
      childPaymentRatios.reduce((s, v) => s + v, 0) / childPaymentRatios.length;
    const sumSquaredDiffs = childPaymentRatios.reduce(
      (s, v) => s + (v - avgRatio) * (v - avgRatio),
      0,
    );
    distributionVariance =
      Math.round((sumSquaredDiffs / childPaymentRatios.length) * 10000) / 10000;
  }

  const highVariance = distributionVariance > 0.05;

  // Count children underpaid (paid < 90% of due)
  const underpaidChildren = Object.values(childTotals).filter(
    (t) => t.due > 0 && t.paid / t.due < 0.9,
  ).length;
  const underpaidRate = pct(underpaidChildren, Object.keys(childTotals).length || 1);

  // --- Age-appropriateness ---
  const totalAgeRecords = age_appropriateness_records.length;
  const meetsGuidance = age_appropriateness_records.filter(
    (r) => r.amount_meets_guidance,
  ).length;
  const ageAppropriateRate = pct(meetsGuidance, totalAgeRecords);

  const ageReviewed = age_appropriateness_records.filter(
    (r) => r.amount_reviewed,
  ).length;
  const ageReviewedRate = pct(ageReviewed, totalAgeRecords);

  const reviewIncludedChild = age_appropriateness_records.filter(
    (r) => r.review_included_child,
  ).length;
  const childInvolvementInReviewRate = pct(reviewIncludedChild, totalAgeRecords);

  const ageSatisfied = age_appropriateness_records.filter(
    (r) => r.child_satisfied_with_amount,
  ).length;
  const ageSatisfactionRate = pct(ageSatisfied, totalAgeRecords);

  const adjustmentsMade = age_appropriateness_records.filter(
    (r) => r.adjustment_made,
  ).length;

  // Check for age-band diversity
  const ageBands = new Set(
    age_appropriateness_records.map((r) => r.age_band),
  );
  const ageBandCount = ageBands.size;

  // --- Payment timeliness ---
  const totalTimelinessRecords = payment_timeliness_records.length;
  const paidOnTime = payment_timeliness_records.filter(
    (r) => r.payment_made && r.days_late <= 0,
  ).length;
  const timelyPaymentRate = pct(paidOnTime, totalTimelinessRecords);

  const totalPaymentsMade = payment_timeliness_records.filter(
    (r) => r.payment_made,
  ).length;
  const paymentCompletionRate = pct(totalPaymentsMade, totalTimelinessRecords);

  const latePayments = payment_timeliness_records.filter(
    (r) => r.days_late > 0,
  );
  // fab-0: null when no late payments to average.
  const avgDaysLate: number | null =
    latePayments.length > 0
      ? Math.round(
          (latePayments.reduce((s, r) => s + r.days_late, 0) / latePayments.length) * 10,
        ) / 10
      : null;

  const childInformedOfDelay = latePayments.filter(
    (r) => r.child_informed_of_delay,
  ).length;
  const delayInformedRate = pct(childInformedOfDelay, latePayments.length);

  const compensatoryAction = latePayments.filter(
    (r) => r.compensatory_action_taken,
  ).length;
  const compensatoryRate = pct(compensatoryAction, latePayments.length);

  const missedPayments = payment_timeliness_records.filter(
    (r) => !r.payment_made,
  ).length;
  const missedPaymentRate = pct(missedPayments, totalTimelinessRecords);

  // --- Child understanding ---
  const totalUnderstandingRecords = child_understanding_records.length;
  const understandsAmount = child_understanding_records.filter(
    (r) => r.understands_amount,
  ).length;
  const understandsAmountRate = pct(understandsAmount, totalUnderstandingRecords);

  const understandsFrequency = child_understanding_records.filter(
    (r) => r.understands_frequency,
  ).length;
  const understandsFrequencyRate = pct(understandsFrequency, totalUnderstandingRecords);

  const understandsSavings = child_understanding_records.filter(
    (r) => r.understands_savings_option,
  ).length;
  const understandsSavingsRate = pct(understandsSavings, totalUnderstandingRecords);

  const understandsExtra = child_understanding_records.filter(
    (r) => r.understands_how_to_request_extra,
  ).length;
  const understandsExtraRate = pct(understandsExtra, totalUnderstandingRecords);

  const ageAppropriateExplanation = child_understanding_records.filter(
    (r) => r.age_appropriate_explanation,
  ).length;
  const ageAppropriateExplanationRate = pct(
    ageAppropriateExplanation,
    totalUnderstandingRecords,
  );

  const childFeelsFair = child_understanding_records.filter(
    (r) => r.child_feels_fairly_treated,
  ).length;
  const fairnessFeelingRate = pct(childFeelsFair, totalUnderstandingRecords);

  const knowsComplaintProcess = child_understanding_records.filter(
    (r) => r.child_knows_complaint_process,
  ).length;
  const complaintAwarenessRate = pct(knowsComplaintProcess, totalUnderstandingRecords);

  const questionsRaised = child_understanding_records.filter(
    (r) => r.child_has_questions,
  ).length;
  const questionsAddressed = child_understanding_records.filter(
    (r) => r.child_has_questions && r.questions_addressed,
  ).length;
  const questionResolutionRate = pct(questionsAddressed, questionsRaised);

  // Composite child understanding rate
  // fab-0: null when no understanding records.
  const childUnderstandingRate: number | null =
    totalUnderstandingRecords > 0
      ? Math.round(
          (understandsAmountRate +
            understandsFrequencyRate +
            understandsSavingsRate +
            ageAppropriateExplanationRate) /
            4,
        )
      : null;

  // --- Transparency ---
  const totalTransparencyRecords = transparency_records.length;
  const accessibleToChild = transparency_records.filter(
    (r) => r.record_accessible_to_child,
  ).length;
  const accessibilityRate = pct(accessibleToChild, totalTransparencyRecords);

  const explainedToChild = transparency_records.filter(
    (r) => r.record_explained_to_child,
  ).length;
  const explanationRate = pct(explainedToChild, totalTransparencyRecords);

  const discrepanciesFound = transparency_records.filter(
    (r) => r.discrepancy_found,
  ).length;
  const discrepanciesResolved = transparency_records.filter(
    (r) => r.discrepancy_found && r.discrepancy_resolved,
  ).length;
  const discrepancyResolutionRate = pct(discrepanciesResolved, discrepanciesFound);

  const auditsCompleted = transparency_records.filter(
    (r) => r.independent_audit_completed,
  ).length;
  const auditCompletionRate = pct(auditsCompleted, totalTransparencyRecords);

  const auditsPassed = transparency_records.filter(
    (r) => r.independent_audit_completed && r.audit_passed,
  ).length;
  const auditPassRate = pct(auditsPassed, auditsCompleted);

  const childCanViewBalance = transparency_records.filter(
    (r) => r.child_can_view_balance,
  ).length;
  const balanceViewRate = pct(childCanViewBalance, totalTransparencyRecords);

  // Composite transparency rate
  // fab-0: null when no transparency records.
  const transparencyRate: number | null =
    totalTransparencyRecords > 0
      ? Math.round(
          (accessibilityRate + explanationRate + balanceViewRate) / 3,
        )
      : null;

  // --- Child satisfaction composite ---
  // Derived from distribution child signing, age satisfaction, and fairness feeling
  const satisfactionComponents: number[] = [];
  if (totalDistRecords > 0) satisfactionComponents.push(childSignedRate);
  if (totalAgeRecords > 0) satisfactionComponents.push(ageSatisfactionRate);
  if (totalUnderstandingRecords > 0) satisfactionComponents.push(fairnessFeelingRate);
  // fab-0: null when no satisfaction components observable.
  const childSatisfactionRate: number | null =
    satisfactionComponents.length > 0
      ? Math.round(
          satisfactionComponents.reduce((s, v) => s + v, 0) /
            satisfactionComponents.length,
        )
      : null;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: equitableDistributionRate (>=90: +5, >=70: +2) ---
  if (equitableDistributionRate >= 90) score += 5;
  else if (equitableDistributionRate >= 70) score += 2;

  // --- Bonus 2: ageAppropriateRate (>=90: +5, >=70: +2) ---
  if (ageAppropriateRate >= 90) score += 5;
  else if (ageAppropriateRate >= 70) score += 2;

  // --- Bonus 3: timelyPaymentRate (>=90: +4, >=70: +2) ---
  if (timelyPaymentRate >= 90) score += 4;
  else if (timelyPaymentRate >= 70) score += 2;

  // --- Bonus 4: childUnderstandingRate (>=80: +4, >=60: +2) ---
  if (meets(childUnderstandingRate, 80)) score += 4;
  else if (meets(childUnderstandingRate, 60)) score += 2;

  // --- Bonus 5: transparencyRate (>=90: +4, >=70: +2) ---
  if (meets(transparencyRate, 90)) score += 4;
  else if (meets(transparencyRate, 70)) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=85: +3, >=65: +1) ---
  if (meets(childSatisfactionRate, 85)) score += 3;
  else if (meets(childSatisfactionRate, 65)) score += 1;

  // --- Bonus 7: dualSignedRate (>=90: +3, >=70: +1) ---
  if (dualSignedRate >= 90) score += 3;
  else if (dualSignedRate >= 70) score += 1;

  // max bonuses = 5+5+4+4+4+3+3 = 28

  // -- Penalties (4 with guards) -------------------------------------------

  // equitableDistributionRate < 50 -> -5
  if (equitableDistributionRate < 50 && totalDistRecords > 0) score -= 5;

  // ageAppropriateRate < 50 -> -5
  if (ageAppropriateRate < 50 && totalAgeRecords > 0) score -= 5;

  // timelyPaymentRate < 50 -> -4
  if (timelyPaymentRate < 50 && totalTimelinessRecords > 0) score -= 4;

  // transparencyRate < 40 -> -4
  if (below(transparencyRate, 40) && totalTransparencyRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const equity_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (equitableDistributionRate >= 90 && totalDistRecords > 0) {
    strengths.push(
      `${equitableDistributionRate}% of pocket money payments are equitable -- all children receive their full entitlement, demonstrating the home's commitment to fair financial treatment.`,
    );
  } else if (equitableDistributionRate >= 70 && totalDistRecords > 0) {
    strengths.push(
      `${equitableDistributionRate}% equitable distribution rate -- most children receive their correct pocket money entitlement.`,
    );
  }

  if (childDistCoverage >= 90 && total_children > 0 && totalDistRecords > 0) {
    strengths.push(
      `Pocket money distribution records cover ${childDistCoverage}% of children on placement -- comprehensive coverage ensures no child is overlooked.`,
    );
  }

  if (dualSignedRate >= 90 && totalDistRecords > 0) {
    strengths.push(
      `${dualSignedRate}% of payments are dual-signed by child and staff -- strong verification practice ensures accountability and child involvement.`,
    );
  } else if (dualSignedRate >= 70 && totalDistRecords > 0) {
    strengths.push(
      `${dualSignedRate}% dual-signing rate -- good practice in verifying pocket money payments with children.`,
    );
  }

  if (!highVariance && uniqueChildrenWithDist >= 2 && totalDistRecords > 0) {
    strengths.push(
      "Low variance in pocket money payment ratios across children -- distribution is consistent and equitable, with no child disproportionately underpaid.",
    );
  }

  if (ageAppropriateRate >= 90 && totalAgeRecords > 0) {
    strengths.push(
      `${ageAppropriateRate}% of pocket money amounts meet local authority age-appropriate guidance -- the home ensures all children receive amounts suited to their age and developmental stage.`,
    );
  } else if (ageAppropriateRate >= 70 && totalAgeRecords > 0) {
    strengths.push(
      `${ageAppropriateRate}% age-appropriate rate -- most children's pocket money amounts align with local authority guidance.`,
    );
  }

  if (childInvolvementInReviewRate >= 80 && totalAgeRecords > 0) {
    strengths.push(
      `Children involved in ${childInvolvementInReviewRate}% of pocket money amount reviews -- the home actively consults children about their financial entitlements.`,
    );
  }

  if (ageSatisfactionRate >= 85 && totalAgeRecords > 0) {
    strengths.push(
      `${ageSatisfactionRate}% of children satisfied with their pocket money amount -- children feel their financial entitlements are fair and appropriate.`,
    );
  }

  if (ageReviewedRate >= 90 && totalAgeRecords > 0) {
    strengths.push(
      `${ageReviewedRate}% of pocket money amounts have been reviewed -- regular reviews ensure amounts remain appropriate as children grow.`,
    );
  }

  if (timelyPaymentRate >= 90 && totalTimelinessRecords > 0) {
    strengths.push(
      `${timelyPaymentRate}% of pocket money payments made on time -- children can rely on receiving their money when expected, supporting trust and routine.`,
    );
  } else if (timelyPaymentRate >= 70 && totalTimelinessRecords > 0) {
    strengths.push(
      `${timelyPaymentRate}% timely payment rate -- most pocket money payments are made on schedule.`,
    );
  }

  if (paymentCompletionRate >= 95 && totalTimelinessRecords > 0) {
    strengths.push(
      `${paymentCompletionRate}% payment completion rate -- virtually all scheduled pocket money payments are made, with very few missed.`,
    );
  }

  if (delayInformedRate >= 90 && latePayments.length > 0) {
    strengths.push(
      `Children informed of ${delayInformedRate}% of late payments -- the home communicates transparently with children when delays occur.`,
    );
  }

  if (totalUnderstandingRecords > 0 && meets(childUnderstandingRate, 80)) {
    strengths.push(
      `Child understanding rate at ${childUnderstandingRate}% -- children have a strong grasp of their pocket money entitlement, frequency, savings options, and how to request additional funds.`,
    );
  } else if (totalUnderstandingRecords > 0 && meets(childUnderstandingRate, 60)) {
    strengths.push(
      `Child understanding rate at ${childUnderstandingRate}% -- most children understand their pocket money arrangements.`,
    );
  }

  if (fairnessFeelingRate >= 85 && totalUnderstandingRecords > 0) {
    strengths.push(
      `${fairnessFeelingRate}% of children feel fairly treated in pocket money matters -- children perceive the system as equitable and just.`,
    );
  }

  if (complaintAwarenessRate >= 80 && totalUnderstandingRecords > 0) {
    strengths.push(
      `${complaintAwarenessRate}% of children know how to raise a complaint about pocket money -- the home empowers children to advocate for their financial rights.`,
    );
  }

  if (ageAppropriateExplanationRate >= 90 && totalUnderstandingRecords > 0) {
    strengths.push(
      `${ageAppropriateExplanationRate}% of pocket money explanations are age-appropriate -- staff tailor financial discussions to each child's developmental level.`,
    );
  }

  if (questionResolutionRate >= 90 && questionsRaised > 0) {
    strengths.push(
      `${questionResolutionRate}% of children's pocket money questions addressed -- staff respond effectively when children seek clarification about their finances.`,
    );
  }

  if (totalTransparencyRecords > 0 && meets(transparencyRate, 90)) {
    strengths.push(
      `Transparency rate at ${transparencyRate}% -- pocket money records are accessible, explained, and children can view their balances. Excellent practice in financial openness.`,
    );
  } else if (totalTransparencyRecords > 0 && meets(transparencyRate, 70)) {
    strengths.push(
      `Transparency rate at ${transparencyRate}% -- good levels of openness in pocket money record-keeping.`,
    );
  }

  if (discrepancyResolutionRate >= 90 && discrepanciesFound > 0) {
    strengths.push(
      `${discrepancyResolutionRate}% of pocket money discrepancies resolved -- the home addresses financial irregularities promptly and effectively.`,
    );
  }

  if (auditPassRate >= 90 && auditsCompleted > 0) {
    strengths.push(
      `${auditPassRate}% of independent pocket money audits passed -- external scrutiny confirms the home's financial management is sound.`,
    );
  }

  if (balanceViewRate >= 90 && totalTransparencyRecords > 0) {
    strengths.push(
      `${balanceViewRate}% of children can view their pocket money balance -- children have direct access to their financial information, promoting independence and trust.`,
    );
  }

  if (meets(childSatisfactionRate, 85)) {
    strengths.push(
      `Overall child satisfaction with pocket money at ${childSatisfactionRate}% -- children feel the pocket money system is fair, transparent, and well-managed.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (equitableDistributionRate < 50 && totalDistRecords > 0) {
    concerns.push(
      `Only ${equitableDistributionRate}% of pocket money payments are equitable -- the majority of children are not receiving their full entitlement, which is a fundamental failure in the home's duty to provide for children's financial needs.`,
    );
  } else if (equitableDistributionRate < 70 && equitableDistributionRate >= 50 && totalDistRecords > 0) {
    concerns.push(
      `Equitable distribution rate at ${equitableDistributionRate}% -- some children are not receiving their full pocket money entitlement.`,
    );
  }

  if (highVariance && totalDistRecords > 0) {
    concerns.push(
      `High variance detected in pocket money payment ratios across children (variance: ${distributionVariance}) -- some children are being treated significantly differently from others, raising equity concerns.`,
    );
  }

  if (underpaidRate > 30 && totalDistRecords > 0) {
    concerns.push(
      `${underpaidRate}% of children received less than 90% of their pocket money entitlement -- a significant proportion of children are being financially shortchanged.`,
    );
  }

  if (childDistCoverage < 70 && total_children > 0 && totalDistRecords > 0) {
    concerns.push(
      `Pocket money distribution records only cover ${childDistCoverage}% of children -- some children may not be receiving pocket money or their payments are not being recorded.`,
    );
  }

  if (childSignedRate < 50 && totalDistRecords > 0) {
    concerns.push(
      `Only ${childSignedRate}% of payments signed by the child -- without child verification, the home cannot demonstrate that children actually received their pocket money.`,
    );
  }

  if (ageAppropriateRate < 50 && totalAgeRecords > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of pocket money amounts meet local authority age-appropriate guidance -- the majority of children are receiving amounts that do not reflect their age and needs.`,
    );
  } else if (ageAppropriateRate < 70 && ageAppropriateRate >= 50 && totalAgeRecords > 0) {
    concerns.push(
      `Age-appropriate rate at ${ageAppropriateRate}% -- some children's pocket money amounts do not meet local authority guidance for their age band.`,
    );
  }

  if (ageReviewedRate < 50 && totalAgeRecords > 0) {
    concerns.push(
      `Only ${ageReviewedRate}% of pocket money amounts have been reviewed -- without regular reviews, amounts may become outdated as children grow and their needs change.`,
    );
  }

  if (childInvolvementInReviewRate < 50 && totalAgeRecords > 0) {
    concerns.push(
      `Children involved in only ${childInvolvementInReviewRate}% of amount reviews -- children's views are not being sought when setting their financial entitlements.`,
    );
  }

  if (ageSatisfactionRate < 50 && totalAgeRecords > 0) {
    concerns.push(
      `Only ${ageSatisfactionRate}% of children satisfied with their pocket money amount -- the majority of children feel their financial entitlement is inadequate.`,
    );
  }

  if (timelyPaymentRate < 50 && totalTimelinessRecords > 0) {
    concerns.push(
      `Only ${timelyPaymentRate}% of pocket money payments made on time -- the majority of children cannot rely on receiving their money when expected, undermining trust and routine.`,
    );
  } else if (timelyPaymentRate < 70 && timelyPaymentRate >= 50 && totalTimelinessRecords > 0) {
    concerns.push(
      `Timely payment rate at ${timelyPaymentRate}% -- some children are not receiving their pocket money on schedule.`,
    );
  }

  if (missedPaymentRate > 20 && totalTimelinessRecords > 0) {
    concerns.push(
      `${missedPaymentRate}% of scheduled pocket money payments missed entirely -- children are being denied their financial entitlements.`,
    );
  }

  if (latePayments.length > 0 && avgDaysLate !== null && avgDaysLate > 3) {
    concerns.push(
      `Average delay for late payments is ${avgDaysLate} days -- persistent delays suggest systemic issues with the home's pocket money payment process.`,
    );
  }

  if (delayInformedRate < 50 && latePayments.length > 0) {
    concerns.push(
      `Children informed of only ${delayInformedRate}% of delayed payments -- children are not being told when their pocket money will be late, which is disrespectful and undermines trust.`,
    );
  }

  if (totalUnderstandingRecords > 0 && below(childUnderstandingRate, 50)) {
    concerns.push(
      `Child understanding rate at only ${childUnderstandingRate}% -- the majority of children do not understand their pocket money entitlement, frequency, or savings options.`,
    );
  } else if (totalUnderstandingRecords > 0 && childUnderstandingRate !== null && childUnderstandingRate < 60 && childUnderstandingRate >= 50) {
    concerns.push(
      `Child understanding rate at ${childUnderstandingRate}% -- children's knowledge of their pocket money arrangements needs strengthening.`,
    );
  }

  if (fairnessFeelingRate < 50 && totalUnderstandingRecords > 0) {
    concerns.push(
      `Only ${fairnessFeelingRate}% of children feel fairly treated in pocket money matters -- the majority of children perceive the system as inequitable.`,
    );
  }

  if (complaintAwarenessRate < 50 && totalUnderstandingRecords > 0) {
    concerns.push(
      `Only ${complaintAwarenessRate}% of children know how to raise a complaint about pocket money -- children are not empowered to advocate for their financial rights.`,
    );
  }

  if (totalTransparencyRecords > 0 && below(transparencyRate, 40)) {
    concerns.push(
      `Transparency rate at only ${transparencyRate}% -- pocket money records are largely inaccessible to children, unexplained, or children cannot view their own balances. This is a significant barrier to trust and financial literacy.`,
    );
  } else if (totalTransparencyRecords > 0 && transparencyRate !== null && transparencyRate < 70 && transparencyRate >= 40) {
    concerns.push(
      `Transparency rate at ${transparencyRate}% -- pocket money record-keeping needs to be more open and accessible to children.`,
    );
  }

  if (discrepanciesFound > 0 && discrepancyResolutionRate < 50) {
    concerns.push(
      `Only ${discrepancyResolutionRate}% of pocket money discrepancies resolved -- unresolved financial irregularities undermine confidence in the home's pocket money management.`,
    );
  }

  if (auditCompletionRate < 30 && totalTransparencyRecords > 0) {
    concerns.push(
      `Independent audits completed for only ${auditCompletionRate}% of pocket money records -- insufficient external scrutiny of the home's financial management of children's money.`,
    );
  }

  if (auditsCompleted > 0 && auditPassRate < 70) {
    concerns.push(
      `Only ${auditPassRate}% of independent audits passed -- external scrutiny has identified failings in the home's pocket money financial management.`,
    );
  }

  if (balanceViewRate < 50 && totalTransparencyRecords > 0) {
    concerns.push(
      `Only ${balanceViewRate}% of children can view their pocket money balance -- children are denied access to their own financial information.`,
    );
  }

  if (totalDistRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No pocket money distribution records despite children being on placement -- the home may not be recording or making regular pocket money payments to children.",
    );
  }

  if (totalUnderstandingRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child understanding records -- the home has not documented whether children understand their pocket money entitlements, frequency, or savings options.",
    );
  }

  if (totalTransparencyRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No transparency records -- the home has not documented any ledger entries, audits, or child access to pocket money records.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: PocketMoneyEquityRecommendation[] = [];
  let rank = 0;

  if (equitableDistributionRate < 50 && totalDistRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all pocket money payments and ensure every child receives their full entitlement. Investigate reasons for underpayment and implement corrective action. Pocket money is a fundamental part of children's care experience and preparation for independence.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (ageAppropriateRate < 50 && totalAgeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review all pocket money amounts against local authority age-appropriate guidance and adjust amounts that fall below recommended levels. Involve children in amount-setting discussions to ensure they feel their views are valued.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (timelyPaymentRate < 50 && totalTimelinessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a fixed pocket money payment schedule and ensure all payments are made on time. Assign responsibility for pocket money distribution to a named staff member on each shift to prevent missed or delayed payments.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (totalTransparencyRecords > 0 && below(transparencyRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Make pocket money records fully accessible to children -- provide individual pocket money books, digital balance access, and regular written statements. Explain all entries to children in age-appropriate language.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (highVariance && totalDistRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate the high variance in pocket money distribution across children and ensure all children are treated equitably. Differences in payment amounts should only reflect age-appropriate adjustments, not arbitrary decisions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (missedPaymentRate > 20 && totalTimelinessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address the high rate of missed pocket money payments. Every scheduled payment must be made -- children's pocket money is their right, not a discretionary benefit. Implement a payment tracking system with alerts for overdue payments.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (totalUnderstandingRecords > 0 && below(childUnderstandingRate, 50)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed pocket money understanding discussions in keywork sessions -- use age-appropriate materials to explain entitlements, payment frequency, savings options, and how to request additional funds. Ensure every child can articulate their financial arrangements.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (fairnessFeelingRate < 50 && totalUnderstandingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate why the majority of children do not feel fairly treated regarding pocket money. Hold individual discussions with each child, review amounts and processes, and implement changes that children feel address their concerns.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (childSignedRate < 50 && totalDistRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement dual-signing for all pocket money payments -- both child and staff should sign to confirm receipt. This protects both children and staff and creates an auditable record of all payments.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (ageReviewedRate < 50 && totalAgeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular review cycle for pocket money amounts -- review at least every six months or when a child moves to a new age band. Include the child in every review discussion.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (complaintAwarenessRate < 50 && totalUnderstandingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children know how to raise a complaint about their pocket money -- include this in induction materials and reinforce through keywork sessions. Display pocket money complaint procedures in accessible language.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (delayInformedRate < 50 && latePayments.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are always informed when their pocket money payment will be delayed -- explain the reason and provide a new expected payment date. Children should never wonder where their money is.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (balanceViewRate < 50 && totalTransparencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide every child with the ability to view their pocket money balance -- consider individual pocket money books, regular statements, or a digital system that children can access independently.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (auditCompletionRate < 30 && totalTransparencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission regular independent audits of the home's pocket money records to ensure financial integrity. Audit findings should be acted upon and shared with staff to improve practice.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (equitableDistributionRate >= 50 && equitableDistributionRate < 70 && totalDistRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve equitable distribution rate to at least 70% -- review all underpayments and address gaps in the pocket money payment process to ensure every child receives their full entitlement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (childInvolvementInReviewRate < 50 && totalAgeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in pocket money amount reviews -- their views should influence the amount they receive and help them understand the rationale for age-appropriate adjustments.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (ageAppropriateRate >= 50 && ageAppropriateRate < 70 && totalAgeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of pocket money amounts meeting local authority guidance to at least 70% -- review and adjust amounts for children whose entitlement falls below age-appropriate levels.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (timelyPaymentRate >= 50 && timelyPaymentRate < 70 && totalTimelinessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve payment timeliness to at least 70% -- review the pocket money payment process and address staffing or scheduling issues that cause delays.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (totalDistRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording all pocket money distribution immediately -- every payment should be documented with amounts, dates, child signatures, and staff signatures.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (totalUnderstandingRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct pocket money understanding assessments with every child -- ensure each child understands their entitlement, payment frequency, savings options, and complaint process.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalTransparencyRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement transparent pocket money record-keeping including child-accessible ledgers, regular audits, and balance visibility for every child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  if (discrepanciesFound > 0 && discrepancyResolutionRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently resolve all outstanding pocket money discrepancies -- unresolved financial irregularities undermine children's trust and may indicate systemic issues in pocket money management.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, positive relationships",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: PocketMoneyEquityInsight[] = [];

  // --- Critical insights ---

  if (equitableDistributionRate < 50 && totalDistRecords > 0) {
    insights.push({
      text: `Only ${equitableDistributionRate}% of pocket money payments are equitable. Ofsted will view the failure to pay children their full entitlement as evidence that the home does not treat children fairly or prepare them for independence -- a direct failure under Reg 5.`,
      severity: "critical",
    });
  }

  if (ageAppropriateRate < 50 && totalAgeRecords > 0) {
    insights.push({
      text: `Only ${ageAppropriateRate}% of pocket money amounts meet local authority age-appropriate guidance. Paying children less than recommended amounts suggests the home is not adequately providing for children's needs as required under Reg 7.`,
      severity: "critical",
    });
  }

  if (timelyPaymentRate < 50 && totalTimelinessRecords > 0) {
    insights.push({
      text: `Only ${timelyPaymentRate}% of payments made on time. Persistent late payment of pocket money undermines children's trust in the home and sends a message that their financial entitlements are not a priority.`,
      severity: "critical",
    });
  }

  if (missedPaymentRate > 30 && totalTimelinessRecords > 0) {
    insights.push({
      text: `${missedPaymentRate}% of scheduled pocket money payments missed entirely. Children are being denied their financial entitlements. Ofsted will view this as a significant failure to provide for children's basic needs under Reg 5.`,
      severity: "critical",
    });
  }

  if (totalTransparencyRecords > 0 && below(transparencyRate, 40)) {
    insights.push({
      text: `Transparency rate at only ${transparencyRate}%. Without accessible records, explained entries, and visible balances, children cannot verify their own finances. This opacity undermines trust and prevents children from developing financial awareness.`,
      severity: "critical",
    });
  }

  if (highVariance && underpaidRate > 30 && totalDistRecords > 0) {
    insights.push({
      text: `High distribution variance with ${underpaidRate}% of children underpaid. This pattern suggests inequitable treatment across children, which Ofsted will view as discriminatory and contrary to the home's duty to treat all children fairly.`,
      severity: "critical",
    });
  }

  if (totalDistRecords === 0 && totalUnderstandingRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No pocket money distribution or child understanding records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's financial entitlements have not been assessed, managed, or explained -- this is a significant omission under Reg 5.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (equitableDistributionRate >= 50 && equitableDistributionRate < 70 && totalDistRecords > 0) {
    insights.push({
      text: `Equitable distribution at ${equitableDistributionRate}% -- improving but some children are still not receiving their full pocket money entitlement. Each underpayment represents a child whose financial needs are not being fully met.`,
      severity: "warning",
    });
  }

  if (ageAppropriateRate >= 50 && ageAppropriateRate < 70 && totalAgeRecords > 0) {
    insights.push({
      text: `Age-appropriate rate at ${ageAppropriateRate}% -- some children's amounts fall below guidance. This may disadvantage children compared to peers in other placements.`,
      severity: "warning",
    });
  }

  if (timelyPaymentRate >= 50 && timelyPaymentRate < 70 && totalTimelinessRecords > 0) {
    insights.push({
      text: `Timely payment rate at ${timelyPaymentRate}% -- while some payments are on time, the level of late payment is high enough to erode children's confidence in the system.`,
      severity: "warning",
    });
  }

  if (latePayments.length > 0 && avgDaysLate !== null && avgDaysLate > 3 && avgDaysLate <= 7) {
    insights.push({
      text: `Late payments average ${avgDaysLate} days overdue -- this level of delay, while not extreme, disrupts children's ability to plan their spending and budget.`,
      severity: "warning",
    });
  }

  if (latePayments.length > 0 && avgDaysLate !== null && avgDaysLate > 7) {
    insights.push({
      text: `Late payments average ${avgDaysLate} days overdue -- this is a substantial delay that significantly impacts children's ability to manage their own money and develop financial independence.`,
      severity: "warning",
    });
  }

  if (totalUnderstandingRecords > 0 && childUnderstandingRate !== null && childUnderstandingRate >= 50 && childUnderstandingRate < 80) {
    insights.push({
      text: `Child understanding rate at ${childUnderstandingRate}% -- while some children understand their pocket money arrangements, a significant proportion lack clarity on their entitlements, which hampers their financial development.`,
      severity: "warning",
    });
  }

  if (totalTransparencyRecords > 0 && transparencyRate !== null && transparencyRate >= 40 && transparencyRate < 70) {
    insights.push({
      text: `Transparency rate at ${transparencyRate}% -- pocket money records are partially accessible but children's ability to scrutinise their own finances is limited. Improving transparency builds trust and financial literacy.`,
      severity: "warning",
    });
  }

  if (childDistCoverage >= 50 && childDistCoverage < 70 && total_children > 0 && totalDistRecords > 0) {
    insights.push({
      text: `Distribution records cover only ${childDistCoverage}% of children on placement -- some children may be falling through the gaps in pocket money provision.`,
      severity: "warning",
    });
  }

  if (dualSignedRate >= 50 && dualSignedRate < 70 && totalDistRecords > 0) {
    insights.push({
      text: `Dual-signing rate at ${dualSignedRate}% -- without consistent verification by both child and staff, the integrity of pocket money payment records is weakened.`,
      severity: "warning",
    });
  }

  if (fairnessFeelingRate >= 50 && fairnessFeelingRate < 70 && totalUnderstandingRecords > 0) {
    insights.push({
      text: `${fairnessFeelingRate}% of children feel fairly treated -- while most perceive the system as equitable, a notable minority feel unfairly treated, warranting investigation.`,
      severity: "warning",
    });
  }

  if (ageBandCount >= 4 && totalAgeRecords > 0) {
    insights.push({
      text: `The home manages pocket money across ${ageBandCount} distinct age bands -- this complexity requires careful calibration to ensure amounts are appropriate for each developmental stage and that younger children do not feel disadvantaged compared to older peers.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (equity_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding pocket money distribution equity -- children's financial entitlements are managed equitably, age-appropriately, transparently, and with genuine child involvement. This is strong evidence for Reg 5 compliance and preparation for independence.",
      severity: "positive",
    });
  }

  if (equitableDistributionRate >= 90 && ageAppropriateRate >= 90 && totalDistRecords > 0 && totalAgeRecords > 0) {
    insights.push({
      text: `Equitable distribution at ${equitableDistributionRate}% and age-appropriate amounts at ${ageAppropriateRate}% -- the home provides comprehensive, fair financial provision for every child. Ofsted will recognise this as evidence of genuinely child-centred financial management.`,
      severity: "positive",
    });
  }

  if (timelyPaymentRate >= 90 && paymentCompletionRate >= 95 && totalTimelinessRecords > 0) {
    insights.push({
      text: `${timelyPaymentRate}% timely payment with ${paymentCompletionRate}% completion rate -- children can rely on receiving their pocket money on time, every time. This consistency builds trust and supports children's developing independence.`,
      severity: "positive",
    });
  }

  if (totalUnderstandingRecords > 0 && meets(childUnderstandingRate, 80) && fairnessFeelingRate >= 85) {
    insights.push({
      text: `Child understanding at ${childUnderstandingRate}% with ${fairnessFeelingRate}% feeling fairly treated -- children genuinely understand and accept their pocket money arrangements. This demonstrates the home's commitment to consulting children and ensuring they feel valued.`,
      severity: "positive",
    });
  }

  if (totalTransparencyRecords > 0 && meets(transparencyRate, 90)) {
    insights.push({
      text: `Transparency rate at ${transparencyRate}% -- pocket money records are fully accessible, clearly explained, and children can independently view their balances. This openness exemplifies best practice in children's financial management.`,
      severity: "positive",
    });
  }

  if (dualSignedRate >= 90 && totalDistRecords > 0) {
    insights.push({
      text: `${dualSignedRate}% dual-signing rate -- every pocket money payment is verified by both child and staff. This rigorous approach protects children's finances and provides a clear audit trail for regulatory scrutiny.`,
      severity: "positive",
    });
  }

  if (discrepancyResolutionRate >= 90 && discrepanciesFound > 0) {
    insights.push({
      text: `${discrepancyResolutionRate}% of discrepancies resolved -- the home responds promptly and effectively to financial irregularities, demonstrating strong financial governance and accountability.`,
      severity: "positive",
    });
  }

  if (auditPassRate >= 90 && auditsCompleted >= 3) {
    insights.push({
      text: `${auditPassRate}% of independent audits passed across ${auditsCompleted} audits -- sustained external scrutiny confirms the home's pocket money management is consistently sound.`,
      severity: "positive",
    });
  }

  if (meets(childSatisfactionRate, 85)) {
    insights.push({
      text: `Overall child satisfaction with pocket money at ${childSatisfactionRate}% -- children feel the system is fair, transparent, and well-managed. This level of satisfaction is strong evidence that the home values children's financial wellbeing.`,
      severity: "positive",
    });
  }

  if (questionResolutionRate >= 90 && questionsRaised >= 3) {
    insights.push({
      text: `${questionResolutionRate}% of children's pocket money questions addressed across ${questionsRaised} queries -- staff respond effectively to financial queries, fostering an environment where children feel comfortable asking about their money.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (equity_rating === "outstanding") {
    headline =
      "Outstanding pocket money distribution equity -- children's financial entitlements are managed fairly, transparently, and with genuine child involvement.";
  } else if (equity_rating === "good") {
    headline = `Good pocket money distribution equity -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (equity_rating === "adequate") {
    headline = `Adequate pocket money distribution equity -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's financial entitlements are managed equitably and transparently.`;
  } else {
    headline = `Pocket money distribution equity is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive fair, timely, and transparent financial provision.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    equity_rating,
    equity_score: score,
    headline,
    equitable_distribution_rate: equitableDistributionRate,
    age_appropriate_rate: ageAppropriateRate,
    timely_payment_rate: timelyPaymentRate,
    child_understanding_rate: childUnderstandingRate,
    transparency_rate: transparencyRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
