// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME POCKET MONEY & FINANCIAL LITERACY INTELLIGENCE ENGINE
// Monitors how well the home manages pocket money, supports savings programmes,
// delivers financial literacy education, facilitates age-appropriate budgeting,
// and maintains money handling accountability.
// Measures pocket money compliance, savings engagement, financial education,
// budgeting coverage, money handling accuracy, and child financial autonomy.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Arrangements for finances),
// Reg 12 (The protection standard — financial safeguarding).
// SCCIF: "Experiences and progress of children and young people" — independence,
// life skills, preparing for adulthood.
// Store keys: pocketMoneyTransactions, ypSavingsAccountRecords,
//             moneyRecords, childBankAccounts, independenceSkillsRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PocketMoneyRecordInput {
  id: string;
  child_id: string;
  week_start: string;
  amount_due: number;
  amount_paid: number;
  paid_on_time: boolean;
  receipt_signed: boolean;
  payment_method: "cash" | "bank_transfer" | "card" | "other";
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface SavingsProgrammeRecordInput {
  id: string;
  child_id: string;
  programme_name: string;
  start_date: string;
  active: boolean;
  target_amount: number;
  current_balance: number;
  deposits_count: number;
  withdrawals_count: number;
  last_deposit_date: string | null;
  child_initiated: boolean;
  staff_supported: boolean;
  review_date: string | null;
  created_at: string;
}

export interface FinancialEducationRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  topic: "budgeting_basics" | "saving_spending" | "banking" | "online_safety" | "debt_awareness" | "comparison_shopping" | "value_of_money" | "earning_money" | "bills_utilities" | "other";
  age_appropriate: boolean;
  child_engaged: boolean;
  learning_evidenced: boolean;
  delivered_by: string;
  duration_minutes: number;
  resources_used: string | null;
  created_at: string;
}

export interface BudgetingRecordInput {
  id: string;
  child_id: string;
  period_start: string;
  period_end: string;
  budget_category: "clothing" | "toiletries" | "leisure" | "transport" | "phone" | "food_treats" | "savings" | "other";
  budgeted_amount: number;
  actual_spent: number;
  child_led: boolean;
  within_budget: boolean;
  review_completed: boolean;
  review_date: string | null;
  created_at: string;
}

export interface MoneyHandlingRecordInput {
  id: string;
  child_id: string;
  date: string;
  transaction_type: "receipt" | "disbursement" | "petty_cash" | "bank_deposit" | "bank_withdrawal" | "refund";
  amount: number;
  receipt_present: boolean;
  dual_signed: boolean;
  reconciled: boolean;
  discrepancy_amount: number;
  discrepancy_resolved: boolean;
  audited: boolean;
  created_at: string;
}

export interface PocketMoneyFinancialLiteracyInput {
  today: string;
  total_children: number;
  pocket_money_records: PocketMoneyRecordInput[];
  savings_programme_records: SavingsProgrammeRecordInput[];
  financial_education_records: FinancialEducationRecordInput[];
  budgeting_records: BudgetingRecordInput[];
  money_handling_records: MoneyHandlingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FinancialLiteracyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FinancialLiteracyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FinancialLiteracyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PocketMoneyFinancialLiteracyResult {
  financial_rating: FinancialLiteracyRating;
  financial_score: number;
  headline: string;
  total_pocket_money_records: number;
  total_savings_programmes: number;
  total_financial_education_sessions: number;
  total_budgeting_records: number;
  total_money_handling_records: number;
  pocket_money_compliance_rate: number;
  savings_engagement_rate: number;
  financial_education_rate: number;
  budgeting_coverage_rate: number;
  money_handling_accuracy_rate: number;
  child_autonomy_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: FinancialLiteracyRecommendation[];
  insights: FinancialLiteracyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FinancialLiteracyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FinancialLiteracyRating,
  score: number,
  headline: string,
): PocketMoneyFinancialLiteracyResult {
  return {
    financial_rating: rating,
    financial_score: score,
    headline,
    total_pocket_money_records: 0,
    total_savings_programmes: 0,
    total_financial_education_sessions: 0,
    total_budgeting_records: 0,
    total_money_handling_records: 0,
    pocket_money_compliance_rate: 0,
    savings_engagement_rate: 0,
    financial_education_rate: 0,
    budgeting_coverage_rate: 0,
    money_handling_accuracy_rate: 0,
    child_autonomy_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computePocketMoneyFinancialLiteracy(
  input: PocketMoneyFinancialLiteracyInput,
): PocketMoneyFinancialLiteracyResult {
  const {
    total_children,
    pocket_money_records,
    savings_programme_records,
    financial_education_records,
    budgeting_records,
    money_handling_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    pocket_money_records.length === 0 &&
    savings_programme_records.length === 0 &&
    financial_education_records.length === 0 &&
    budgeting_records.length === 0 &&
    money_handling_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess pocket money and financial literacy.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No pocket money or financial literacy data recorded despite children on placement — financial management and education require urgent attention.",
      ),
      concerns: [
        "No pocket money records, savings programmes, financial education sessions, budgeting records, or money handling records exist despite children being on placement — the home cannot evidence financial management or literacy provision.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of pocket money payments, savings programmes, financial education sessions, and money handling to evidence the home's commitment to children's financial welfare and independence.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
        },
        {
          rank: 2,
          recommendation:
            "Establish age-appropriate financial literacy programmes for all children to support independence skills and preparation for adulthood in line with SCCIF expectations.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Experiences and progress, preparing for adulthood",
        },
      ],
      insights: [
        {
          text: "The complete absence of pocket money and financial literacy records means the home cannot demonstrate that children's financial welfare is protected, that money is handled accountably, or that children are being equipped with financial life skills. This represents a fundamental gap in Reg 14 compliance and independence preparation.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Pocket money compliance ---
  const totalPocketMoney = pocket_money_records.length;
  const paidCorrectly = pocket_money_records.filter(
    (r) => r.amount_paid >= r.amount_due && r.paid_on_time,
  ).length;
  const pocketMoneyComplianceRate = pct(paidCorrectly, totalPocketMoney);

  const receiptsSigned = pocket_money_records.filter((r) => r.receipt_signed).length;
  const receiptSignedRate = pct(receiptsSigned, totalPocketMoney);

  const paidOnTime = pocket_money_records.filter((r) => r.paid_on_time).length;
  const paidOnTimeRate = pct(paidOnTime, totalPocketMoney);

  // --- Savings engagement ---
  const totalSavings = savings_programme_records.length;
  const activeSavings = savings_programme_records.filter((s) => s.active).length;
  const uniqueChildrenWithSavings = new Set(
    savings_programme_records.filter((s) => s.active).map((s) => s.child_id),
  ).size;
  const savingsEngagementRate =
    total_children > 0 ? pct(uniqueChildrenWithSavings, total_children) : 0;

  const childInitiatedSavings = savings_programme_records.filter(
    (s) => s.child_initiated && s.active,
  ).length;
  const childInitiatedRate = pct(childInitiatedSavings, activeSavings);

  const savingsOnTrack = savings_programme_records.filter(
    (s) => s.active && s.target_amount > 0 && s.current_balance >= s.target_amount * 0.5,
  ).length;
  const savingsProgressRate = pct(savingsOnTrack, activeSavings);

  // --- Financial education ---
  const totalEducation = financial_education_records.length;
  const uniqueChildrenWithEducation = new Set(
    financial_education_records.map((e) => e.child_id),
  ).size;
  const financialEducationRate =
    total_children > 0 ? pct(uniqueChildrenWithEducation, total_children) : 0;

  const ageAppropriate = financial_education_records.filter((e) => e.age_appropriate).length;
  const ageAppropriateRate = pct(ageAppropriate, totalEducation);

  const childEngaged = financial_education_records.filter((e) => e.child_engaged).length;
  const childEngagedRate = pct(childEngaged, totalEducation);

  const learningEvidenced = financial_education_records.filter((e) => e.learning_evidenced).length;
  const learningEvidencedRate = pct(learningEvidenced, totalEducation);

  // --- Budgeting coverage ---
  const totalBudgeting = budgeting_records.length;
  const uniqueChildrenWithBudgets = new Set(
    budgeting_records.map((b) => b.child_id),
  ).size;
  const budgetingCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithBudgets, total_children) : 0;

  const withinBudget = budgeting_records.filter((b) => b.within_budget).length;
  const withinBudgetRate = pct(withinBudget, totalBudgeting);

  const childLedBudgets = budgeting_records.filter((b) => b.child_led).length;
  const childLedBudgetRate = pct(childLedBudgets, totalBudgeting);

  const reviewedBudgets = budgeting_records.filter((b) => b.review_completed).length;
  const budgetReviewRate = pct(reviewedBudgets, totalBudgeting);

  // --- Money handling accuracy ---
  const totalMoneyHandling = money_handling_records.length;
  const reconciled = money_handling_records.filter((m) => m.reconciled).length;
  const moneyHandlingAccuracyRate = pct(reconciled, totalMoneyHandling);

  const receiptsPresent = money_handling_records.filter((m) => m.receipt_present).length;
  const receiptPresentRate = pct(receiptsPresent, totalMoneyHandling);

  const dualSigned = money_handling_records.filter((m) => m.dual_signed).length;
  const dualSignedRate = pct(dualSigned, totalMoneyHandling);

  const audited = money_handling_records.filter((m) => m.audited).length;
  const auditedRate = pct(audited, totalMoneyHandling);

  const discrepancies = money_handling_records.filter((m) => m.discrepancy_amount > 0).length;
  const discrepancyRate = pct(discrepancies, totalMoneyHandling);
  const unresolvedDiscrepancies = money_handling_records.filter(
    (m) => m.discrepancy_amount > 0 && !m.discrepancy_resolved,
  ).length;

  // --- Child autonomy (composite of child-led budgets, child-initiated savings, and engagement) ---
  const autonomyNumerators: number[] = [];
  if (totalBudgeting > 0) autonomyNumerators.push(childLedBudgetRate);
  if (activeSavings > 0) autonomyNumerators.push(childInitiatedRate);
  if (totalEducation > 0) autonomyNumerators.push(childEngagedRate);
  const childAutonomyRate =
    autonomyNumerators.length > 0
      ? Math.round(autonomyNumerators.reduce((a, b) => a + b, 0) / autonomyNumerators.length)
      : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: pocketMoneyComplianceRate (>=95: +4, >=80: +2) ---
  if (pocketMoneyComplianceRate >= 95) score += 4;
  else if (pocketMoneyComplianceRate >= 80) score += 2;

  // --- Bonus 2: savingsEngagementRate (>=90: +3, >=70: +1) ---
  if (savingsEngagementRate >= 90) score += 3;
  else if (savingsEngagementRate >= 70) score += 1;

  // --- Bonus 3: financialEducationRate (>=100: +4, >=80: +2) ---
  if (financialEducationRate >= 100) score += 4;
  else if (financialEducationRate >= 80) score += 2;

  // --- Bonus 4: budgetingCoverageRate (>=90: +3, >=70: +1) ---
  if (budgetingCoverageRate >= 90) score += 3;
  else if (budgetingCoverageRate >= 70) score += 1;

  // --- Bonus 5: moneyHandlingAccuracyRate (>=95: +3, >=80: +1) ---
  if (moneyHandlingAccuracyRate >= 95) score += 3;
  else if (moneyHandlingAccuracyRate >= 80) score += 1;

  // --- Bonus 6: childAutonomyRate (>=80: +3, >=60: +1) ---
  if (childAutonomyRate >= 80) score += 3;
  else if (childAutonomyRate >= 60) score += 1;

  // --- Bonus 7: learningEvidencedRate (>=90: +3, >=70: +1) ---
  if (learningEvidencedRate >= 90) score += 3;
  else if (learningEvidencedRate >= 70) score += 1;

  // --- Bonus 8: dualSignedRate (>=95: +3, >=80: +1) ---
  if (dualSignedRate >= 95) score += 3;
  else if (dualSignedRate >= 80) score += 1;

  // --- Bonus 9: receiptSignedRate (>=95: +2, >=80: +1) ---
  if (receiptSignedRate >= 95) score += 2;
  else if (receiptSignedRate >= 80) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: pocketMoneyComplianceRate < 50 → -5
  if (pocketMoneyComplianceRate < 50 && totalPocketMoney > 0) score -= 5;

  // Penalty 2: moneyHandlingAccuracyRate < 50 → -5
  if (moneyHandlingAccuracyRate < 50 && totalMoneyHandling > 0) score -= 5;

  // Penalty 3: financialEducationRate < 30 → -5
  if (financialEducationRate < 30 && total_children > 0) score -= 5;

  // Penalty 4: unresolvedDiscrepancies > 0 → -3
  if (unresolvedDiscrepancies > 0) score -= 3;

  score = clamp(score, 0, 100);

  const financial_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (pocketMoneyComplianceRate >= 95 && totalPocketMoney > 0) {
    strengths.push(
      "Pocket money is paid correctly and on time in virtually all cases — children can rely on receiving their entitlement consistently and predictably.",
    );
  } else if (pocketMoneyComplianceRate >= 80 && totalPocketMoney > 0) {
    strengths.push(
      `${pocketMoneyComplianceRate}% pocket money compliance rate — the majority of payments are made correctly and on time.`,
    );
  }

  if (savingsEngagementRate >= 90 && total_children > 0) {
    strengths.push(
      "Almost all children are actively engaged in savings programmes — the home fosters a strong savings culture that supports financial independence.",
    );
  } else if (savingsEngagementRate >= 70 && total_children > 0) {
    strengths.push(
      `${savingsEngagementRate}% of children have active savings programmes — good savings engagement across the home.`,
    );
  }

  if (financialEducationRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has received financial literacy education — the home ensures all children are equipped with financial knowledge appropriate to their age and stage.",
    );
  } else if (financialEducationRate >= 80 && total_children > 0) {
    strengths.push(
      `${financialEducationRate}% of children have participated in financial education — strong coverage of financial literacy across the home.`,
    );
  }

  if (budgetingCoverageRate >= 90 && total_children > 0) {
    strengths.push(
      "Budgeting activities cover almost all children — age-appropriate budgeting is embedded as a core life skill within the home.",
    );
  } else if (budgetingCoverageRate >= 70 && total_children > 0) {
    strengths.push(
      `${budgetingCoverageRate}% of children engage in budgeting activities — good coverage of budgeting skills across the home.`,
    );
  }

  if (moneyHandlingAccuracyRate >= 95 && totalMoneyHandling > 0) {
    strengths.push(
      "Money handling is reconciled to an excellent standard — financial accountability is robust, with near-complete reconciliation of all transactions.",
    );
  } else if (moneyHandlingAccuracyRate >= 80 && totalMoneyHandling > 0) {
    strengths.push(
      `${moneyHandlingAccuracyRate}% money handling accuracy — the home demonstrates strong financial accountability in its transaction management.`,
    );
  }

  if (childAutonomyRate >= 80) {
    strengths.push(
      "Children demonstrate high levels of financial autonomy — they are actively involved in budgeting decisions, savings choices, and financial learning, supporting preparation for adulthood.",
    );
  } else if (childAutonomyRate >= 60) {
    strengths.push(
      `${childAutonomyRate}% child financial autonomy rate — children are developing appropriate independence in financial decision-making.`,
    );
  }

  if (dualSignedRate >= 95 && totalMoneyHandling > 0) {
    strengths.push(
      "Dual-signature compliance is exemplary — robust safeguarding of financial transactions protects both children and staff.",
    );
  } else if (dualSignedRate >= 80 && totalMoneyHandling > 0) {
    strengths.push(
      `${dualSignedRate}% of transactions are dual-signed — good compliance with financial safeguarding protocols.`,
    );
  }

  if (learningEvidencedRate >= 90 && totalEducation > 0) {
    strengths.push(
      `${learningEvidencedRate}% of financial education sessions have evidenced learning outcomes — education is delivering measurable impact on children's financial knowledge.`,
    );
  } else if (learningEvidencedRate >= 70 && totalEducation > 0) {
    strengths.push(
      `${learningEvidencedRate}% of sessions with evidenced learning — financial education is generally translating into demonstrable knowledge.`,
    );
  }

  if (ageAppropriateRate >= 95 && totalEducation > 0) {
    strengths.push(
      "Financial education is age-appropriate in virtually all sessions — content is carefully tailored to each child's developmental stage.",
    );
  }

  if (childInitiatedRate >= 70 && activeSavings > 0) {
    strengths.push(
      `${childInitiatedRate}% of active savings programmes are child-initiated — children are proactively choosing to save, demonstrating genuine financial motivation.`,
    );
  }

  if (withinBudgetRate >= 90 && totalBudgeting > 0) {
    strengths.push(
      `${withinBudgetRate}% of budgets maintained within limits — children are successfully managing their spending within agreed boundaries.`,
    );
  }

  if (receiptSignedRate >= 95 && totalPocketMoney > 0) {
    strengths.push(
      "Receipt-signing compliance is excellent — robust audit trail for all pocket money disbursements.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (pocketMoneyComplianceRate < 50 && totalPocketMoney > 0) {
    concerns.push(
      `Only ${pocketMoneyComplianceRate}% of pocket money payments are compliant — the majority of children are not receiving their full entitlement on time, undermining trust and financial predictability.`,
    );
  } else if (pocketMoneyComplianceRate < 80 && pocketMoneyComplianceRate >= 50 && totalPocketMoney > 0) {
    concerns.push(
      `Pocket money compliance at ${pocketMoneyComplianceRate}% — some children are not receiving their full pocket money on time, which may affect their sense of financial security.`,
    );
  }

  if (savingsEngagementRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${savingsEngagementRate}% of children have active savings programmes — the majority lack structured savings support, missing a key opportunity to develop financial habits.`,
    );
  } else if (savingsEngagementRate < 70 && savingsEngagementRate >= 50 && total_children > 0) {
    concerns.push(
      `Savings engagement at ${savingsEngagementRate}% — not all children are supported with savings programmes to build financial resilience.`,
    );
  }

  if (financialEducationRate < 30 && total_children > 0) {
    concerns.push(
      `Only ${financialEducationRate}% of children have received financial literacy education — the vast majority are not being equipped with essential financial life skills for independence.`,
    );
  } else if (financialEducationRate < 80 && financialEducationRate >= 30 && total_children > 0) {
    concerns.push(
      `Financial education coverage at ${financialEducationRate}% — not all children are receiving financial literacy support, creating gaps in preparation for adulthood.`,
    );
  }

  if (moneyHandlingAccuracyRate < 50 && totalMoneyHandling > 0) {
    concerns.push(
      `Only ${moneyHandlingAccuracyRate}% of money handling transactions reconciled — the home cannot demonstrate adequate financial accountability, raising safeguarding concerns about how children's money is managed.`,
    );
  } else if (moneyHandlingAccuracyRate < 80 && moneyHandlingAccuracyRate >= 50 && totalMoneyHandling > 0) {
    concerns.push(
      `Money handling accuracy at ${moneyHandlingAccuracyRate}% — some transactions are not reconciled, which weakens the home's financial accountability framework.`,
    );
  }

  if (budgetingCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${budgetingCoverageRate}% of children engage in budgeting activities — most children are not practising age-appropriate budgeting, a key independence skill.`,
    );
  } else if (budgetingCoverageRate < 70 && budgetingCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Budgeting coverage at ${budgetingCoverageRate}% — some children lack budgeting experiences that develop money management skills.`,
    );
  }

  if (unresolvedDiscrepancies > 0) {
    concerns.push(
      `${unresolvedDiscrepancies} unresolved financial discrepanc${unresolvedDiscrepancies !== 1 ? "ies" : "y"} — outstanding discrepancies must be investigated and resolved promptly to protect children's financial interests and maintain regulatory compliance.`,
    );
  }

  if (dualSignedRate < 80 && totalMoneyHandling > 0) {
    concerns.push(
      `Dual-signature rate at ${dualSignedRate}% — insufficient dual-signing of financial transactions creates a safeguarding vulnerability and weakens the audit trail.`,
    );
  }

  if (paidOnTimeRate < 70 && totalPocketMoney > 0) {
    concerns.push(
      `Only ${paidOnTimeRate}% of pocket money paid on time — delayed payments undermine children's financial planning and sense of entitlement to their own money.`,
    );
  }

  if (ageAppropriateRate < 80 && totalEducation > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of financial education sessions assessed as age-appropriate — content may not be suitably matched to children's developmental stages.`,
    );
  }

  if (childAutonomyRate < 40) {
    concerns.push(
      `Child financial autonomy rate at ${childAutonomyRate}% — children have limited involvement in financial decisions affecting them, which restricts independence development.`,
    );
  }

  if (totalPocketMoney === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No pocket money records exist despite children being on placement — the home cannot evidence that children receive their pocket money entitlement or that payments are tracked and accountable.",
    );
  }

  if (totalMoneyHandling === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No money handling records exist despite children being on placement — the home cannot demonstrate financial accountability or proper handling of children's money.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FinancialLiteracyRecommendation[] = [];
  let rank = 0;

  if (pocketMoneyComplianceRate < 50 && totalPocketMoney > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and rectify pocket money payment processes — children must receive their full entitlement on time every week. Implement a weekly pocket money checklist with sign-off to ensure compliance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
    });
  }

  if (moneyHandlingAccuracyRate < 50 && totalMoneyHandling > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve money handling reconciliation — implement daily cash balancing, mandatory dual-signing, and weekly reconciliation audits to ensure every transaction is properly accounted for.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
    });
  }

  if (financialEducationRate < 30 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and deliver a structured financial literacy programme for all children — every child should receive age-appropriate financial education covering budgeting, saving, banking, and the value of money.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Preparing for adulthood, independence skills",
    });
  }

  if (unresolvedDiscrepancies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Investigate and resolve all ${unresolvedDiscrepancies} outstanding financial discrepanc${unresolvedDiscrepancies !== 1 ? "ies" : "y"} immediately — unresolved discrepancies pose safeguarding and regulatory risks.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — The protection standard",
    });
  }

  if (dualSignedRate < 80 && totalMoneyHandling > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enforce mandatory dual-signing for all financial transactions — this is a fundamental safeguarding requirement that protects both children and staff from financial irregularities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
    });
  }

  if (totalPocketMoney === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording all pocket money payments immediately — the absence of records means the home cannot evidence that children receive their financial entitlements or that payments are properly accounted for.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
    });
  }

  if (savingsEngagementRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish savings programmes for all children — encourage each child to set age-appropriate savings goals with staff support, building habits that prepare them for financial independence.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress, preparing for adulthood",
    });
  }

  if (budgetingCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend budgeting activities to all children — every child should have regular opportunities to practise budgeting across categories such as clothing, leisure, and personal care.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Independence and life skills",
    });
  }

  if (
    financialEducationRate >= 30 &&
    financialEducationRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand financial literacy education to cover all children — develop a programme that ensures every child receives regular, progressive financial education sessions.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Preparing for adulthood",
    });
  }

  if (childAutonomyRate < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in financial decisions — encourage child-led budgeting, self-initiated savings, and active participation in financial education to build genuine autonomy.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Independence and life skills",
    });
  }

  if (
    pocketMoneyComplianceRate >= 50 &&
    pocketMoneyComplianceRate < 80 &&
    totalPocketMoney > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve pocket money compliance to at least 80% — review processes to ensure all children receive their full entitlement on the agreed day each week.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
    });
  }

  if (
    moneyHandlingAccuracyRate >= 50 &&
    moneyHandlingAccuracyRate < 80 &&
    totalMoneyHandling > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen money handling reconciliation to at least 80% — implement regular reconciliation checks and ensure all transactions have supporting documentation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for finances",
    });
  }

  if (
    savingsEngagementRate >= 50 &&
    savingsEngagementRate < 70 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand savings programme participation to at least 70% of children — consider matched savings incentives or savings challenges to boost engagement.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Preparing for adulthood",
    });
  }

  if (
    budgetingCoverageRate >= 50 &&
    budgetingCoverageRate < 70 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend budgeting activities to at least 70% of children — introduce varied budgeting exercises across different spending categories to engage more children.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Independence and life skills",
    });
  }

  if (learningEvidencedRate < 70 && totalEducation > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen evidence of learning outcomes from financial education sessions — use pre/post assessments, quizzes, or portfolio evidence to demonstrate that education is translating into knowledge.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (ageAppropriateRate < 80 && totalEducation > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review financial education content to ensure all sessions are age-appropriate — tailor materials and delivery to each child's developmental stage and comprehension level.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FinancialLiteracyInsight[] = [];

  // -- Critical insights --

  if (pocketMoneyComplianceRate < 50 && totalPocketMoney > 0) {
    insights.push({
      text: `Only ${pocketMoneyComplianceRate}% of pocket money payments are compliant. Ofsted will view inconsistent pocket money payments as evidence that children's financial entitlements are not protected, directly undermining Reg 14 compliance. Children who cannot rely on receiving their money lose trust in the home's care.`,
      severity: "critical",
    });
  }

  if (moneyHandlingAccuracyRate < 50 && totalMoneyHandling > 0) {
    insights.push({
      text: `Only ${moneyHandlingAccuracyRate}% of money handling transactions reconciled. Inadequate financial reconciliation raises serious safeguarding concerns — the home cannot demonstrate that children's money is properly accounted for and protected. This is a significant Reg 14 compliance failure.`,
      severity: "critical",
    });
  }

  if (financialEducationRate < 30 && total_children > 0) {
    insights.push({
      text: `Only ${financialEducationRate}% of children have received financial literacy education. Without financial education, children are not being equipped with the life skills they need for independence and adulthood. Ofsted expects homes to actively prepare children for leaving care, and financial literacy is a fundamental component.`,
      severity: "critical",
    });
  }

  if (unresolvedDiscrepancies > 0) {
    insights.push({
      text: `${unresolvedDiscrepancies} unresolved financial discrepanc${unresolvedDiscrepancies !== 1 ? "ies" : "y"} exist in money handling records. Unresolved discrepancies may indicate financial mismanagement or poor record-keeping. Ofsted and Reg 44 visitors will scrutinise unresolved discrepancies as a potential safeguarding concern.`,
      severity: "critical",
    });
  }

  if (totalPocketMoney === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No pocket money records exist despite children being on placement. The absence of pocket money records means the home cannot evidence that children receive their financial entitlements. Ofsted will view this as a failure to meet Reg 14 requirements around financial arrangements for children.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    pocketMoneyComplianceRate >= 50 &&
    pocketMoneyComplianceRate < 80 &&
    totalPocketMoney > 0
  ) {
    insights.push({
      text: `Pocket money compliance at ${pocketMoneyComplianceRate}% — improving but some children are still not receiving their full entitlement on time. Consistent, reliable pocket money builds financial trust and agency.`,
      severity: "warning",
    });
  }

  if (
    savingsEngagementRate >= 50 &&
    savingsEngagementRate < 70 &&
    total_children > 0
  ) {
    insights.push({
      text: `Savings engagement at ${savingsEngagementRate}% — while some children are saving, others lack structured support. Savings programmes build financial habits that persist beyond care.`,
      severity: "warning",
    });
  }

  if (
    financialEducationRate >= 30 &&
    financialEducationRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Financial education coverage at ${financialEducationRate}% — not all children are receiving financial literacy support. Gaps in financial education leave some children unprepared for managing money independently.`,
      severity: "warning",
    });
  }

  if (
    moneyHandlingAccuracyRate >= 50 &&
    moneyHandlingAccuracyRate < 80 &&
    totalMoneyHandling > 0
  ) {
    insights.push({
      text: `Money handling accuracy at ${moneyHandlingAccuracyRate}% — some transactions remain unreconciled. Consistent reconciliation is essential to demonstrate financial propriety and protect children's money.`,
      severity: "warning",
    });
  }

  if (
    budgetingCoverageRate >= 50 &&
    budgetingCoverageRate < 70 &&
    total_children > 0
  ) {
    insights.push({
      text: `Budgeting coverage at ${budgetingCoverageRate}% — while some children practise budgeting, others lack this essential independence skill. Budgeting is a core life skill for adulthood preparation.`,
      severity: "warning",
    });
  }

  if (childAutonomyRate >= 40 && childAutonomyRate < 60) {
    insights.push({
      text: `Child financial autonomy at ${childAutonomyRate}% — children have moderate involvement in financial decisions but could be given greater ownership of budgeting and savings to build independence.`,
      severity: "warning",
    });
  }

  if (withinBudgetRate < 70 && totalBudgeting > 0) {
    insights.push({
      text: `Only ${withinBudgetRate}% of budgets maintained within limits — children may need additional support in managing spending. Consider whether budgets are realistic and whether overspending reflects unmet needs.`,
      severity: "warning",
    });
  }

  if (
    dualSignedRate >= 50 &&
    dualSignedRate < 80 &&
    totalMoneyHandling > 0
  ) {
    insights.push({
      text: `Dual-signature rate at ${dualSignedRate}% — not all transactions have the required dual signatures. Consistent dual-signing is a fundamental financial safeguarding requirement.`,
      severity: "warning",
    });
  }

  if (budgetReviewRate < 70 && totalBudgeting > 0) {
    insights.push({
      text: `Only ${budgetReviewRate}% of budgets have been reviewed — without regular reviews, budgeting becomes an administrative exercise rather than a learning opportunity for children.`,
      severity: "warning",
    });
  }

  // Unique education topics covered
  const uniqueTopics = new Set(financial_education_records.map((e) => e.topic));
  if (uniqueTopics.size < 4 && totalEducation > 0) {
    insights.push({
      text: `Financial education covers only ${uniqueTopics.size} topic area${uniqueTopics.size !== 1 ? "s" : ""} — a broader curriculum including budgeting, banking, online safety, and debt awareness would give children more comprehensive financial literacy.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (financial_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding pocket money management and financial literacy provision — children receive their entitlements reliably, savings programmes are well-engaged, financial education is comprehensive, and money handling is accountable. This is strong evidence for Reg 14 compliance and preparation for adulthood.",
      severity: "positive",
    });
  }

  if (
    pocketMoneyComplianceRate >= 95 &&
    receiptSignedRate >= 95 &&
    totalPocketMoney > 0
  ) {
    insights.push({
      text: "Pocket money payments are virtually 100% compliant with full receipt-signing — children receive their entitlements reliably with a complete audit trail. This exemplary practice protects children's financial interests and builds trust.",
      severity: "positive",
    });
  }

  if (
    savingsEngagementRate >= 90 &&
    childInitiatedRate >= 70 &&
    total_children > 0 &&
    activeSavings > 0
  ) {
    insights.push({
      text: `${savingsEngagementRate}% savings engagement with ${childInitiatedRate}% child-initiated — children are not just saving but actively choosing to save, demonstrating genuine financial motivation and self-directed independence.`,
      severity: "positive",
    });
  }

  if (
    financialEducationRate >= 100 &&
    learningEvidencedRate >= 90 &&
    total_children > 0 &&
    totalEducation > 0
  ) {
    insights.push({
      text: `Every child receives financial education with ${learningEvidencedRate}% evidenced learning outcomes — the home delivers comprehensive, effective financial literacy that demonstrably builds children's knowledge and skills.`,
      severity: "positive",
    });
  }

  if (
    moneyHandlingAccuracyRate >= 95 &&
    dualSignedRate >= 95 &&
    totalMoneyHandling > 0
  ) {
    insights.push({
      text: `Money handling accuracy at ${moneyHandlingAccuracyRate}% with ${dualSignedRate}% dual-signing compliance — financial transactions are exemplary in their accountability and safeguarding rigour.`,
      severity: "positive",
    });
  }

  if (
    budgetingCoverageRate >= 90 &&
    childLedBudgetRate >= 70 &&
    total_children > 0 &&
    totalBudgeting > 0
  ) {
    insights.push({
      text: `${budgetingCoverageRate}% budgeting coverage with ${childLedBudgetRate}% child-led — children are actively practising real-world budgeting with genuine autonomy, building the financial management skills they will need in adulthood.`,
      severity: "positive",
    });
  }

  if (childAutonomyRate >= 80) {
    insights.push({
      text: `Child financial autonomy at ${childAutonomyRate}% — children are meaningfully involved in financial decisions, demonstrating the home's commitment to promoting independence and preparing young people for managing their own finances.`,
      severity: "positive",
    });
  }

  if (
    withinBudgetRate >= 90 &&
    totalBudgeting > 0
  ) {
    insights.push({
      text: `${withinBudgetRate}% of budgets maintained within limits — children are successfully managing their spending, suggesting that budgeting education is translating into practical skills.`,
      severity: "positive",
    });
  }

  if (uniqueTopics.size >= 6 && totalEducation > 0) {
    insights.push({
      text: `Financial education covers ${uniqueTopics.size} distinct topic areas — children receive a broad, comprehensive financial literacy curriculum that prepares them across multiple dimensions of money management.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (financial_rating === "outstanding") {
    headline =
      "Outstanding pocket money management and financial literacy — children's financial entitlements are protected, savings are encouraged, and comprehensive financial education prepares them for independence.";
  } else if (financial_rating === "good") {
    headline = `Good pocket money and financial literacy provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (financial_rating === "adequate") {
    headline = `Adequate pocket money and financial literacy provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's financial welfare and education are consistently supported.`;
  } else {
    headline = `Pocket money and financial literacy provision is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children's financial entitlements and build financial independence.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    financial_rating,
    financial_score: score,
    headline,
    total_pocket_money_records: totalPocketMoney,
    total_savings_programmes: totalSavings,
    total_financial_education_sessions: totalEducation,
    total_budgeting_records: totalBudgeting,
    total_money_handling_records: totalMoneyHandling,
    pocket_money_compliance_rate: pocketMoneyComplianceRate,
    savings_engagement_rate: savingsEngagementRate,
    financial_education_rate: financialEducationRate,
    budgeting_coverage_rate: budgetingCoverageRate,
    money_handling_accuracy_rate: moneyHandlingAccuracyRate,
    child_autonomy_rate: childAutonomyRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
