// ==============================================================================
// Cornerstone -- Pocket Money & Financial Literacy Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls, no randomness.
// Evaluates pocket money management, savings encouragement, financial
// education, and budgeting support for children in residential care.
//
// Aligned to:
//   - CHR 2015 Reg 10 -- Health and well-being (personal development)
//   - CHR 2015 Reg 14 -- Care planning (individual financial planning)
//   - SCCIF -- Social Care Common Inspection Framework
//   - NMS 3 -- Placement plan: covering pocket money arrangements
//   - UNCRC Article 27 -- Right to adequate standard of living
//   - Children Act 1989 -- Welfare and maintenance duties
//   - NMS 10 -- Enjoying and achieving (life skills development)
//
// Key requirements:
//   - Pocket money paid regularly at agreed frequency
//   - Receipts recorded for all expenditure
//   - Children sign off on pocket money received
//   - Savings encouraged with goals and accessible accounts
//   - Financial education sessions delivered across core topics
//   - Staff trained in pocket money policy, education, safeguarding
//   - Budgeting support provided to develop independence
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type PaymentFrequency = "weekly" | "fortnightly" | "monthly";

export type SpendingCategory =
  | "savings"
  | "personal_items"
  | "activities"
  | "food_treats"
  | "gifts"
  | "clothing"
  | "technology"
  | "other";

export type EducationTopic =
  | "budgeting"
  | "saving"
  | "banking"
  | "value_of_money"
  | "comparison_shopping"
  | "online_safety"
  | "debt_awareness";

export type SessionEngagement = "high" | "medium" | "low";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface PocketMoneyRecord {
  id: string;
  childId: string;
  childName: string;
  weekStarting: string;
  amountGiven: number;
  amountSaved: number;
  spendingCategories: SpendingCategory[];
  receiptRecorded: boolean;
  childSignedOff: boolean;
}

export interface SavingsAccount {
  id: string;
  childId: string;
  childName: string;
  accountType: "savings" | "current" | "junior_isa";
  balance: number;
  monthlyDeposits: number;
  savingsGoalSet: boolean;
  savingsGoalDescription?: string;
}

export interface FinancialEducationSession {
  id: string;
  date: string;
  facilitatedBy: string;
  topic: EducationTopic;
  childrenAttended: string[];
  engagement: SessionEngagement;
  resourcesProvided: boolean;
}

export interface StaffFinancialTraining {
  id: string;
  staffId: string;
  staffName: string;
  pocketMoneyPolicyTrained: boolean;
  financialEducationTrained: boolean;
  budgetingSupportTrained: boolean;
  safeguardingFinancialAbuse: boolean;
  recordKeepingTrained: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface PocketMoneyManagementResult {
  overallScore: number; // 0-25
  totalRecords: number;
  receiptRecordingRate: number; // %
  childSignOffRate: number; // %
  savingsParticipationRate: number; // %
  consistentPayments: boolean;
}

export interface SavingsEngagementResult {
  overallScore: number; // 0-25
  totalAccounts: number;
  accountsPerChild: number;
  savingsGoalRate: number; // %
  monthlyDepositRegularity: number; // %
  balanceDiversity: boolean;
}

export interface FinancialEducationResult {
  overallScore: number; // 0-25
  totalSessions: number;
  topicVariety: number; // % of topics covered
  engagementRate: number; // %
  resourcesProvidedRate: number; // %
  childrenReachedRate: number; // %
}

export interface StaffFinancialReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  policyTrainedRate: number; // %
  educationTrainedRate: number; // %
  budgetingSupportRate: number; // %
  safeguardingFinancialAbuseRate: number; // %
  recordKeepingRate: number; // %
}

export interface ChildFinancialSummary {
  childId: string;
  childName: string;
  totalPocketMoney: number;
  totalSaved: number;
  savingsRate: number; // %
  receiptRate: number; // %
  signOffRate: number; // %
  hasSavingsAccount: boolean;
  overallScore: number; // 0-10
}

export interface PocketMoneyFinancialLiteracyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  pocketMoneyManagement: PocketMoneyManagementResult;
  savingsEngagement: SavingsEngagementResult;
  financialEducation: FinancialEducationResult;
  staffFinancialReadiness: StaffFinancialReadinessResult;
  childFinancialSummaries: ChildFinancialSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps & Getters -----------------------------------------------------

const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
};

const SPENDING_CATEGORY_LABELS: Record<SpendingCategory, string> = {
  savings: "Savings",
  personal_items: "Personal Items",
  activities: "Activities",
  food_treats: "Food & Treats",
  gifts: "Gifts",
  clothing: "Clothing",
  technology: "Technology",
  other: "Other",
};

const EDUCATION_TOPIC_LABELS: Record<EducationTopic, string> = {
  budgeting: "Budgeting",
  saving: "Saving",
  banking: "Banking",
  value_of_money: "Value of Money",
  comparison_shopping: "Comparison Shopping",
  online_safety: "Online Safety",
  debt_awareness: "Debt Awareness",
};

const SESSION_ENGAGEMENT_LABELS: Record<SessionEngagement, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getPaymentFrequencyLabel(freq: PaymentFrequency): string {
  return PAYMENT_FREQUENCY_LABELS[freq] || freq;
}

export function getSpendingCategoryLabel(cat: SpendingCategory): string {
  return SPENDING_CATEGORY_LABELS[cat] || cat;
}

export function getEducationTopicLabel(topic: EducationTopic): string {
  return EDUCATION_TOPIC_LABELS[topic] || topic;
}

export function getSessionEngagementLabel(eng: SessionEngagement): string {
  return SESSION_ENGAGEMENT_LABELS[eng] || eng;
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating] || rating;
}

// -- All topics constant (for coverage calculation) ---------------------------

const ALL_EDUCATION_TOPICS: EducationTopic[] = [
  "budgeting",
  "saving",
  "banking",
  "value_of_money",
  "comparison_shopping",
  "online_safety",
  "debt_awareness",
];

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluate pocket money management quality (0-25).
 *
 * Scoring:
 *   receipt recording rate      -> 0-7
 *   child sign-off rate         -> 0-7
 *   savings participation rate  -> 0-6
 *   consistent payments         -> 0-5
 *
 * Empty data = 0.
 */
export function evaluatePocketMoneyManagement(
  records: PocketMoneyRecord[],
): PocketMoneyManagementResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      receiptRecordingRate: 0,
      childSignOffRate: 0,
      savingsParticipationRate: 0,
      consistentPayments: false,
    };
  }

  const withReceipt = records.filter((r) => r.receiptRecorded);
  const withSignOff = records.filter((r) => r.childSignedOff);
  const withSavings = records.filter((r) => r.amountSaved > 0);

  const receiptRecordingRate = pct(withReceipt.length, records.length);
  const childSignOffRate = pct(withSignOff.length, records.length);
  const savingsParticipationRate = pct(withSavings.length, records.length);

  // Consistent payments: check that all children with records have multiple entries
  const childRecordCounts = new Map<string, number>();
  for (const r of records) {
    childRecordCounts.set(r.childId, (childRecordCounts.get(r.childId) || 0) + 1);
  }
  const consistentPayments = Array.from(childRecordCounts.values()).every(
    (count) => count >= 2,
  );

  // Scoring
  const receiptScore = Math.round((receiptRecordingRate / 100) * 7);
  const signOffScore = Math.round((childSignOffRate / 100) * 7);
  const savingsScore = Math.round((savingsParticipationRate / 100) * 6);
  const consistencyScore = consistentPayments ? 5 : 2;

  const overallScore = Math.min(
    25,
    Math.max(0, receiptScore + signOffScore + savingsScore + consistencyScore),
  );

  return {
    overallScore,
    totalRecords: records.length,
    receiptRecordingRate,
    childSignOffRate,
    savingsParticipationRate,
    consistentPayments,
  };
}

/**
 * Evaluate savings engagement (0-25).
 *
 * Scoring:
 *   accounts per child (>= 1 = good)  -> 0-6
 *   savings goal rate                  -> 0-7
 *   monthly deposit regularity         -> 0-7
 *   balance diversity                  -> 0-5
 *
 * Empty data = 0.
 */
export function evaluateSavingsEngagement(
  accounts: SavingsAccount[],
): SavingsEngagementResult {
  if (accounts.length === 0) {
    return {
      overallScore: 0,
      totalAccounts: 0,
      accountsPerChild: 0,
      savingsGoalRate: 0,
      monthlyDepositRegularity: 0,
      balanceDiversity: false,
    };
  }

  // Unique children
  const uniqueChildren = new Set(accounts.map((a) => a.childId));
  const accountsPerChild =
    Math.round((accounts.length / uniqueChildren.size) * 100) / 100;

  const withGoal = accounts.filter((a) => a.savingsGoalSet);
  const withDeposits = accounts.filter((a) => a.monthlyDeposits > 0);

  const savingsGoalRate = pct(withGoal.length, accounts.length);
  const monthlyDepositRegularity = pct(withDeposits.length, accounts.length);

  // Balance diversity: check that balances are not all zero and at least 2 different balances
  const balances = new Set(accounts.map((a) => a.balance));
  const balanceDiversity = balances.size >= 2 && !accounts.every((a) => a.balance === 0);

  // Scoring
  const accountScore = accountsPerChild >= 1 ? 6 : Math.round(accountsPerChild * 6);
  const goalScore = Math.round((savingsGoalRate / 100) * 7);
  const depositScore = Math.round((monthlyDepositRegularity / 100) * 7);
  const diversityScore = balanceDiversity ? 5 : 0;

  const overallScore = Math.min(
    25,
    Math.max(0, accountScore + goalScore + depositScore + diversityScore),
  );

  return {
    overallScore,
    totalAccounts: accounts.length,
    accountsPerChild,
    savingsGoalRate,
    monthlyDepositRegularity,
    balanceDiversity,
  };
}

/**
 * Evaluate financial education provision (0-25).
 *
 * Scoring:
 *   topic variety               -> 0-7
 *   engagement rate (high)      -> 0-6
 *   resources provided rate     -> 0-6
 *   children reached rate       -> 0-6
 *
 * Empty data = 0.
 */
export function evaluateFinancialEducation(
  sessions: FinancialEducationSession[],
  totalChildren: number,
): FinancialEducationResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      topicVariety: 0,
      engagementRate: 0,
      resourcesProvidedRate: 0,
      childrenReachedRate: 0,
    };
  }

  // Topic variety
  const topicsCovered = new Set(sessions.map((s) => s.topic));
  const topicVariety = pct(topicsCovered.size, ALL_EDUCATION_TOPICS.length);

  // Engagement rate: sessions with high engagement
  const highEngagement = sessions.filter((s) => s.engagement === "high");
  const engagementRate = pct(highEngagement.length, sessions.length);

  // Resources provided rate
  const withResources = sessions.filter((s) => s.resourcesProvided);
  const resourcesProvidedRate = pct(withResources.length, sessions.length);

  // Children reached rate: unique children who attended at least one session
  const childrenReached = new Set<string>();
  for (const s of sessions) {
    for (const c of s.childrenAttended) {
      childrenReached.add(c);
    }
  }
  const childrenReachedRate =
    totalChildren > 0 ? pct(childrenReached.size, totalChildren) : 0;

  // Scoring
  const topicScore = Math.round((topicVariety / 100) * 7);
  const engagementScore = Math.round((engagementRate / 100) * 6);
  const resourcesScore = Math.round((resourcesProvidedRate / 100) * 6);
  const reachedScore = Math.round((childrenReachedRate / 100) * 6);

  const overallScore = Math.min(
    25,
    Math.max(0, topicScore + engagementScore + resourcesScore + reachedScore),
  );

  return {
    overallScore,
    totalSessions: sessions.length,
    topicVariety,
    engagementRate,
    resourcesProvidedRate,
    childrenReachedRate,
  };
}

/**
 * Evaluate staff financial readiness (0-25).
 *
 * Scoring:
 *   policy trained rate                   -> 0-5
 *   financial education trained rate      -> 0-5
 *   budgeting support trained rate        -> 0-5
 *   safeguarding financial abuse rate     -> 0-5
 *   record keeping trained rate           -> 0-5
 *
 * Empty data = 0.
 */
export function evaluateStaffFinancialReadiness(
  training: StaffFinancialTraining[],
): StaffFinancialReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      policyTrainedRate: 0,
      educationTrainedRate: 0,
      budgetingSupportRate: 0,
      safeguardingFinancialAbuseRate: 0,
      recordKeepingRate: 0,
    };
  }

  const policyTrained = training.filter((t) => t.pocketMoneyPolicyTrained);
  const educationTrained = training.filter((t) => t.financialEducationTrained);
  const budgetingTrained = training.filter((t) => t.budgetingSupportTrained);
  const safeguardingTrained = training.filter(
    (t) => t.safeguardingFinancialAbuse,
  );
  const recordKeepingTrained = training.filter((t) => t.recordKeepingTrained);

  const policyTrainedRate = pct(policyTrained.length, training.length);
  const educationTrainedRate = pct(educationTrained.length, training.length);
  const budgetingSupportRate = pct(budgetingTrained.length, training.length);
  const safeguardingFinancialAbuseRate = pct(
    safeguardingTrained.length,
    training.length,
  );
  const recordKeepingRate = pct(recordKeepingTrained.length, training.length);

  // Scoring
  const policyScore = Math.round((policyTrainedRate / 100) * 5);
  const educationScore = Math.round((educationTrainedRate / 100) * 5);
  const budgetingScore = Math.round((budgetingSupportRate / 100) * 5);
  const safeguardingScore = Math.round(
    (safeguardingFinancialAbuseRate / 100) * 5,
  );
  const recordKeepingScore = Math.round((recordKeepingRate / 100) * 5);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      policyScore +
        educationScore +
        budgetingScore +
        safeguardingScore +
        recordKeepingScore,
    ),
  );

  return {
    overallScore,
    totalStaff: training.length,
    policyTrainedRate,
    educationTrainedRate,
    budgetingSupportRate,
    safeguardingFinancialAbuseRate,
    recordKeepingRate,
  };
}

// -- Build Child Financial Summaries ------------------------------------------

export function buildChildFinancialSummaries(
  records: PocketMoneyRecord[],
  accounts: SavingsAccount[],
): ChildFinancialSummary[] {
  // Get unique children from records
  const childIds = [...new Set(records.map((r) => r.childId))];

  return childIds.map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childAccounts = accounts.filter((a) => a.childId === childId);

    const childName = childRecords[0]?.childName ?? "Unknown";
    const totalPocketMoney = childRecords.reduce(
      (sum, r) => sum + r.amountGiven,
      0,
    );
    const totalSaved = childRecords.reduce(
      (sum, r) => sum + r.amountSaved,
      0,
    );

    const savingsRate = pct(totalSaved, totalPocketMoney);

    const withReceipt = childRecords.filter((r) => r.receiptRecorded);
    const receiptRate = pct(withReceipt.length, childRecords.length);

    const withSignOff = childRecords.filter((r) => r.childSignedOff);
    const signOffRate = pct(withSignOff.length, childRecords.length);

    const hasSavingsAccount = childAccounts.length > 0;

    // Score (0-10):
    //   savings rate contribution  -> 0-3
    //   receipt rate contribution  -> 0-2
    //   sign-off rate contribution -> 0-2
    //   has savings account        -> 2
    //   has savings goal           -> 1
    let score = 0;
    score += Math.round((savingsRate / 100) * 3);
    score += Math.round((receiptRate / 100) * 2);
    score += Math.round((signOffRate / 100) * 2);
    if (hasSavingsAccount) score += 2;
    if (childAccounts.some((a) => a.savingsGoalSet)) score += 1;

    return {
      childId,
      childName,
      totalPocketMoney: Math.round(totalPocketMoney * 100) / 100,
      totalSaved: Math.round(totalSaved * 100) / 100,
      savingsRate,
      receiptRate,
      signOffRate,
      hasSavingsAccount,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// -- Main Intelligence Function -----------------------------------------------

export function generatePocketMoneyFinancialLiteracyIntelligence(
  records: PocketMoneyRecord[],
  accounts: SavingsAccount[],
  sessions: FinancialEducationSession[],
  training: StaffFinancialTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PocketMoneyFinancialLiteracyIntelligence {
  // Derive total unique children from records + accounts
  const allChildIds = new Set([
    ...records.map((r) => r.childId),
    ...accounts.map((a) => a.childId),
  ]);
  const totalChildren = allChildIds.size;

  const pocketMoneyManagement = evaluatePocketMoneyManagement(records);
  const savingsEngagement = evaluateSavingsEngagement(accounts);
  const financialEducation = evaluateFinancialEducation(sessions, totalChildren);
  const staffFinancialReadiness = evaluateStaffFinancialReadiness(training);

  const childFinancialSummaries = buildChildFinancialSummaries(
    records,
    accounts,
  );

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      pocketMoneyManagement.overallScore +
        savingsEngagement.overallScore +
        financialEducation.overallScore +
        staffFinancialReadiness.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // -- Strengths --
  const strengths: string[] = [];

  if (records.length === 0 && accounts.length === 0 && sessions.length === 0 && training.length === 0) {
    // No strengths when everything is empty
  } else {
    if (pocketMoneyManagement.overallScore >= 20) {
      strengths.push(
        "Pocket money management is excellent with strong receipt recording, child sign-off and savings participation",
      );
    }
    if (savingsEngagement.overallScore >= 20) {
      strengths.push(
        "Savings engagement is strong with active accounts, clear goals and regular deposits across all children",
      );
    }
    if (financialEducation.overallScore >= 20) {
      strengths.push(
        "Financial education programme is comprehensive with broad topic coverage and high engagement",
      );
    }
    if (staffFinancialReadiness.overallScore >= 20) {
      strengths.push(
        "Staff are well-trained across all financial competencies including safeguarding and record keeping",
      );
    }
    if (pocketMoneyManagement.receiptRecordingRate >= 95 && records.length > 0) {
      strengths.push(
        "Receipt recording is excellent, providing clear audit trails for all pocket money transactions",
      );
    }
    if (pocketMoneyManagement.childSignOffRate >= 95 && records.length > 0) {
      strengths.push(
        "Children consistently sign off on pocket money received, demonstrating informed participation",
      );
    }
    if (pocketMoneyManagement.savingsParticipationRate >= 80 && records.length > 0) {
      strengths.push(
        "High proportion of children actively save from their pocket money, building positive financial habits",
      );
    }
    if (pocketMoneyManagement.consistentPayments && records.length > 0) {
      strengths.push(
        "Pocket money payments are consistent across all children, providing reliability and security",
      );
    }
    if (savingsEngagement.savingsGoalRate >= 80 && accounts.length > 0) {
      strengths.push(
        "Most children have savings goals set, encouraging purposeful saving and financial planning",
      );
    }
    if (savingsEngagement.monthlyDepositRegularity >= 80 && accounts.length > 0) {
      strengths.push(
        "Regular monthly deposits demonstrate sustained saving habits across the home",
      );
    }
    if (financialEducation.topicVariety >= 75 && sessions.length > 0) {
      strengths.push(
        "Financial education covers a wide range of topics preparing children for independent living",
      );
    }
    if (financialEducation.resourcesProvidedRate >= 90 && sessions.length > 0) {
      strengths.push(
        "Educational resources are consistently provided to support children's financial learning",
      );
    }
    if (financialEducation.childrenReachedRate === 100 && sessions.length > 0) {
      strengths.push(
        "All children in the home have participated in financial education sessions",
      );
    }
    if (staffFinancialReadiness.safeguardingFinancialAbuseRate === 100 && training.length > 0) {
      strengths.push(
        "All staff are trained in safeguarding against financial abuse, protecting children's financial wellbeing",
      );
    }
    if (staffFinancialReadiness.recordKeepingRate === 100 && training.length > 0) {
      strengths.push(
        "All staff are trained in financial record keeping, supporting accurate and transparent accounting",
      );
    }
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];

  if (records.length === 0) {
    areasForImprovement.push(
      "URGENT: No pocket money records found -- pocket money must be recorded and tracked for all children",
    );
  }
  if (accounts.length === 0) {
    areasForImprovement.push(
      "URGENT: No savings accounts found -- each child should have access to a savings account",
    );
  }
  if (sessions.length === 0) {
    areasForImprovement.push(
      "URGENT: No financial education sessions recorded -- children must receive regular financial literacy education",
    );
  }
  if (training.length === 0) {
    areasForImprovement.push(
      "URGENT: No staff financial training records -- all staff must be trained in pocket money policy and financial education",
    );
  }
  if (pocketMoneyManagement.receiptRecordingRate < 90 && records.length > 0) {
    areasForImprovement.push(
      `Receipt recording at ${pocketMoneyManagement.receiptRecordingRate}% -- all pocket money transactions must have receipts recorded`,
    );
  }
  if (pocketMoneyManagement.childSignOffRate < 90 && records.length > 0) {
    areasForImprovement.push(
      `Child sign-off rate at ${pocketMoneyManagement.childSignOffRate}% -- children must sign off on all pocket money received`,
    );
  }
  if (pocketMoneyManagement.savingsParticipationRate < 60 && records.length > 0) {
    areasForImprovement.push(
      `Only ${pocketMoneyManagement.savingsParticipationRate}% of pocket money records include savings -- children should be encouraged to save regularly`,
    );
  }
  if (!pocketMoneyManagement.consistentPayments && records.length > 0) {
    areasForImprovement.push(
      "Pocket money payments are not consistent for all children -- regular payments must be maintained",
    );
  }
  if (savingsEngagement.savingsGoalRate < 70 && accounts.length > 0) {
    areasForImprovement.push(
      `Only ${savingsEngagement.savingsGoalRate}% of savings accounts have goals set -- all children should have savings goals`,
    );
  }
  if (savingsEngagement.monthlyDepositRegularity < 70 && accounts.length > 0) {
    areasForImprovement.push(
      `Monthly deposit regularity at ${savingsEngagement.monthlyDepositRegularity}% -- regular deposits should be encouraged for all accounts`,
    );
  }
  if (financialEducation.topicVariety < 50 && sessions.length > 0) {
    areasForImprovement.push(
      `Only ${financialEducation.topicVariety}% of financial education topics covered -- broader curriculum needed`,
    );
  }
  if (financialEducation.engagementRate < 70 && sessions.length > 0) {
    areasForImprovement.push(
      `High engagement rate at only ${financialEducation.engagementRate}% -- sessions should be more interactive and engaging`,
    );
  }
  if (financialEducation.resourcesProvidedRate < 80 && sessions.length > 0) {
    areasForImprovement.push(
      `Resources provided in only ${financialEducation.resourcesProvidedRate}% of sessions -- educational materials should be provided consistently`,
    );
  }
  if (financialEducation.childrenReachedRate < 80 && sessions.length > 0) {
    areasForImprovement.push(
      `Only ${financialEducation.childrenReachedRate}% of children have attended financial education sessions -- all children must be included`,
    );
  }
  if (staffFinancialReadiness.policyTrainedRate < 100 && training.length > 0) {
    areasForImprovement.push(
      `Only ${staffFinancialReadiness.policyTrainedRate}% of staff trained in pocket money policy -- all staff must complete this training`,
    );
  }
  if (staffFinancialReadiness.safeguardingFinancialAbuseRate < 100 && training.length > 0) {
    areasForImprovement.push(
      `Only ${staffFinancialReadiness.safeguardingFinancialAbuseRate}% of staff trained in safeguarding against financial abuse -- this is a critical safeguarding requirement`,
    );
  }
  if (staffFinancialReadiness.recordKeepingRate < 100 && training.length > 0) {
    areasForImprovement.push(
      `Only ${staffFinancialReadiness.recordKeepingRate}% of staff trained in financial record keeping -- accurate records are essential for accountability`,
    );
  }

  // -- Actions --
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push(
      "URGENT: Implement pocket money recording system immediately -- all payments must be documented with receipts and child sign-off",
    );
  }
  if (accounts.length === 0) {
    actions.push(
      "URGENT: Open savings accounts for all children and set up savings goals with each child as part of their care plan",
    );
  }
  if (sessions.length === 0) {
    actions.push(
      "URGENT: Develop and deliver a financial education programme covering budgeting, saving, banking and money management",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: Arrange financial training for all staff covering pocket money policy, education delivery, safeguarding and record keeping",
    );
  }
  if (pocketMoneyManagement.receiptRecordingRate < 90 && records.length > 0) {
    actions.push(
      "Implement a receipt recording protocol requiring staff to document all pocket money transactions at point of payment",
    );
  }
  if (pocketMoneyManagement.childSignOffRate < 90 && records.length > 0) {
    actions.push(
      "Establish a child sign-off procedure ensuring children acknowledge receipt of pocket money each payment period",
    );
  }
  if (pocketMoneyManagement.savingsParticipationRate < 60 && records.length > 0) {
    actions.push(
      "Work with each child to develop a savings plan as part of their key-work sessions, encouraging regular saving",
    );
  }
  if (!pocketMoneyManagement.consistentPayments && records.length > 0) {
    actions.push(
      "Review pocket money payment schedules and ensure all children receive consistent payments at agreed frequency",
    );
  }
  if (savingsEngagement.savingsGoalRate < 70 && accounts.length > 0) {
    actions.push(
      "Support each child to set a meaningful savings goal and review progress in key-work sessions",
    );
  }
  if (savingsEngagement.monthlyDepositRegularity < 70 && accounts.length > 0) {
    actions.push(
      "Encourage regular monthly deposits by integrating saving discussions into key-work sessions and pocket money conversations",
    );
  }
  if (financialEducation.topicVariety < 50 && sessions.length > 0) {
    actions.push(
      "Expand financial education curriculum to include all core topics: budgeting, saving, banking, value of money, comparison shopping, online safety and debt awareness",
    );
  }
  if (financialEducation.engagementRate < 70 && sessions.length > 0) {
    actions.push(
      "Review financial education delivery to increase engagement through interactive activities, real-world scenarios and age-appropriate resources",
    );
  }
  if (financialEducation.childrenReachedRate < 80 && sessions.length > 0) {
    actions.push(
      "Ensure all children are included in financial education sessions, with individualised support where needed",
    );
  }
  if (staffFinancialReadiness.policyTrainedRate < 100 && training.length > 0) {
    actions.push(
      "Schedule pocket money policy training for all untrained staff within the next 30 days",
    );
  }
  if (staffFinancialReadiness.safeguardingFinancialAbuseRate < 100 && training.length > 0) {
    actions.push(
      "Prioritise safeguarding financial abuse training for all untrained staff -- this is a critical safeguarding requirement",
    );
  }
  if (staffFinancialReadiness.recordKeepingRate < 100 && training.length > 0) {
    actions.push(
      "Deliver record keeping training to all untrained staff to ensure accurate and transparent financial documentation",
    );
  }

  // -- Regulatory Links --
  const regulatoryLinks = [
    "CHR 2015 Reg 10 -- Health and well-being: supporting children's personal development including financial capability",
    "CHR 2015 Reg 14 -- Care planning: individual plans must include financial arrangements and pocket money",
    "SCCIF -- Social Care Common Inspection Framework: children's experiences, progress and development",
    "NMS 3 -- Placement plan: pocket money arrangements and savings encouragement",
    "UNCRC Article 27 -- Right to an adequate standard of living for physical, mental and social development",
    "Children Act 1989 -- Welfare and maintenance duties for looked-after children",
    "NMS 10 -- Enjoying and achieving: developing life skills including financial literacy",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    pocketMoneyManagement,
    savingsEngagement,
    financialEducation,
    staffFinancialReadiness,
    childFinancialSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
