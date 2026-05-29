// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAVINGS & BANKING SKILLS INTELLIGENCE ENGINE
// Home-level: assesses savings account management, banking skills development,
// financial goal tracking, money confidence building, and age-appropriate
// financial independence across all children on placement.
// CHR 2015 Reg 5 (Engaging with the wider community), Reg 7 (Protection of
// children). SCCIF: "Experiences and progress of children and young people."
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: savingsAccountRecords, bankingSkillsRecords, financialGoalRecords,
//             moneyConfidenceRecords, financialIndependenceRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SavingsAccountRecordInput {
  id: string;
  child_id: string;
  account_type: "savings" | "junior_isa" | "current" | "credit_union" | "other";
  opened_date: string;
  child_is_named_holder: boolean;
  child_has_access: boolean;
  current_balance: number;
  monthly_deposit_target: number;
  deposits_made_this_quarter: number;
  deposits_target_this_quarter: number;
  interest_earned: number;
  statements_reviewed_with_child: boolean;
  child_understands_account: boolean;
  staff_supported_opening: boolean;
  last_activity_date: string;
  dormant: boolean;
  notes: string;
  created_at: string;
}

export interface BankingSkillsRecordInput {
  id: string;
  child_id: string;
  date: string;
  skill_type: "atm_use" | "online_banking" | "budgeting" | "reading_statements" | "direct_debit" | "card_management" | "fraud_awareness" | "comparison_shopping" | "other";
  taught: boolean;
  demonstrated_competence: boolean;
  age_appropriate: boolean;
  staff_assessed: boolean;
  child_confident: boolean;
  practice_opportunity_given: boolean;
  linked_to_independence_plan: boolean;
  notes: string;
  created_at: string;
}

export interface FinancialGoalRecordInput {
  id: string;
  child_id: string;
  goal_description: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  status: "active" | "achieved" | "abandoned" | "paused";
  child_set_goal: boolean;
  child_tracking_progress: boolean;
  staff_supporting: boolean;
  reviewed_in_keywork: boolean;
  celebration_on_achievement: boolean;
  notes: string;
  created_at: string;
}

export interface MoneyConfidenceRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "self_report" | "staff_observation" | "keywork_discussion" | "formal_assessment" | "other";
  confidence_level: number; // 1-5
  understands_value_of_money: boolean;
  can_make_purchases_independently: boolean;
  can_budget_pocket_money: boolean;
  can_compare_prices: boolean;
  can_identify_needs_vs_wants: boolean;
  anxiety_around_money: boolean;
  previous_confidence_level: number; // 1-5 or 0 if first
  improvement_noted: boolean;
  support_plan_in_place: boolean;
  notes: string;
  created_at: string;
}

export interface FinancialIndependenceRecordInput {
  id: string;
  child_id: string;
  date: string;
  milestone_type: "first_purchase_alone" | "manages_weekly_budget" | "uses_bank_independently" | "pays_bill_with_support" | "opens_account" | "sets_savings_goal" | "manages_phone_contract" | "travel_card_management" | "online_purchase_safely" | "other";
  achieved: boolean;
  age_appropriate: boolean;
  child_initiated: boolean;
  staff_supported: boolean;
  documented_in_pathway_plan: boolean;
  linked_to_leaving_care: boolean;
  child_proud_of_achievement: boolean;
  next_milestone_identified: boolean;
  notes: string;
  created_at: string;
}

export interface SavingsBankingInput {
  today: string;
  total_children: number;
  savings_account_records: SavingsAccountRecordInput[];
  banking_skills_records: BankingSkillsRecordInput[];
  financial_goal_records: FinancialGoalRecordInput[];
  money_confidence_records: MoneyConfidenceRecordInput[];
  financial_independence_records: FinancialIndependenceRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SavingsBankingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SavingsBankingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SavingsBankingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SavingsBankingResult {
  savings_rating: SavingsBankingRating;
  savings_score: number;
  headline: string;
  total_savings_accounts: number;
  total_banking_skills: number;
  total_financial_goals: number;
  total_confidence_assessments: number;
  total_independence_milestones: number;
  savings_account_rate: number;
  banking_skills_rate: number;
  financial_goal_rate: number;
  money_confidence_rate: number;
  financial_independence_rate: number;
  child_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SavingsBankingRecommendation[];
  insights: SavingsBankingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SavingsBankingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SavingsBankingRating,
  score: number,
  headline: string,
): SavingsBankingResult {
  return {
    savings_rating: rating,
    savings_score: score,
    headline,
    total_savings_accounts: 0,
    total_banking_skills: 0,
    total_financial_goals: 0,
    total_confidence_assessments: 0,
    total_independence_milestones: 0,
    savings_account_rate: 0,
    banking_skills_rate: 0,
    financial_goal_rate: 0,
    money_confidence_rate: 0,
    financial_independence_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSavingsBankingSkills(
  input: SavingsBankingInput,
): SavingsBankingResult {
  const {
    total_children,
    savings_account_records,
    banking_skills_records,
    financial_goal_records,
    money_confidence_records,
    financial_independence_records,
  } = input;

  // ── Special case: all empty + 0 children = insufficient_data ──────────
  const allEmpty =
    savings_account_records.length === 0 &&
    banking_skills_records.length === 0 &&
    financial_goal_records.length === 0 &&
    money_confidence_records.length === 0 &&
    financial_independence_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess savings and banking skills.",
    );
  }

  // ── Special case: all empty + children > 0 = inadequate/15 ────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No savings or banking skills data recorded despite children on placement — savings support and financial skills development require urgent attention.",
      ),
      concerns: [
        "No savings account records, banking skills assessments, financial goals, money confidence assessments, or financial independence milestones exist despite children being on placement — the home cannot evidence that children are being supported to develop savings habits or banking skills.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of savings accounts, banking skills development, financial goals, money confidence assessments, and financial independence milestones to evidence children's financial development and preparation for independence.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has access to an age-appropriate savings account and receives banking skills education as part of their independence preparation — this is a fundamental aspect of care quality.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
        },
      ],
      insights: [
        {
          text: "The complete absence of savings and banking skills records means the home cannot demonstrate that children are being supported to understand money, develop savings habits, or build the financial skills needed for independence. This represents a significant gap in children's experiences and progress.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── CORE METRICS ──────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Savings account metrics ────────────────────────────────────────
  const totalSavingsAccounts = savings_account_records.length;

  // Unique children with savings accounts
  const childrenWithAccounts = new Set(
    savings_account_records.map((r) => r.child_id),
  ).size;
  const savingsAccountCoverage = pct(childrenWithAccounts, total_children);

  // Children who are named holders
  const namedHolders = savings_account_records.filter(
    (r) => r.child_is_named_holder,
  ).length;
  const namedHolderRate = pct(namedHolders, totalSavingsAccounts);

  // Children who have access to their account
  const childHasAccess = savings_account_records.filter(
    (r) => r.child_has_access,
  ).length;
  const childAccessRate = pct(childHasAccess, totalSavingsAccounts);

  // Accounts where child understands the account
  const childUnderstands = savings_account_records.filter(
    (r) => r.child_understands_account,
  ).length;
  const childUnderstandsRate = pct(childUnderstands, totalSavingsAccounts);

  // Statements reviewed with child
  const statementsReviewed = savings_account_records.filter(
    (r) => r.statements_reviewed_with_child,
  ).length;
  const statementsReviewedRate = pct(statementsReviewed, totalSavingsAccounts);

  // Deposit target compliance (deposits_made vs deposits_target this quarter)
  const totalDepositsMade = savings_account_records.reduce(
    (sum, r) => sum + r.deposits_made_this_quarter,
    0,
  );
  const totalDepositsTarget = savings_account_records.reduce(
    (sum, r) => sum + r.deposits_target_this_quarter,
    0,
  );
  const depositComplianceRate = pct(totalDepositsMade, totalDepositsTarget);

  // Dormant accounts
  const dormantAccounts = savings_account_records.filter(
    (r) => r.dormant,
  ).length;
  const dormantRate = pct(dormantAccounts, totalSavingsAccounts);

  // Staff supported opening
  const staffSupportedOpening = savings_account_records.filter(
    (r) => r.staff_supported_opening,
  ).length;
  const staffSupportedOpeningRate = pct(staffSupportedOpening, totalSavingsAccounts);

  // Composite savings_account_rate: average of coverage, named holder rate, child access, child understands
  const savingsAccountRate =
    totalSavingsAccounts > 0
      ? Math.round(
          (savingsAccountCoverage + namedHolderRate + childAccessRate + childUnderstandsRate) / 4,
        )
      : 0;

  // ── 2. Banking skills metrics ─────────────────────────────────────────
  const totalBankingSkills = banking_skills_records.length;

  // Unique children with banking skills records
  const childrenWithBankingSkills = new Set(
    banking_skills_records.map((r) => r.child_id),
  ).size;
  const bankingSkillsCoverage = pct(childrenWithBankingSkills, total_children);

  // Taught and demonstrated competence
  const skillsTaught = banking_skills_records.filter((r) => r.taught).length;
  const skillsTaughtRate = pct(skillsTaught, totalBankingSkills);

  const competenceDemonstrated = banking_skills_records.filter(
    (r) => r.taught && r.demonstrated_competence,
  ).length;
  const competenceRate = pct(competenceDemonstrated, totalBankingSkills);

  // Age-appropriate skills
  const ageAppropriateSkills = banking_skills_records.filter(
    (r) => r.age_appropriate,
  ).length;
  const ageAppropriateRate = pct(ageAppropriateSkills, totalBankingSkills);

  // Child confident
  const childConfidentSkills = banking_skills_records.filter(
    (r) => r.taught && r.child_confident,
  ).length;
  const childConfidentRate = pct(childConfidentSkills, totalBankingSkills);

  // Practice opportunities given
  const practiceGiven = banking_skills_records.filter(
    (r) => r.practice_opportunity_given,
  ).length;
  const practiceGivenRate = pct(practiceGiven, totalBankingSkills);

  // Staff assessed
  const staffAssessed = banking_skills_records.filter(
    (r) => r.staff_assessed,
  ).length;
  const staffAssessedRate = pct(staffAssessed, totalBankingSkills);

  // Linked to independence plan
  const linkedToIndPlan = banking_skills_records.filter(
    (r) => r.linked_to_independence_plan,
  ).length;
  const linkedToIndPlanRate = pct(linkedToIndPlan, totalBankingSkills);

  // Composite banking_skills_rate: average of coverage, competence, confidence, practice given
  const bankingSkillsRate =
    totalBankingSkills > 0
      ? Math.round(
          (bankingSkillsCoverage + competenceRate + childConfidentRate + practiceGivenRate) / 4,
        )
      : 0;

  // Unique skill types per child (breadth)
  const skillTypesPerChild: Record<string, Set<string>> = {};
  for (const r of banking_skills_records) {
    if (!skillTypesPerChild[r.child_id]) {
      skillTypesPerChild[r.child_id] = new Set();
    }
    if (r.taught) {
      skillTypesPerChild[r.child_id].add(r.skill_type);
    }
  }
  const avgSkillBreadth =
    childrenWithBankingSkills > 0
      ? Math.round(
          Object.values(skillTypesPerChild).reduce((s, set) => s + set.size, 0) /
            childrenWithBankingSkills,
        )
      : 0;

  // ── 3. Financial goal metrics ─────────────────────────────────────────
  const totalFinancialGoals = financial_goal_records.length;

  // Unique children with financial goals
  const childrenWithGoals = new Set(
    financial_goal_records.map((r) => r.child_id),
  ).size;
  const goalCoverage = pct(childrenWithGoals, total_children);

  // Active goals
  const activeGoals = financial_goal_records.filter(
    (r) => r.status === "active",
  ).length;
  const activeGoalRate = pct(activeGoals, totalFinancialGoals);

  // Achieved goals
  const achievedGoals = financial_goal_records.filter(
    (r) => r.status === "achieved",
  ).length;
  const achievedGoalRate = pct(achievedGoals, totalFinancialGoals);

  // Abandoned goals
  const abandonedGoals = financial_goal_records.filter(
    (r) => r.status === "abandoned",
  ).length;
  const abandonedGoalRate = pct(abandonedGoals, totalFinancialGoals);

  // Child set the goal themselves
  const childSetGoal = financial_goal_records.filter(
    (r) => r.child_set_goal,
  ).length;
  const childSetGoalRate = pct(childSetGoal, totalFinancialGoals);

  // Child tracking progress
  const childTrackingProgress = financial_goal_records.filter(
    (r) => r.child_tracking_progress && (r.status === "active" || r.status === "achieved"),
  ).length;
  const childTrackingRate = pct(
    childTrackingProgress,
    financial_goal_records.filter((r) => r.status === "active" || r.status === "achieved").length,
  );

  // Reviewed in keywork
  const reviewedInKeywork = financial_goal_records.filter(
    (r) => r.reviewed_in_keywork,
  ).length;
  const reviewedInKeyworkRate = pct(reviewedInKeywork, totalFinancialGoals);

  // Celebrations on achievement
  const celebrationsHeld = financial_goal_records.filter(
    (r) => r.status === "achieved" && r.celebration_on_achievement,
  ).length;
  const celebrationRate = pct(celebrationsHeld, achievedGoals);

  // Staff supporting
  const staffSupportingGoals = financial_goal_records.filter(
    (r) => r.staff_supporting,
  ).length;
  const staffSupportingGoalRate = pct(staffSupportingGoals, totalFinancialGoals);

  // Progress towards active goals
  const activeGoalRecords = financial_goal_records.filter(
    (r) => r.status === "active" && r.target_amount > 0,
  );
  const avgGoalProgress =
    activeGoalRecords.length > 0
      ? Math.round(
          activeGoalRecords.reduce(
            (sum, r) => sum + Math.min(pct(r.current_amount, r.target_amount), 100),
            0,
          ) / activeGoalRecords.length,
        )
      : 0;

  // Composite financial_goal_rate: average of coverage, child set goal rate, child tracking rate, reviewed in keywork
  const financialGoalRate =
    totalFinancialGoals > 0
      ? Math.round(
          (goalCoverage + childSetGoalRate + childTrackingRate + reviewedInKeyworkRate) / 4,
        )
      : 0;

  // ── 4. Money confidence metrics ───────────────────────────────────────
  const totalConfidenceAssessments = money_confidence_records.length;

  // Unique children with confidence assessments
  const childrenWithConfidence = new Set(
    money_confidence_records.map((r) => r.child_id),
  ).size;
  const confidenceCoverage = pct(childrenWithConfidence, total_children);

  // Average confidence level (1-5)
  const avgConfidenceLevel =
    totalConfidenceAssessments > 0
      ? Math.round(
          (money_confidence_records.reduce((sum, r) => sum + r.confidence_level, 0) /
            totalConfidenceAssessments) *
            100,
        ) / 100
      : 0;

  // Children understanding value of money
  const understandsValue = money_confidence_records.filter(
    (r) => r.understands_value_of_money,
  ).length;
  const understandsValueRate = pct(understandsValue, totalConfidenceAssessments);

  // Can make purchases independently
  const canPurchase = money_confidence_records.filter(
    (r) => r.can_make_purchases_independently,
  ).length;
  const canPurchaseRate = pct(canPurchase, totalConfidenceAssessments);

  // Can budget pocket money
  const canBudget = money_confidence_records.filter(
    (r) => r.can_budget_pocket_money,
  ).length;
  const canBudgetRate = pct(canBudget, totalConfidenceAssessments);

  // Can compare prices
  const canCompare = money_confidence_records.filter(
    (r) => r.can_compare_prices,
  ).length;
  const canCompareRate = pct(canCompare, totalConfidenceAssessments);

  // Can identify needs vs wants
  const canIdentifyNeeds = money_confidence_records.filter(
    (r) => r.can_identify_needs_vs_wants,
  ).length;
  const canIdentifyNeedsRate = pct(canIdentifyNeeds, totalConfidenceAssessments);

  // Anxiety around money
  const anxietyPresent = money_confidence_records.filter(
    (r) => r.anxiety_around_money,
  ).length;
  const anxietyRate = pct(anxietyPresent, totalConfidenceAssessments);

  // Improvement noted
  const improvementNoted = money_confidence_records.filter(
    (r) => r.improvement_noted,
  ).length;
  const improvementRate = pct(improvementNoted, totalConfidenceAssessments);

  // Support plan where needed (for those with anxiety or low confidence)
  const needsSupport = money_confidence_records.filter(
    (r) => r.anxiety_around_money || r.confidence_level <= 2,
  );
  const hasSupportPlan = needsSupport.filter((r) => r.support_plan_in_place).length;
  const supportPlanRate = pct(hasSupportPlan, needsSupport.length);

  // Composite money_confidence_rate: avg of coverage, understandsValue, canBudget, canPurchase
  const moneyConfidenceRate =
    totalConfidenceAssessments > 0
      ? Math.round(
          (confidenceCoverage + understandsValueRate + canBudgetRate + canPurchaseRate) / 4,
        )
      : 0;

  // ── 5. Financial independence metrics ─────────────────────────────────
  const totalIndependenceMilestones = financial_independence_records.length;

  // Unique children with independence milestones
  const childrenWithIndependence = new Set(
    financial_independence_records.map((r) => r.child_id),
  ).size;
  const independenceCoverage = pct(childrenWithIndependence, total_children);

  // Achieved milestones
  const achievedMilestones = financial_independence_records.filter(
    (r) => r.achieved,
  ).length;
  const achievedMilestoneRate = pct(achievedMilestones, totalIndependenceMilestones);

  // Age appropriate milestones
  const ageAppropriateMilestones = financial_independence_records.filter(
    (r) => r.age_appropriate,
  ).length;
  const ageAppropriateMilestoneRate = pct(ageAppropriateMilestones, totalIndependenceMilestones);

  // Child initiated
  const childInitiated = financial_independence_records.filter(
    (r) => r.child_initiated,
  ).length;
  const childInitiatedRate = pct(childInitiated, totalIndependenceMilestones);

  // Documented in pathway plan
  const documentedInPathway = financial_independence_records.filter(
    (r) => r.documented_in_pathway_plan,
  ).length;
  const documentedInPathwayRate = pct(documentedInPathway, totalIndependenceMilestones);

  // Linked to leaving care
  const linkedToLeavingCare = financial_independence_records.filter(
    (r) => r.linked_to_leaving_care,
  ).length;
  const linkedToLeavingCareRate = pct(linkedToLeavingCare, totalIndependenceMilestones);

  // Child proud
  const childProud = financial_independence_records.filter(
    (r) => r.achieved && r.child_proud_of_achievement,
  ).length;
  const childProudRate = pct(childProud, achievedMilestones);

  // Next milestone identified
  const nextMilestoneIdentified = financial_independence_records.filter(
    (r) => r.next_milestone_identified,
  ).length;
  const nextMilestoneRate = pct(nextMilestoneIdentified, totalIndependenceMilestones);

  // Staff supported
  const staffSupportedMilestones = financial_independence_records.filter(
    (r) => r.staff_supported,
  ).length;
  const staffSupportedMilestoneRate = pct(staffSupportedMilestones, totalIndependenceMilestones);

  // Unique milestone types per child (breadth)
  const milestoneTypesPerChild: Record<string, Set<string>> = {};
  for (const r of financial_independence_records) {
    if (!milestoneTypesPerChild[r.child_id]) {
      milestoneTypesPerChild[r.child_id] = new Set();
    }
    if (r.achieved) {
      milestoneTypesPerChild[r.child_id].add(r.milestone_type);
    }
  }
  const avgMilestoneBreadth =
    childrenWithIndependence > 0
      ? Math.round(
          Object.values(milestoneTypesPerChild).reduce((s, set) => s + set.size, 0) /
            childrenWithIndependence,
        )
      : 0;

  // Composite financial_independence_rate: avg of coverage, achieved rate, child initiated, documented in pathway
  const financialIndependenceRate =
    totalIndependenceMilestones > 0
      ? Math.round(
          (independenceCoverage + achievedMilestoneRate + childInitiatedRate + documentedInPathwayRate) / 4,
        )
      : 0;

  // ── 6. Child engagement composite ─────────────────────────────────────
  // Composite across all domains: children who are actively engaged
  const engagementNumerators: number[] = [];
  const engagementDenominators: number[] = [];

  if (totalSavingsAccounts > 0) {
    engagementNumerators.push(childUnderstands);
    engagementDenominators.push(totalSavingsAccounts);
  }
  if (totalBankingSkills > 0) {
    engagementNumerators.push(childConfidentSkills);
    engagementDenominators.push(totalBankingSkills);
  }
  if (totalFinancialGoals > 0) {
    engagementNumerators.push(childSetGoal);
    engagementDenominators.push(totalFinancialGoals);
  }
  if (totalConfidenceAssessments > 0) {
    engagementNumerators.push(understandsValue);
    engagementDenominators.push(totalConfidenceAssessments);
  }
  if (totalIndependenceMilestones > 0) {
    engagementNumerators.push(childInitiated);
    engagementDenominators.push(totalIndependenceMilestones);
  }

  const totalEngagementNum = engagementNumerators.reduce((a, b) => a + b, 0);
  const totalEngagementDenom = engagementDenominators.reduce((a, b) => a + b, 0);
  const childEngagementRate = pct(totalEngagementNum, totalEngagementDenom);

  // ══════════════════════════════════════════════════════════════════════════
  // ── SCORING: base 52, max bonuses +28, 4 guarded penalties ────────────
  // ══════════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: savingsAccountRate (>=85: +5, >=65: +3, >=45: +1) ---
  if (savingsAccountRate >= 85) score += 5;
  else if (savingsAccountRate >= 65) score += 3;
  else if (savingsAccountRate >= 45) score += 1;

  // --- Bonus 2: bankingSkillsRate (>=85: +5, >=65: +3, >=45: +1) ---
  if (bankingSkillsRate >= 85) score += 5;
  else if (bankingSkillsRate >= 65) score += 3;
  else if (bankingSkillsRate >= 45) score += 1;

  // --- Bonus 3: financialGoalRate (>=80: +5, >=60: +3, >=40: +1) ---
  if (financialGoalRate >= 80) score += 5;
  else if (financialGoalRate >= 60) score += 3;
  else if (financialGoalRate >= 40) score += 1;

  // --- Bonus 4: moneyConfidenceRate (>=85: +4, >=65: +2, >=45: +1) ---
  if (moneyConfidenceRate >= 85) score += 4;
  else if (moneyConfidenceRate >= 65) score += 2;
  else if (moneyConfidenceRate >= 45) score += 1;

  // --- Bonus 5: financialIndependenceRate (>=80: +4, >=60: +2, >=40: +1) ---
  if (financialIndependenceRate >= 80) score += 4;
  else if (financialIndependenceRate >= 60) score += 2;
  else if (financialIndependenceRate >= 40) score += 1;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +2, >=50: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 2;
  else if (childEngagementRate >= 50) score += 1;

  // --- Bonus 7: depositComplianceRate (>=90: +2, >=70: +1) ---
  if (depositComplianceRate >= 90) score += 2;
  else if (depositComplianceRate >= 70) score += 1;

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // Penalty 1: savingsAccountRate < 30 → -5 (guarded)
  if (savingsAccountRate < 30 && savings_account_records.length > 0) score -= 5;

  // Penalty 2: bankingSkillsRate < 30 → -5 (guarded)
  if (bankingSkillsRate < 30 && banking_skills_records.length > 0) score -= 5;

  // Penalty 3: moneyConfidenceRate < 30 → -4 (guarded)
  if (moneyConfidenceRate < 30 && money_confidence_records.length > 0) score -= 4;

  // Penalty 4: childEngagementRate < 25 → -4 (guarded)
  if (childEngagementRate < 25 && totalEngagementDenom > 0) score -= 4;

  score = clamp(score, 0, 100);

  const savings_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════════
  // ── STRENGTHS ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // Savings account strengths
  if (savingsAccountCoverage >= 90 && totalSavingsAccounts > 0) {
    strengths.push(
      `${childrenWithAccounts} of ${total_children} children have savings accounts — excellent coverage ensuring all children are developing savings habits.`,
    );
  } else if (savingsAccountCoverage >= 70 && totalSavingsAccounts > 0) {
    strengths.push(
      `${savingsAccountCoverage}% of children have savings accounts — good foundation for building financial responsibility.`,
    );
  }

  if (namedHolderRate >= 90 && totalSavingsAccounts > 0) {
    strengths.push(
      `${namedHolderRate}% of savings accounts have the child as named holder — children have genuine ownership of their financial assets.`,
    );
  }

  if (childAccessRate >= 90 && totalSavingsAccounts > 0) {
    strengths.push(
      `${childAccessRate}% of children have access to their savings accounts — promoting financial autonomy and real-world money management.`,
    );
  }

  if (statementsReviewedRate >= 85 && totalSavingsAccounts > 0) {
    strengths.push(
      `${statementsReviewedRate}% of account statements reviewed with children — proactive financial education integrated into savings management.`,
    );
  }

  if (depositComplianceRate >= 90 && totalDepositsTarget > 0) {
    strengths.push(
      `${depositComplianceRate}% deposit target compliance — children are consistently meeting their savings deposit goals.`,
    );
  }

  if (dormantRate === 0 && totalSavingsAccounts > 0) {
    strengths.push(
      "No dormant savings accounts — all accounts are actively used, demonstrating genuine engagement with savings.",
    );
  }

  // Banking skills strengths
  if (bankingSkillsRate >= 85 && totalBankingSkills > 0) {
    strengths.push(
      `Banking skills composite at ${bankingSkillsRate}% — children are being comprehensively prepared with banking knowledge and practical skills.`,
    );
  } else if (bankingSkillsRate >= 65 && totalBankingSkills > 0) {
    strengths.push(
      `Banking skills composite at ${bankingSkillsRate}% — good progress in developing children's banking competencies.`,
    );
  }

  if (competenceRate >= 85 && totalBankingSkills > 0) {
    strengths.push(
      `${competenceRate}% of banking skills taught have been demonstrated competently — children are not just learning but proving they can apply their skills.`,
    );
  }

  if (practiceGivenRate >= 90 && totalBankingSkills > 0) {
    strengths.push(
      `${practiceGivenRate}% of banking skills supported with real practice opportunities — learning is reinforced through genuine experience.`,
    );
  }

  if (avgSkillBreadth >= 5 && childrenWithBankingSkills > 0) {
    strengths.push(
      `Children are developing an average of ${avgSkillBreadth} different banking skill types — demonstrating breadth and depth in financial skills development.`,
    );
  }

  if (linkedToIndPlanRate >= 80 && totalBankingSkills > 0) {
    strengths.push(
      `${linkedToIndPlanRate}% of banking skills linked to independence plans — financial skills development is well-integrated with pathway planning.`,
    );
  }

  // Financial goal strengths
  if (goalCoverage >= 80 && totalFinancialGoals > 0) {
    strengths.push(
      `${childrenWithGoals} of ${total_children} children have financial goals — strong culture of goal-setting and aspiration in financial development.`,
    );
  } else if (goalCoverage >= 60 && totalFinancialGoals > 0) {
    strengths.push(
      `${goalCoverage}% of children have financial goals — a solid foundation for developing savings motivation and financial planning.`,
    );
  }

  if (achievedGoalRate >= 50 && achievedGoals > 0) {
    strengths.push(
      `${achievedGoals} financial goals achieved (${achievedGoalRate}%) — children are experiencing the reward of reaching their savings targets.`,
    );
  }

  if (childSetGoalRate >= 80 && totalFinancialGoals > 0) {
    strengths.push(
      `${childSetGoalRate}% of financial goals set by the children themselves — genuine child agency in their financial development.`,
    );
  }

  if (celebrationRate >= 80 && achievedGoals > 0) {
    strengths.push(
      `${celebrationRate}% of achieved goals celebrated with the child — positive reinforcement is supporting continued savings motivation.`,
    );
  }

  if (reviewedInKeyworkRate >= 85 && totalFinancialGoals > 0) {
    strengths.push(
      `${reviewedInKeyworkRate}% of financial goals reviewed in keywork sessions — financial development is embedded in the keyworking relationship.`,
    );
  }

  // Money confidence strengths
  if (moneyConfidenceRate >= 85 && totalConfidenceAssessments > 0) {
    strengths.push(
      `Money confidence composite at ${moneyConfidenceRate}% — children are developing genuine confidence and competence in managing money.`,
    );
  } else if (moneyConfidenceRate >= 65 && totalConfidenceAssessments > 0) {
    strengths.push(
      `Money confidence composite at ${moneyConfidenceRate}% — children are making good progress in building financial confidence.`,
    );
  }

  if (avgConfidenceLevel >= 4.0 && totalConfidenceAssessments > 0) {
    strengths.push(
      `Average money confidence level at ${avgConfidenceLevel}/5 — children report high levels of confidence in handling money.`,
    );
  }

  if (canBudgetRate >= 85 && totalConfidenceAssessments > 0) {
    strengths.push(
      `${canBudgetRate}% of children can budget their pocket money — a fundamental life skill being well-developed across the home.`,
    );
  }

  if (canIdentifyNeedsRate >= 85 && totalConfidenceAssessments > 0) {
    strengths.push(
      `${canIdentifyNeedsRate}% of children can distinguish needs from wants — demonstrating mature financial reasoning.`,
    );
  }

  if (improvementRate >= 70 && totalConfidenceAssessments > 0) {
    strengths.push(
      `${improvementRate}% of assessments show improvement in money confidence — clear evidence of progress in children's financial self-efficacy.`,
    );
  }

  if (anxietyRate === 0 && totalConfidenceAssessments > 0) {
    strengths.push(
      "No children report anxiety around money — a positive indication of the home's supportive approach to financial education.",
    );
  }

  if (supportPlanRate >= 90 && needsSupport.length > 0) {
    strengths.push(
      `${supportPlanRate}% of children needing money confidence support have a plan in place — responsive support for children who find money difficult.`,
    );
  }

  // Financial independence strengths
  if (financialIndependenceRate >= 80 && totalIndependenceMilestones > 0) {
    strengths.push(
      `Financial independence composite at ${financialIndependenceRate}% — children are making excellent progress towards real-world financial autonomy.`,
    );
  } else if (financialIndependenceRate >= 60 && totalIndependenceMilestones > 0) {
    strengths.push(
      `Financial independence composite at ${financialIndependenceRate}% — good progress in children achieving meaningful financial milestones.`,
    );
  }

  if (achievedMilestoneRate >= 80 && totalIndependenceMilestones > 0) {
    strengths.push(
      `${achievedMilestoneRate}% of financial independence milestones achieved — children are demonstrating real-world financial capability.`,
    );
  }

  if (childInitiatedRate >= 70 && totalIndependenceMilestones > 0) {
    strengths.push(
      `${childInitiatedRate}% of milestones were child-initiated — children are taking ownership of their financial development journey.`,
    );
  }

  if (linkedToLeavingCareRate >= 80 && totalIndependenceMilestones > 0) {
    strengths.push(
      `${linkedToLeavingCareRate}% of milestones linked to leaving care preparation — financial independence is purposefully connected to transition planning.`,
    );
  }

  if (childProudRate >= 80 && achievedMilestones > 0) {
    strengths.push(
      `${childProudRate}% of children expressed pride in their financial achievements — positive emotional connection to financial competence.`,
    );
  }

  if (avgMilestoneBreadth >= 4 && childrenWithIndependence > 0) {
    strengths.push(
      `Children achieving an average of ${avgMilestoneBreadth} different milestone types — broad development of financial independence skills.`,
    );
  }

  // Child engagement composite strength
  if (childEngagementRate >= 90 && totalEngagementDenom > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement across all savings and banking domains — children are genuinely involved in their own financial development.`,
    );
  } else if (childEngagementRate >= 70 && totalEngagementDenom > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement across savings and banking activities — good levels of children's active participation in financial learning.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── CONCERNS ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // Savings account concerns
  if (savingsAccountCoverage < 40 && totalSavingsAccounts > 0) {
    concerns.push(
      `Only ${savingsAccountCoverage}% of children have savings accounts — most children are without access to formal savings, limiting their ability to develop financial habits.`,
    );
  } else if (savingsAccountCoverage >= 40 && savingsAccountCoverage < 70 && totalSavingsAccounts > 0) {
    concerns.push(
      `Savings account coverage at ${savingsAccountCoverage}% — not all children have access to a savings account, creating an inequality in financial skill development.`,
    );
  }

  if (totalSavingsAccounts === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No savings account records exist despite children being on placement — children cannot develop savings habits without access to savings accounts.",
    );
  }

  if (childAccessRate < 50 && totalSavingsAccounts > 0) {
    concerns.push(
      `Only ${childAccessRate}% of children have access to their savings accounts — accounts exist but children cannot independently engage with their money.`,
    );
  }

  if (dormantRate >= 30 && totalSavingsAccounts > 0) {
    concerns.push(
      `${dormantRate}% of savings accounts are dormant — savings accounts are not being actively used, undermining the purpose of having them.`,
    );
  } else if (dormantRate >= 15 && dormantRate < 30 && totalSavingsAccounts > 0) {
    concerns.push(
      `${dormantRate}% of savings accounts are dormant — some accounts need reactivation to ensure children maintain their savings engagement.`,
    );
  }

  if (depositComplianceRate < 50 && totalDepositsTarget > 0) {
    concerns.push(
      `Deposit target compliance at only ${depositComplianceRate}% — children are not meeting their savings deposit goals, suggesting targets may be unrealistic or support is insufficient.`,
    );
  }

  // Banking skills concerns
  if (bankingSkillsRate < 30 && totalBankingSkills > 0) {
    concerns.push(
      `Banking skills composite at only ${bankingSkillsRate}% — children are not developing the banking competencies they need for financial independence.`,
    );
  } else if (bankingSkillsRate >= 30 && bankingSkillsRate < 50 && totalBankingSkills > 0) {
    concerns.push(
      `Banking skills composite at ${bankingSkillsRate}% — significant gaps remain in children's banking knowledge and practical abilities.`,
    );
  }

  if (totalBankingSkills === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No banking skills development records exist despite children being on placement — children's banking education is not being tracked or delivered.",
    );
  }

  if (competenceRate < 40 && totalBankingSkills > 0) {
    concerns.push(
      `Only ${competenceRate}% of banking skills showing demonstrated competence — children are being taught but not retaining or applying what they learn.`,
    );
  }

  if (practiceGivenRate < 50 && totalBankingSkills > 0) {
    concerns.push(
      `Only ${practiceGivenRate}% of banking skills supported with practice opportunities — without real-world practice, theoretical banking knowledge has limited value.`,
    );
  }

  // Financial goal concerns
  if (goalCoverage < 30 && totalFinancialGoals > 0) {
    concerns.push(
      `Only ${goalCoverage}% of children have financial goals — most children are without savings targets, limiting their motivation to save.`,
    );
  } else if (goalCoverage >= 30 && goalCoverage < 60 && totalFinancialGoals > 0) {
    concerns.push(
      `Financial goal coverage at ${goalCoverage}% — not all children have been supported to set savings goals.`,
    );
  }

  if (totalFinancialGoals === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No financial goal records exist despite children being on placement — financial goal-setting is a key part of savings motivation and is not being facilitated.",
    );
  }

  if (abandonedGoalRate >= 30 && totalFinancialGoals > 0) {
    concerns.push(
      `${abandonedGoalRate}% of financial goals have been abandoned — a high abandonment rate suggests goals may be poorly set, poorly supported, or unrealistic.`,
    );
  }

  if (childTrackingRate < 40 && totalFinancialGoals > 0) {
    concerns.push(
      `Only ${childTrackingRate}% of children tracking their financial goal progress — without active tracking, children lose connection with their savings journey.`,
    );
  }

  // Money confidence concerns
  if (moneyConfidenceRate < 30 && totalConfidenceAssessments > 0) {
    concerns.push(
      `Money confidence composite at only ${moneyConfidenceRate}% — children lack basic confidence in handling money, putting them at risk of financial vulnerability.`,
    );
  } else if (moneyConfidenceRate >= 30 && moneyConfidenceRate < 50 && totalConfidenceAssessments > 0) {
    concerns.push(
      `Money confidence composite at ${moneyConfidenceRate}% — many children are not yet confident in basic money management skills.`,
    );
  }

  if (totalConfidenceAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No money confidence assessments exist despite children being on placement — the home cannot evidence children's financial confidence or identify those needing support.",
    );
  }

  if (anxietyRate >= 30 && totalConfidenceAssessments > 0) {
    concerns.push(
      `${anxietyRate}% of children report anxiety around money — significant financial anxiety requires targeted therapeutic support and sensitive handling.`,
    );
  } else if (anxietyRate >= 15 && anxietyRate < 30 && totalConfidenceAssessments > 0) {
    concerns.push(
      `${anxietyRate}% of children report anxiety around money — some children need additional emotional support around financial matters.`,
    );
  }

  if (avgConfidenceLevel < 2.5 && totalConfidenceAssessments > 0) {
    concerns.push(
      `Average money confidence level at only ${avgConfidenceLevel}/5 — children are reporting very low confidence in their ability to manage money.`,
    );
  }

  if (supportPlanRate < 50 && needsSupport.length > 0) {
    concerns.push(
      `Only ${supportPlanRate}% of children needing money confidence support have a plan in place — vulnerable children are not receiving structured financial support.`,
    );
  }

  // Financial independence concerns
  if (financialIndependenceRate < 30 && totalIndependenceMilestones > 0) {
    concerns.push(
      `Financial independence composite at only ${financialIndependenceRate}% — children are not making adequate progress towards financial autonomy.`,
    );
  } else if (financialIndependenceRate >= 30 && financialIndependenceRate < 50 && totalIndependenceMilestones > 0) {
    concerns.push(
      `Financial independence composite at ${financialIndependenceRate}% — progress towards financial autonomy is below expectations.`,
    );
  }

  if (totalIndependenceMilestones === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No financial independence milestone records exist despite children being on placement — the home is not tracking children's progression towards financial autonomy.",
    );
  }

  if (documentedInPathwayRate < 50 && totalIndependenceMilestones > 0) {
    concerns.push(
      `Only ${documentedInPathwayRate}% of financial milestones documented in pathway plans — financial independence is not well-integrated with overall transition planning.`,
    );
  }

  if (nextMilestoneRate < 50 && totalIndependenceMilestones > 0) {
    concerns.push(
      `Only ${nextMilestoneRate}% of records identify the next financial milestone — without forward planning, children's financial development lacks direction.`,
    );
  }

  // Child engagement concerns
  if (childEngagementRate < 25 && totalEngagementDenom > 0) {
    concerns.push(
      `Child engagement across savings and banking at only ${childEngagementRate}% — children are not meaningfully involved in their own financial development.`,
    );
  } else if (childEngagementRate >= 25 && childEngagementRate < 50 && totalEngagementDenom > 0) {
    concerns.push(
      `Child engagement across savings and banking at ${childEngagementRate}% — many children are passive rather than active participants in their financial learning.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── RECOMMENDATIONS ───────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  const recommendations: SavingsBankingRecommendation[] = [];
  let rank = 0;

  // Critical: no savings accounts at all
  if (totalSavingsAccounts === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has an age-appropriate savings account opened with their involvement — savings accounts are fundamental to financial literacy and independence preparation. Staff should support children through the process of choosing and opening an account.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Low savings coverage
  if (savingsAccountCoverage < 40 && totalSavingsAccounts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase savings account coverage to ensure all children have access to a savings account — prioritise children currently without accounts and involve them in choosing the right type of account for their needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  } else if (savingsAccountCoverage >= 40 && savingsAccountCoverage < 70 && totalSavingsAccounts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend savings account coverage beyond ${savingsAccountCoverage}% — identify children without accounts and provide tailored support to help them access appropriate savings products.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // No banking skills records
  if (totalBankingSkills === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a structured banking skills programme covering ATM use, online banking, budgeting, reading statements, and fraud awareness — skills should be age-appropriate and include real practice opportunities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  // Low banking skills
  if (bankingSkillsRate < 30 && totalBankingSkills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve banking skills development — ensure all children receive structured banking education with demonstrated competence checks, real practice opportunities, and links to their independence plans.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  } else if (bankingSkillsRate >= 30 && bankingSkillsRate < 65 && totalBankingSkills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen banking skills programme to improve coverage, competence demonstration, and child confidence — review which skills are being taught and whether children are getting sufficient practice opportunities.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  // Low competence rate
  if (competenceRate < 40 && totalBankingSkills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review banking skills teaching methods to improve competence demonstration rates — consider more hands-on, practical approaches and repeat teaching sessions to build genuine understanding rather than just awareness.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // No financial goals
  if (totalFinancialGoals === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Support every child to set at least one financial goal appropriate to their age and understanding — goals should be child-led, achievable, and regularly reviewed in keywork sessions.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // Low goal coverage
  if (goalCoverage < 30 && totalFinancialGoals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend financial goal-setting to all children — ensure goals are meaningful to the child, have realistic targets and timeframes, and are actively tracked with staff support.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  } else if (goalCoverage >= 30 && goalCoverage < 60 && totalFinancialGoals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve financial goal coverage — children without financial goals are missing motivation to save and the satisfaction of achieving targets.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // High goal abandonment
  if (abandonedGoalRate >= 30 && totalFinancialGoals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and address the high rate of abandoned financial goals — ensure goals are realistic, age-appropriate, and that children receive ongoing support and encouragement. Consider adjusting goals rather than abandoning them.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // No confidence assessments
  if (totalConfidenceAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce regular money confidence assessments for all children — these should cover understanding of money, purchasing ability, budgeting skills, price comparison, and needs-vs-wants awareness to identify children needing targeted support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Low money confidence
  if (moneyConfidenceRate < 30 && totalConfidenceAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address low money confidence — develop individual support plans for children struggling with financial understanding and provide structured, low-pressure opportunities to practise money skills.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  } else if (moneyConfidenceRate >= 30 && moneyConfidenceRate < 65 && totalConfidenceAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen money confidence building activities — consider age-appropriate games, shopping trips, budgeting challenges, and cooking-on-a-budget exercises to build practical confidence.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Money anxiety
  if (anxietyRate >= 30 && totalConfidenceAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop targeted support for children experiencing anxiety around money — consider therapeutic approaches, gentle exposure to financial activities, and ensure staff understand the emotional dimension of financial education for children in care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  // Missing support plans
  if (supportPlanRate < 50 && needsSupport.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children with money anxiety or low confidence have a documented support plan — plans should include specific, gradual steps to build confidence and reduce financial anxiety.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  // No independence milestones
  if (totalIndependenceMilestones === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin tracking financial independence milestones for all children — from first independent purchase through to managing phone contracts and online banking, milestones should be age-appropriate and linked to pathway plans.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Low independence rate
  if (financialIndependenceRate < 30 && totalIndependenceMilestones > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Accelerate financial independence milestone achievement — create structured opportunities for children to practise real-world financial tasks appropriate to their age and link all milestones to pathway plans.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  } else if (financialIndependenceRate >= 30 && financialIndependenceRate < 60 && totalIndependenceMilestones > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve financial independence milestone achievement and documentation — ensure milestones are linked to pathway plans, leaving care preparation, and that the next step is always identified.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Low pathway plan documentation
  if (documentedInPathwayRate < 50 && totalIndependenceMilestones > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Integrate financial milestones into pathway plans — financial independence should be a core component of every child's transition planning and not managed separately.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Low child engagement
  if (childEngagementRate < 25 && totalEngagementDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve child engagement in financial activities — explore what barriers exist to children's participation, involve them in designing financial learning activities, and ensure all savings and banking education is genuinely child-centred.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  } else if (childEngagementRate >= 25 && childEngagementRate < 50 && totalEngagementDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child engagement across savings and banking activities — use child-led approaches, reward participation, and ensure activities are relevant and interesting to children's real lives.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  // Practice opportunity gaps
  if (practiceGivenRate < 50 && totalBankingSkills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase real-world practice opportunities for banking skills — arrange supervised ATM visits, online banking tutorials, comparison shopping trips, and budgeting exercises so children can apply theoretical knowledge.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // Low deposit compliance
  if (depositComplianceRate >= 50 && depositComplianceRate < 70 && totalDepositsTarget > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review savings deposit targets to ensure they are realistic and achievable — some children may need adjusted targets or additional support to maintain regular deposits.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // Dormant accounts
  if (dormantRate >= 15 && totalSavingsAccounts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reactivate dormant savings accounts — review why accounts have become dormant, engage children in refreshing their savings goals, and ensure accounts remain part of their active financial development.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── INSIGHTS ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  const insights: SavingsBankingInsight[] = [];

  // ── Critical insights ─────────────────────────────────────────────────

  if (savingsAccountRate < 30 && savings_account_records.length > 0) {
    insights.push({
      text: `Savings account composite at only ${savingsAccountRate}%. Savings accounts exist on paper but children lack genuine access, understanding, and ownership. Ofsted inspectors will ask how children are supported to manage money — without meaningful savings engagement, the home cannot evidence effective preparation for independence.`,
      severity: "critical",
    });
  }

  if (bankingSkillsRate < 30 && banking_skills_records.length > 0) {
    insights.push({
      text: `Banking skills composite at only ${bankingSkillsRate}%. Children are not developing the practical banking competencies they will need when they leave care. Without ATM use, online banking, budgeting, and fraud awareness skills, young people face significant financial vulnerability in adulthood.`,
      severity: "critical",
    });
  }

  if (moneyConfidenceRate < 30 && money_confidence_records.length > 0) {
    insights.push({
      text: `Money confidence composite at only ${moneyConfidenceRate}%. Children lack basic confidence in handling money. For looked-after children, who often lack the family support networks that help most young people develop financial confidence, this represents a critical gap that the home must address.`,
      severity: "critical",
    });
  }

  if (childEngagementRate < 25 && totalEngagementDenom > 0) {
    insights.push({
      text: `Child engagement across savings and banking at only ${childEngagementRate}%. Financial education is being done to children rather than with them. Without genuine participation, children will not internalise the skills and habits needed for financial independence.`,
      severity: "critical",
    });
  }

  if (anxietyRate >= 30 && totalConfidenceAssessments > 0) {
    insights.push({
      text: `${anxietyRate}% of children report anxiety around money. For children in care, financial anxiety can be rooted in past experiences of deprivation or instability. A purely educational approach to financial skills may be insufficient — therapeutic support addressing the emotional dimension of money is needed.`,
      severity: "critical",
    });
  }

  if (totalSavingsAccounts === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No savings accounts exist for any child despite other financial records being present. This is a fundamental gap — without savings accounts, children cannot practise the most basic financial skill of setting money aside for the future. Ofsted will view this as a significant shortcoming in independence preparation.",
      severity: "critical",
    });
  }

  if (totalBankingSkills === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No banking skills development records exist despite children being on placement. Banking skills are essential for independence — children leaving care without knowing how to use an ATM, read a bank statement, or spot a scam face immediate financial risk.",
      severity: "critical",
    });
  }

  // ── Warning insights ──────────────────────────────────────────────────

  if (savingsAccountRate >= 30 && savingsAccountRate < 65 && totalSavingsAccounts > 0) {
    insights.push({
      text: `Savings account composite at ${savingsAccountRate}% — savings accounts are in place for some children but coverage, access, or child understanding needs improvement. The gap between having an account and genuinely engaging with savings must be closed.`,
      severity: "warning",
    });
  }

  if (bankingSkillsRate >= 30 && bankingSkillsRate < 65 && totalBankingSkills > 0) {
    insights.push({
      text: `Banking skills composite at ${bankingSkillsRate}% — some banking education is happening but competence, confidence, and practice opportunities are not yet at the level needed for genuine financial preparedness.`,
      severity: "warning",
    });
  }

  if (financialGoalRate >= 30 && financialGoalRate < 60 && totalFinancialGoals > 0) {
    insights.push({
      text: `Financial goal composite at ${financialGoalRate}% — some children have savings goals but coverage, child ownership, progress tracking, and integration with keywork need strengthening to make goal-setting truly effective.`,
      severity: "warning",
    });
  }

  if (moneyConfidenceRate >= 30 && moneyConfidenceRate < 65 && totalConfidenceAssessments > 0) {
    insights.push({
      text: `Money confidence composite at ${moneyConfidenceRate}% — children have some financial understanding but many are not yet confident in budgeting, purchasing, or managing money independently. Targeted confidence-building activities would help.`,
      severity: "warning",
    });
  }

  if (financialIndependenceRate >= 30 && financialIndependenceRate < 60 && totalIndependenceMilestones > 0) {
    insights.push({
      text: `Financial independence composite at ${financialIndependenceRate}% — children are making some progress towards financial autonomy but milestone achievement, documentation, and forward planning need improvement.`,
      severity: "warning",
    });
  }

  if (childEngagementRate >= 25 && childEngagementRate < 50 && totalEngagementDenom > 0) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% — while some children are participating actively, many remain passive recipients of financial education. Consider whether activities are engaging, relevant, and genuinely child-centred.`,
      severity: "warning",
    });
  }

  if (dormantRate >= 15 && dormantRate < 30 && totalSavingsAccounts > 0) {
    insights.push({
      text: `${dormantRate}% of savings accounts are dormant. Dormant accounts represent disengagement from savings — the initial effort of opening accounts is wasted if they are not actively maintained. Each dormant account is a child who has stopped saving.`,
      severity: "warning",
    });
  }

  if (abandonedGoalRate >= 20 && abandonedGoalRate < 30 && totalFinancialGoals > 0) {
    insights.push({
      text: `${abandonedGoalRate}% of financial goals abandoned. Some goal abandonment is normal, but approaching ${abandonedGoalRate}% suggests that initial goals may not have been well-matched to children's circumstances, or that ongoing support and motivation is lacking.`,
      severity: "warning",
    });
  }

  if (anxietyRate >= 15 && anxietyRate < 30 && totalConfidenceAssessments > 0) {
    insights.push({
      text: `${anxietyRate}% of children report some anxiety around money. While not at crisis level, financial anxiety in looked-after children can undermine engagement with savings, banking, and independence activities. Sensitive, individualised approaches are needed.`,
      severity: "warning",
    });
  }

  if (depositComplianceRate >= 50 && depositComplianceRate < 70 && totalDepositsTarget > 0) {
    insights.push({
      text: `Deposit compliance at ${depositComplianceRate}% — children are meeting some savings targets but not consistently. Review whether targets are achievable and whether children have the support they need to maintain regular deposits.`,
      severity: "warning",
    });
  }

  if (avgConfidenceLevel >= 2.5 && avgConfidenceLevel < 3.5 && totalConfidenceAssessments > 0) {
    insights.push({
      text: `Average money confidence at ${avgConfidenceLevel}/5 — moderate confidence levels suggest children need more structured support and positive experiences with money to build genuine financial self-assurance.`,
      severity: "warning",
    });
  }

  // Identify skill type gaps
  const allSkillTypes: BankingSkillsRecordInput["skill_type"][] = [
    "atm_use",
    "online_banking",
    "budgeting",
    "reading_statements",
    "direct_debit",
    "card_management",
    "fraud_awareness",
    "comparison_shopping",
  ];
  const taughtSkillTypes = new Set(
    banking_skills_records.filter((r) => r.taught).map((r) => r.skill_type),
  );
  const missingSkillTypes = allSkillTypes.filter((s) => !taughtSkillTypes.has(s));
  if (missingSkillTypes.length >= 3 && totalBankingSkills > 3) {
    insights.push({
      text: `Banking skills programme has gaps in ${missingSkillTypes.join(", ")} — a comprehensive programme should cover all key banking competencies to ensure children are fully prepared for financial independence.`,
      severity: "warning",
    });
  }

  // ── Positive insights ─────────────────────────────────────────────────

  if (savings_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding savings and banking skills development — children have genuine access to savings accounts, are developing practical banking competencies, setting and achieving financial goals, building money confidence, and progressing towards real financial independence. This represents excellent preparation for adulthood.",
      severity: "positive",
    });
  }

  if (savingsAccountRate >= 85 && totalSavingsAccounts > 0) {
    insights.push({
      text: `Savings account composite at ${savingsAccountRate}% — children have genuine ownership of their savings accounts, understand how they work, and have real access to their money. This goes well beyond simply having an account and demonstrates meaningful financial engagement.`,
      severity: "positive",
    });
  }

  if (bankingSkillsRate >= 85 && totalBankingSkills > 0) {
    insights.push({
      text: `Banking skills composite at ${bankingSkillsRate}% with ${competenceRate}% demonstrated competence — children are not just being taught about banking but proving they can apply their skills in practice. This is strong evidence of effective independence preparation.`,
      severity: "positive",
    });
  }

  if (financialGoalRate >= 80 && totalFinancialGoals > 0) {
    insights.push({
      text: `Financial goal composite at ${financialGoalRate}% — children are actively setting their own savings goals, tracking progress, and having achievements recognised. Goal-setting builds agency and financial motivation that will serve children well beyond the home.`,
      severity: "positive",
    });
  }

  if (moneyConfidenceRate >= 85 && totalConfidenceAssessments > 0) {
    insights.push({
      text: `Money confidence composite at ${moneyConfidenceRate}% — children report high confidence in handling money, budgeting, and making purchases independently. This confidence is built through consistent, supportive financial education.`,
      severity: "positive",
    });
  }

  if (financialIndependenceRate >= 80 && totalIndependenceMilestones > 0) {
    insights.push({
      text: `Financial independence composite at ${financialIndependenceRate}% — children are achieving real-world financial milestones, with achievements documented in pathway plans and linked to leaving care preparation. This is evidence of purposeful, outcomes-focused practice.`,
      severity: "positive",
    });
  }

  if (childEngagementRate >= 90 && totalEngagementDenom > 0) {
    insights.push({
      text: `${childEngagementRate}% child engagement across all savings and banking domains — children are genuine partners in their own financial development, not passive recipients. This child-centred approach is exactly what Ofsted looks for when assessing experiences and progress.`,
      severity: "positive",
    });
  }

  if (improvementRate >= 80 && totalConfidenceAssessments > 0) {
    insights.push({
      text: `${improvementRate}% of money confidence assessments show improvement — clear evidence that the home's financial education approach is working and children are making measurable progress in their relationship with money.`,
      severity: "positive",
    });
  }

  if (achievedGoalRate >= 60 && achievedGoals >= 3) {
    insights.push({
      text: `${achievedGoals} financial goals achieved (${achievedGoalRate}%) — children are experiencing genuine financial success and learning that saving and planning pays off. This builds the habits and motivation needed for lifelong financial wellbeing.`,
      severity: "positive",
    });
  }

  if (
    avgSkillBreadth >= 5 &&
    avgMilestoneBreadth >= 4 &&
    childrenWithBankingSkills > 0 &&
    childrenWithIndependence > 0
  ) {
    insights.push({
      text: `Children developing an average of ${avgSkillBreadth} banking skill types and ${avgMilestoneBreadth} independence milestone types — this breadth of financial development demonstrates a comprehensive, well-planned approach to preparing children for financial independence.`,
      severity: "positive",
    });
  }

  if (celebrationRate >= 90 && achievedGoals >= 2) {
    insights.push({
      text: `${celebrationRate}% of achieved financial goals celebrated with the child — positive reinforcement of financial achievements builds confidence, motivation, and a healthy relationship with money.`,
      severity: "positive",
    });
  }

  if (
    linkedToLeavingCareRate >= 80 &&
    documentedInPathwayRate >= 80 &&
    totalIndependenceMilestones > 0
  ) {
    insights.push({
      text: `${linkedToLeavingCareRate}% linked to leaving care and ${documentedInPathwayRate}% documented in pathway plans — financial independence milestones are deeply integrated with transition planning, ensuring children's financial development is purposeful and well-coordinated.`,
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── HEADLINE ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  let headline: string;

  if (savings_rating === "outstanding") {
    headline =
      "Outstanding savings and banking skills development — children have genuine savings engagement, strong banking competencies, active financial goals, high money confidence, and clear progress towards financial independence.";
  } else if (savings_rating === "good") {
    headline = `Good savings and banking skills development — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (savings_rating === "adequate") {
    headline = `Adequate savings and banking skills development — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children develop the financial skills and confidence they need for independence.`;
  } else {
    headline = `Savings and banking skills development is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve children's savings engagement, banking education, and financial independence preparation.`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── RETURN ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  return {
    savings_rating,
    savings_score: score,
    headline,
    total_savings_accounts: totalSavingsAccounts,
    total_banking_skills: totalBankingSkills,
    total_financial_goals: totalFinancialGoals,
    total_confidence_assessments: totalConfidenceAssessments,
    total_independence_milestones: totalIndependenceMilestones,
    savings_account_rate: savingsAccountRate,
    banking_skills_rate: bankingSkillsRate,
    financial_goal_rate: financialGoalRate,
    money_confidence_rate: moneyConfidenceRate,
    financial_independence_rate: financialIndependenceRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
