import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME POCKET MONEY AUDIT & RECONCILIATION INTELLIGENCE ENGINE
// Monitors financial audit and reconciliation quality — pocket money audit
// compliance, reconciliation accuracy, discrepancy resolution timeliness,
// transparency in financial management, and child financial awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Statement of purpose), Reg 36 (Review of quality of care).
// SCCIF: "Leadership and management" — financial oversight and transparency.
// Store keys: auditRecords, reconciliationRecords, discrepancyRecords,
//             transparencyRecords, childAwarenessRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AuditRecordInput {
  id: string;
  child_id: string;
  audit_date: string;
  auditor_name: string;
  audit_type: "weekly" | "monthly" | "quarterly" | "annual" | "ad_hoc";
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expenditure: number;
  receipts_present: boolean;
  receipts_match_records: boolean;
  signatures_present: boolean;
  child_signature_obtained: boolean;
  running_total_accurate: boolean;
  cash_count_matches: boolean;
  ledger_up_to_date: boolean;
  all_entries_dated: boolean;
  all_entries_described: boolean;
  no_unauthorized_transactions: boolean;
  corrective_actions_needed: boolean;
  corrective_actions_description: string | null;
  corrective_actions_completed: boolean;
  corrective_actions_completion_date: string | null;
  audit_outcome: "pass" | "pass_with_observations" | "fail";
  observations: string | null;
  next_audit_due: string | null;
  created_at: string;
}

export interface ReconciliationRecordInput {
  id: string;
  child_id: string;
  reconciliation_date: string;
  period_start: string;
  period_end: string;
  reconciled_by: string;
  expected_balance: number;
  actual_balance: number;
  variance_amount: number;
  variance_explained: boolean;
  variance_explanation: string | null;
  all_transactions_accounted: boolean;
  bank_statement_matched: boolean;
  petty_cash_reconciled: boolean;
  savings_balance_verified: boolean;
  discrepancies_found: boolean;
  discrepancy_count: number;
  reconciliation_outcome: "balanced" | "variance_explained" | "variance_unexplained" | "pending";
  supervisor_reviewed: boolean;
  supervisor_name: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface DiscrepancyRecordInput {
  id: string;
  child_id: string;
  identified_date: string;
  identified_by: string;
  discrepancy_type: "missing_receipt" | "balance_mismatch" | "unauthorized_transaction" | "duplicate_entry" | "missing_entry" | "incorrect_amount" | "timing_difference" | "other";
  amount_involved: number;
  description: string;
  severity: "minor" | "moderate" | "major" | "critical";
  resolution_required: boolean;
  resolution_status: "open" | "investigating" | "resolved" | "escalated";
  resolution_date: string | null;
  resolution_description: string | null;
  resolved_by: string | null;
  days_to_resolve: number | null;
  escalated_to: string | null;
  root_cause_identified: boolean;
  root_cause_description: string | null;
  preventive_action_taken: boolean;
  preventive_action_description: string | null;
  child_informed: boolean;
  child_impact: "none" | "minor" | "moderate" | "significant";
  created_at: string;
}

export interface TransparencyRecordInput {
  id: string;
  child_id: string;
  record_date: string;
  child_has_access_to_records: boolean;
  records_explained_to_child: boolean;
  child_receives_regular_statements: boolean;
  statement_frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "never";
  pocket_money_amount_agreed: boolean;
  amount_age_appropriate: boolean;
  child_involved_in_budget_decisions: boolean;
  spending_choices_respected: boolean;
  savings_goals_discussed: boolean;
  savings_goals_documented: boolean;
  financial_records_accessible: boolean;
  complaints_process_explained: boolean;
  independent_oversight_in_place: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface ChildAwarenessRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessed_by: string;
  understands_pocket_money_amount: boolean;
  understands_how_amount_decided: boolean;
  knows_how_to_check_balance: boolean;
  knows_how_to_query_transaction: boolean;
  understands_saving_vs_spending: boolean;
  has_received_financial_education: boolean;
  financial_education_type: string | null;
  can_manage_small_budget: boolean;
  understands_receipts_importance: boolean;
  feels_money_is_managed_fairly: boolean;
  has_raised_concerns: boolean;
  concerns_addressed: boolean;
  concerns_description: string | null;
  confidence_level: number; // 1-5
  age_appropriate_understanding: boolean;
  areas_for_development: string | null;
  support_plan_in_place: boolean;
  created_at: string;
}

export interface PocketMoneyAuditInput {
  today: string;
  total_children: number;
  audit_records: AuditRecordInput[];
  reconciliation_records: ReconciliationRecordInput[];
  discrepancy_records: DiscrepancyRecordInput[];
  transparency_records: TransparencyRecordInput[];
  child_awareness_records: ChildAwarenessRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PocketMoneyAuditRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PocketMoneyAuditInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PocketMoneyAuditRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PocketMoneyAuditResult {
  audit_rating: PocketMoneyAuditRating;
  audit_score: number | null;
  headline: string;
  total_audits: number;
  total_reconciliations: number;
  total_discrepancies: number;
  audit_compliance_rate: number | null;
  reconciliation_accuracy_rate: number | null;
  discrepancy_resolution_rate: number | null;
  transparency_rate: number | null;
  child_awareness_rate: number | null;
  timeliness_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: PocketMoneyAuditRecommendation[];
  insights: PocketMoneyAuditInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PocketMoneyAuditRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: PocketMoneyAuditRating,
  score: number,
  headline: string,
): PocketMoneyAuditResult {
  return {
    audit_rating: rating,
    audit_score: score,
    headline,
    total_audits: 0,
    total_reconciliations: 0,
    total_discrepancies: 0,
    audit_compliance_rate: null,
    reconciliation_accuracy_rate: null,
    discrepancy_resolution_rate: null,
    transparency_rate: null,
    child_awareness_rate: null,
    timeliness_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computePocketMoneyAuditReconciliation(
  input: PocketMoneyAuditInput,
): PocketMoneyAuditResult {
  const {
    total_children,
    audit_records,
    reconciliation_records,
    discrepancy_records,
    transparency_records,
    child_awareness_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    audit_records.length === 0 &&
    reconciliation_records.length === 0 &&
    discrepancy_records.length === 0 &&
    transparency_records.length === 0 &&
    child_awareness_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess pocket money audit and reconciliation quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No pocket money audit or reconciliation data recorded despite children on placement — financial oversight requires urgent attention.",
      ),
      concerns: [
        "No audit records, reconciliation records, discrepancy tracking, transparency records, or child financial awareness assessments exist despite children being on placement — the home cannot evidence adequate financial oversight or pocket money management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured pocket money audit and reconciliation processes immediately — establish regular audits, reconciliation schedules, discrepancy tracking, transparency mechanisms, and child financial awareness assessments to evidence financial oversight.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has documented pocket money arrangements with clear audit trails, regular reconciliation, and transparent reporting that involves the child in understanding their financial records.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
        },
      ],
      insights: [
        {
          text: "The complete absence of pocket money audit and reconciliation records means Ofsted cannot verify that children's finances are being managed transparently, accurately, or in children's best interests. This represents a fundamental gap in Reg 5 and Reg 36 compliance and may raise safeguarding concerns about financial management.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Audit compliance metrics ---
  const totalAudits = audit_records.length;

  const auditsPassed = audit_records.filter(
    (a) => a.audit_outcome === "pass" || a.audit_outcome === "pass_with_observations",
  ).length;
  const auditPassRate = rate(auditsPassed, totalAudits);

  const childSignatures = audit_records.filter((a) => a.child_signature_obtained).length;
  const childSignatureRate = rate(childSignatures, totalAudits);

  const cashCountMatches = audit_records.filter((a) => a.cash_count_matches).length;
  const cashCountMatchRate = rate(cashCountMatches, totalAudits);

  // Composite audit compliance: pass + receipts + signatures + running total + cash count + ledger + dated + described + no unauthorized
  const auditComplianceChecks = [
    (a: AuditRecordInput) => a.audit_outcome === "pass" || a.audit_outcome === "pass_with_observations",
    (a: AuditRecordInput) => a.receipts_present,
    (a: AuditRecordInput) => a.receipts_match_records,
    (a: AuditRecordInput) => a.signatures_present,
    (a: AuditRecordInput) => a.running_total_accurate,
    (a: AuditRecordInput) => a.cash_count_matches,
    (a: AuditRecordInput) => a.ledger_up_to_date,
    (a: AuditRecordInput) => a.all_entries_dated,
    (a: AuditRecordInput) => a.all_entries_described,
    (a: AuditRecordInput) => a.no_unauthorized_transactions,
  ];
  const totalAuditChecksPossible = totalAudits * auditComplianceChecks.length;
  let totalAuditChecksPassed = 0;
  for (const rec of audit_records) {
    for (const check of auditComplianceChecks) {
      if (check(rec)) totalAuditChecksPassed++;
    }
  }
  const auditComplianceRate = rate(totalAuditChecksPassed, totalAuditChecksPossible);

  // Corrective actions metrics
  const auditsNeedingCorrection = audit_records.filter((a) => a.corrective_actions_needed).length;
  const correctiveActionsCompleted = audit_records.filter(
    (a) => a.corrective_actions_needed && a.corrective_actions_completed,
  ).length;
  const correctiveActionCompletionRate = rate(correctiveActionsCompleted, auditsNeedingCorrection);

  const auditsFailed = audit_records.filter((a) => a.audit_outcome === "fail").length;
  const auditFailRate = rate(auditsFailed, totalAudits);

  // --- Reconciliation accuracy metrics ---
  const totalReconciliations = reconciliation_records.length;

  const reconFullyBalanced = reconciliation_records.filter(
    (r) => r.reconciliation_outcome === "balanced",
  ).length;
  const reconPerfectRate = rate(reconFullyBalanced, totalReconciliations);

  const reconUnexplained = reconciliation_records.filter(
    (r) => r.reconciliation_outcome === "variance_unexplained",
  ).length;
  const reconUnexplainedRate = rate(reconUnexplained, totalReconciliations);

  const supervisorReviewed = reconciliation_records.filter((r) => r.supervisor_reviewed).length;
  const supervisorReviewRate = rate(supervisorReviewed, totalReconciliations);

  // Composite reconciliation accuracy: balanced + all accounted + bank matched + petty cash + savings + supervisor reviewed
  const reconAccuracyChecks = [
    (r: ReconciliationRecordInput) => r.reconciliation_outcome === "balanced" || r.reconciliation_outcome === "variance_explained",
    (r: ReconciliationRecordInput) => r.all_transactions_accounted,
    (r: ReconciliationRecordInput) => r.bank_statement_matched,
    (r: ReconciliationRecordInput) => r.petty_cash_reconciled,
    (r: ReconciliationRecordInput) => r.savings_balance_verified,
    (r: ReconciliationRecordInput) => r.supervisor_reviewed,
  ];
  const totalReconChecksPossible = totalReconciliations * reconAccuracyChecks.length;
  let totalReconChecksPassed = 0;
  for (const rec of reconciliation_records) {
    for (const check of reconAccuracyChecks) {
      if (check(rec)) totalReconChecksPassed++;
    }
  }
  const reconciliationAccuracyRate = rate(totalReconChecksPassed, totalReconChecksPossible);

  // --- Discrepancy resolution metrics ---
  const totalDiscrepancies = discrepancy_records.length;

  const discrepanciesResolved = discrepancy_records.filter(
    (d) => d.resolution_status === "resolved",
  ).length;
  const discrepancyResolutionRate = rate(discrepanciesResolved, totalDiscrepancies);

  const criticalDiscrepancies = discrepancy_records.filter(
    (d) => d.severity === "critical" || d.severity === "major",
  ).length;
  const criticalDiscrepancyRate = rate(criticalDiscrepancies, totalDiscrepancies);

  const rootCauseIdentified = discrepancy_records.filter((d) => d.root_cause_identified).length;
  const rootCauseRate = rate(rootCauseIdentified, totalDiscrepancies);

  const preventiveActionTaken = discrepancy_records.filter((d) => d.preventive_action_taken).length;
  const preventiveActionRate = rate(preventiveActionTaken, totalDiscrepancies);

  // Timeliness: resolved discrepancies within target timeframes
  const resolvedDiscrepancies = discrepancy_records.filter(
    (d) => d.resolution_status === "resolved" && d.days_to_resolve !== null,
  );
  const resolvedWithin7Days = resolvedDiscrepancies.filter(
    (d) => d.days_to_resolve !== null && d.days_to_resolve <= 7,
  ).length;
  const resolvedWithin14Days = resolvedDiscrepancies.filter(
    (d) => d.days_to_resolve !== null && d.days_to_resolve <= 14,
  ).length;
  const rapidResolutionRate = rate(resolvedWithin7Days, resolvedDiscrepancies.length);

  const avgDaysToResolve =
    resolvedDiscrepancies.length > 0
      ? Math.round(
          resolvedDiscrepancies.reduce((sum, d) => sum + (d.days_to_resolve ?? 0), 0) /
            resolvedDiscrepancies.length,
        )
      : 0;

  // Significant child impact
  const significantChildImpact = discrepancy_records.filter(
    (d) => d.child_impact === "significant" || d.child_impact === "moderate",
  ).length;
  const significantImpactRate = rate(significantChildImpact, totalDiscrepancies);

  // --- Transparency metrics ---
  const totalTransparency = transparency_records.length;

  const transparencyChecks = [
    (t: TransparencyRecordInput) => t.child_has_access_to_records,
    (t: TransparencyRecordInput) => t.records_explained_to_child,
    (t: TransparencyRecordInput) => t.child_receives_regular_statements,
    (t: TransparencyRecordInput) => t.pocket_money_amount_agreed,
    (t: TransparencyRecordInput) => t.amount_age_appropriate,
    (t: TransparencyRecordInput) => t.child_involved_in_budget_decisions,
    (t: TransparencyRecordInput) => t.spending_choices_respected,
    (t: TransparencyRecordInput) => t.financial_records_accessible,
    (t: TransparencyRecordInput) => t.complaints_process_explained,
    (t: TransparencyRecordInput) => t.independent_oversight_in_place,
  ];
  const totalTransparencyChecksPossible = totalTransparency * transparencyChecks.length;
  let totalTransparencyChecksPassed = 0;
  for (const rec of transparency_records) {
    for (const check of transparencyChecks) {
      if (check(rec)) totalTransparencyChecksPassed++;
    }
  }
  const transparencyRate = rate(totalTransparencyChecksPassed, totalTransparencyChecksPossible);

  const childInvolvedBudget = transparency_records.filter((t) => t.child_involved_in_budget_decisions).length;
  const childBudgetInvolvementRate = rate(childInvolvedBudget, totalTransparency);

  const spendingRespected = transparency_records.filter((t) => t.spending_choices_respected).length;
  const spendingRespectedRate = rate(spendingRespected, totalTransparency);

  const savingsDiscussed = transparency_records.filter((t) => t.savings_goals_discussed).length;
  const savingsDiscussedRate = rate(savingsDiscussed, totalTransparency);

  const independentOversight = transparency_records.filter((t) => t.independent_oversight_in_place).length;
  const independentOversightRate = rate(independentOversight, totalTransparency);

  // --- Child awareness metrics ---
  const totalAwareness = child_awareness_records.length;

  const awarenessChecks = [
    (c: ChildAwarenessRecordInput) => c.understands_pocket_money_amount,
    (c: ChildAwarenessRecordInput) => c.understands_how_amount_decided,
    (c: ChildAwarenessRecordInput) => c.knows_how_to_check_balance,
    (c: ChildAwarenessRecordInput) => c.knows_how_to_query_transaction,
    (c: ChildAwarenessRecordInput) => c.understands_saving_vs_spending,
    (c: ChildAwarenessRecordInput) => c.has_received_financial_education,
    (c: ChildAwarenessRecordInput) => c.can_manage_small_budget,
    (c: ChildAwarenessRecordInput) => c.understands_receipts_importance,
    (c: ChildAwarenessRecordInput) => c.feels_money_is_managed_fairly,
    (c: ChildAwarenessRecordInput) => c.age_appropriate_understanding,
  ];
  const totalAwarenessChecksPossible = totalAwareness * awarenessChecks.length;
  let totalAwarenessChecksPassed = 0;
  for (const rec of child_awareness_records) {
    for (const check of awarenessChecks) {
      if (check(rec)) totalAwarenessChecksPassed++;
    }
  }
  const childAwarenessRate = rate(totalAwarenessChecksPassed, totalAwarenessChecksPossible);

  const feelsManageFairly = child_awareness_records.filter((c) => c.feels_money_is_managed_fairly).length;
  const feelsFairRate = rate(feelsManageFairly, totalAwareness);

  const receivedFinancialEd = child_awareness_records.filter((c) => c.has_received_financial_education).length;
  const financialEdRate = rate(receivedFinancialEd, totalAwareness);

  const canManageBudget = child_awareness_records.filter((c) => c.can_manage_small_budget).length;
  const budgetManagementRate = rate(canManageBudget, totalAwareness);

  const childrenWithConcerns = child_awareness_records.filter((c) => c.has_raised_concerns).length;
  const concernsAddressed = child_awareness_records.filter(
    (c) => c.has_raised_concerns && c.concerns_addressed,
  ).length;
  const concernsAddressedRate = rate(concernsAddressed, childrenWithConcerns);

  // --- Timeliness composite ---
  // Combines: corrective action timeliness, discrepancy resolution timeliness, supervisor review timeliness
  const timelinessNumerator =
    correctiveActionsCompleted +
    resolvedWithin14Days +
    supervisorReviewed;
  const timelinessDenominator =
    auditsNeedingCorrection +
    resolvedDiscrepancies.length +
    totalReconciliations;
  const timelinessRate = rate(timelinessNumerator, timelinessDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: auditComplianceRate (>=90: +5, >=70: +2) ---
  if (meets(auditComplianceRate, 90)) score += 5;
  else if (meets(auditComplianceRate, 70)) score += 2;

  // --- Bonus 2: reconciliationAccuracyRate (>=90: +5, >=70: +2) ---
  if (meets(reconciliationAccuracyRate, 90)) score += 5;
  else if (meets(reconciliationAccuracyRate, 70)) score += 2;

  // --- Bonus 3: discrepancyResolutionRate (>=90: +4, >=70: +2) ---
  if (meets(discrepancyResolutionRate, 90)) score += 4;
  else if (meets(discrepancyResolutionRate, 70)) score += 2;

  // --- Bonus 4: transparencyRate (>=90: +4, >=70: +2) ---
  if (meets(transparencyRate, 90)) score += 4;
  else if (meets(transparencyRate, 70)) score += 2;

  // --- Bonus 5: childAwarenessRate (>=90: +4, >=70: +2) ---
  if (meets(childAwarenessRate, 90)) score += 4;
  else if (meets(childAwarenessRate, 70)) score += 2;

  // --- Bonus 6: timelinessRate (>=90: +3, >=70: +1) ---
  if (meets(timelinessRate, 90)) score += 3;
  else if (meets(timelinessRate, 70)) score += 1;

  // --- Bonus 7: rootCauseRate (>=90: +3, >=70: +1) ---
  if (meets(rootCauseRate, 90)) score += 3;
  else if (meets(rootCauseRate, 70)) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // auditComplianceRate < 50 → -6
  if (below(auditComplianceRate, 50) && audit_records.length > 0) score -= 6;

  // reconciliationAccuracyRate < 50 → -6
  if (below(reconciliationAccuracyRate, 50) && reconciliation_records.length > 0) score -= 6;

  // criticalDiscrepancyRate > 40 → -5
  if (above(criticalDiscrepancyRate, 40) && discrepancy_records.length > 0) score -= 5;

  // transparencyRate < 40 → -5
  if (below(transparencyRate, 40) && transparency_records.length > 0) score -= 5;

  score = clamp(score, 0, 100);

  const audit_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(auditComplianceRate, 90) && totalAudits > 0) {
    strengths.push(
      `${auditComplianceRate}% audit compliance — pocket money audits consistently meet all required standards including receipt verification, accurate running totals, cash counts, and complete documentation.`,
    );
  } else if (meets(auditComplianceRate, 70) && totalAudits > 0) {
    strengths.push(
      `${auditComplianceRate}% audit compliance — the home generally maintains good standards in pocket money auditing with the majority of checks passed.`,
    );
  }

  if (meets(reconciliationAccuracyRate, 90) && totalReconciliations > 0) {
    strengths.push(
      `${reconciliationAccuracyRate}% reconciliation accuracy — pocket money reconciliations are consistently accurate with balances verified, transactions accounted for, and supervisory oversight in place.`,
    );
  } else if (meets(reconciliationAccuracyRate, 70) && totalReconciliations > 0) {
    strengths.push(
      `${reconciliationAccuracyRate}% reconciliation accuracy — the home demonstrates generally reliable reconciliation of children's pocket money accounts.`,
    );
  }

  if (meets(discrepancyResolutionRate, 90) && totalDiscrepancies > 0) {
    strengths.push(
      `${discrepancyResolutionRate}% discrepancy resolution — financial discrepancies are identified and resolved promptly, demonstrating robust financial governance and accountability.`,
    );
  } else if (meets(discrepancyResolutionRate, 70) && totalDiscrepancies > 0) {
    strengths.push(
      `${discrepancyResolutionRate}% discrepancy resolution — the majority of identified financial discrepancies are resolved effectively.`,
    );
  }

  if (meets(transparencyRate, 90) && totalTransparency > 0) {
    strengths.push(
      `${transparencyRate}% transparency — children have excellent access to their financial records, receive regular statements, and are actively involved in budget decisions with their spending choices respected.`,
    );
  } else if (meets(transparencyRate, 70) && totalTransparency > 0) {
    strengths.push(
      `${transparencyRate}% transparency — the home provides generally good financial transparency to children regarding their pocket money.`,
    );
  }

  if (meets(childAwarenessRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${childAwarenessRate}% child financial awareness — children demonstrate strong understanding of their pocket money, how to check balances, query transactions, and manage budgets, reflecting excellent financial education provision.`,
    );
  } else if (meets(childAwarenessRate, 70) && totalAwareness > 0) {
    strengths.push(
      `${childAwarenessRate}% child financial awareness — the majority of children have good understanding of their pocket money arrangements and financial management skills.`,
    );
  }

  if (meets(timelinessRate, 90) && timelinessDenominator > 0) {
    strengths.push(
      `${timelinessRate}% timeliness — corrective actions, discrepancy resolutions, and supervisory reviews are completed promptly, demonstrating responsive financial management.`,
    );
  } else if (meets(timelinessRate, 70) && timelinessDenominator > 0) {
    strengths.push(
      `${timelinessRate}% timeliness — financial management actions are generally completed within acceptable timeframes.`,
    );
  }

  if (meets(auditPassRate, 95) && totalAudits > 0) {
    strengths.push(
      `${auditPassRate}% of pocket money audits passed — the home demonstrates consistently high audit standards, providing strong evidence of robust financial management for Ofsted.`,
    );
  } else if (meets(auditPassRate, 85) && totalAudits > 0) {
    strengths.push(
      `${auditPassRate}% of pocket money audits passed — the home maintains a strong audit pass rate across pocket money management.`,
    );
  }

  if (meets(cashCountMatchRate, 95) && totalAudits > 0) {
    strengths.push(
      `${cashCountMatchRate}% cash count accuracy — physical cash consistently matches recorded balances, evidencing meticulous financial management.`,
    );
  }

  if (meets(supervisorReviewRate, 90) && totalReconciliations > 0) {
    strengths.push(
      `${supervisorReviewRate}% supervisor review of reconciliations — management oversight of financial processes is thorough and consistent, demonstrating strong governance.`,
    );
  } else if (meets(supervisorReviewRate, 70) && totalReconciliations > 0) {
    strengths.push(
      `${supervisorReviewRate}% supervisor review of reconciliations — management generally provides appropriate oversight of financial processes.`,
    );
  }

  if (meets(rootCauseRate, 90) && totalDiscrepancies > 0) {
    strengths.push(
      `${rootCauseRate}% root cause analysis for discrepancies — the home consistently identifies underlying causes of financial discrepancies, enabling systemic improvements to prevent recurrence.`,
    );
  } else if (meets(rootCauseRate, 70) && totalDiscrepancies > 0) {
    strengths.push(
      `${rootCauseRate}% root cause identification — the home generally investigates the underlying causes of financial discrepancies.`,
    );
  }

  if (meets(preventiveActionRate, 90) && totalDiscrepancies > 0) {
    strengths.push(
      `${preventiveActionRate}% preventive action rate — the home consistently implements preventive measures after discrepancies, demonstrating a learning culture in financial management.`,
    );
  }

  if (meets(feelsFairRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${feelsFairRate}% of children feel their money is managed fairly — children have confidence in the home's financial management, reflecting transparent and child-centred practices.`,
    );
  } else if (meets(feelsFairRate, 70) && totalAwareness > 0) {
    strengths.push(
      `${feelsFairRate}% of children feel their money is managed fairly — most children express confidence in how their pocket money is handled.`,
    );
  }

  if (meets(childSignatureRate, 90) && totalAudits > 0) {
    strengths.push(
      `${childSignatureRate}% child signature rate on audits — children are actively involved in verifying their financial records, promoting ownership and transparency.`,
    );
  }

  if (meets(spendingRespectedRate, 90) && totalTransparency > 0) {
    strengths.push(
      `${spendingRespectedRate}% of children's spending choices respected — the home appropriately balances financial guidance with children's autonomy in spending decisions.`,
    );
  }

  if (meets(financialEdRate, 90) && totalAwareness > 0) {
    strengths.push(
      `${financialEdRate}% of children have received financial education — the home actively equips children with financial literacy skills for independence.`,
    );
  } else if (meets(financialEdRate, 70) && totalAwareness > 0) {
    strengths.push(
      `${financialEdRate}% of children have received financial education — the home provides financial literacy education to the majority of children.`,
    );
  }

  if (meets(concernsAddressedRate, 90) && childrenWithConcerns > 0) {
    strengths.push(
      `${concernsAddressedRate}% of children's financial concerns addressed — when children raise issues about their pocket money, the home responds effectively and resolves them.`,
    );
  }

  if (meets(rapidResolutionRate, 90) && resolvedDiscrepancies.length > 0) {
    strengths.push(
      `${rapidResolutionRate}% of discrepancies resolved within 7 days — the home demonstrates excellent responsiveness to financial issues, minimising the impact on children.`,
    );
  }

  if (meets(independentOversightRate, 90) && totalTransparency > 0) {
    strengths.push(
      `${independentOversightRate}% independent oversight in place — the home ensures pocket money management is subject to independent verification, strengthening governance.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(auditComplianceRate, 50) && totalAudits > 0) {
    concerns.push(
      `Only ${auditComplianceRate}% audit compliance — the majority of pocket money audits are failing to meet required standards. Receipts, running totals, cash counts, or documentation are consistently deficient, representing a significant failure in financial governance.`,
    );
  } else if (below(auditComplianceRate, 70) && meets(auditComplianceRate, 50) && totalAudits > 0) {
    concerns.push(
      `Audit compliance at ${auditComplianceRate}% — pocket money audits are not consistently meeting all required standards, with gaps in documentation, verification, or accuracy.`,
    );
  }

  if (below(reconciliationAccuracyRate, 50) && totalReconciliations > 0) {
    concerns.push(
      `Only ${reconciliationAccuracyRate}% reconciliation accuracy — the majority of reconciliations reveal significant issues with balance verification, transaction accounting, or supervisory oversight. Children's finances are not being managed with adequate accuracy.`,
    );
  } else if (below(reconciliationAccuracyRate, 70) && meets(reconciliationAccuracyRate, 50) && totalReconciliations > 0) {
    concerns.push(
      `Reconciliation accuracy at ${reconciliationAccuracyRate}% — pocket money reconciliations are not consistently achieving acceptable accuracy standards.`,
    );
  }

  if (below(discrepancyResolutionRate, 50) && totalDiscrepancies > 0) {
    concerns.push(
      `Only ${discrepancyResolutionRate}% discrepancy resolution — the majority of identified financial discrepancies remain unresolved, which may leave children's finances at risk and demonstrates inadequate financial management oversight.`,
    );
  } else if (below(discrepancyResolutionRate, 70) && meets(discrepancyResolutionRate, 50) && totalDiscrepancies > 0) {
    concerns.push(
      `Discrepancy resolution at ${discrepancyResolutionRate}% — a significant proportion of financial discrepancies are not being resolved in a timely manner.`,
    );
  }

  if (below(transparencyRate, 40) && totalTransparency > 0) {
    concerns.push(
      `Only ${transparencyRate}% transparency — children lack adequate access to their financial records, are not receiving regular statements, and are not being involved in budget decisions. This undermines children's rights to understand and have oversight of their own finances.`,
    );
  } else if (below(transparencyRate, 70) && meets(transparencyRate, 40) && totalTransparency > 0) {
    concerns.push(
      `Transparency at ${transparencyRate}% — financial transparency to children needs improvement, with gaps in access to records, regular statements, or involvement in budget decisions.`,
    );
  }

  if (below(childAwarenessRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Only ${childAwarenessRate}% child financial awareness — children do not adequately understand their pocket money arrangements, how to check balances, or how to raise concerns. This leaves children disempowered regarding their own finances.`,
    );
  } else if (below(childAwarenessRate, 70) && meets(childAwarenessRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Child financial awareness at ${childAwarenessRate}% — a notable proportion of children lack adequate understanding of their pocket money arrangements and financial management.`,
    );
  }

  if (above(criticalDiscrepancyRate, 40) && totalDiscrepancies > 0) {
    concerns.push(
      `${criticalDiscrepancyRate}% of discrepancies are critical or major — a high proportion of financial discrepancies are serious in nature, indicating systemic weaknesses in pocket money management that may place children's finances at risk.`,
    );
  } else if (above(criticalDiscrepancyRate, 20) && criticalDiscrepancyRate! <= 40 && totalDiscrepancies > 0) {
    concerns.push(
      `${criticalDiscrepancyRate}% of discrepancies are critical or major — a notable proportion of financial discrepancies are serious, requiring focused attention to prevent recurrence.`,
    );
  }

  if (above(auditFailRate, 30) && totalAudits > 0) {
    concerns.push(
      `${auditFailRate}% audit failure rate — a significant proportion of pocket money audits are failing, indicating persistent deficiencies in financial record-keeping and management.`,
    );
  } else if (above(auditFailRate, 15) && auditFailRate! <= 30 && totalAudits > 0) {
    concerns.push(
      `${auditFailRate}% audit failure rate — the proportion of failed audits requires attention to identify and address recurring issues in pocket money management.`,
    );
  }

  if (above(reconUnexplainedRate, 30) && totalReconciliations > 0) {
    concerns.push(
      `${reconUnexplainedRate}% of reconciliations have unexplained variances — money is unaccounted for, which raises serious concerns about the integrity of financial management and may indicate mismanagement.`,
    );
  } else if (above(reconUnexplainedRate, 15) && reconUnexplainedRate! <= 30 && totalReconciliations > 0) {
    concerns.push(
      `${reconUnexplainedRate}% of reconciliations have unexplained variances — some pocket money balances cannot be fully accounted for.`,
    );
  }

  if (below(feelsFairRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Only ${feelsFairRate}% of children feel their money is managed fairly — a majority of children lack confidence in how their finances are handled, which may indicate a lack of transparency or perceived unfairness in pocket money management.`,
    );
  } else if (below(feelsFairRate, 70) && meets(feelsFairRate, 50) && totalAwareness > 0) {
    concerns.push(
      `Only ${feelsFairRate}% of children feel their money is managed fairly — a significant proportion of children are not confident in the fairness of pocket money management.`,
    );
  }

  if (below(supervisorReviewRate, 50) && totalReconciliations > 0) {
    concerns.push(
      `Only ${supervisorReviewRate}% supervisor review of reconciliations — management oversight of financial processes is inadequate, meaning errors and discrepancies may go unchecked.`,
    );
  } else if (below(supervisorReviewRate, 70) && meets(supervisorReviewRate, 50) && totalReconciliations > 0) {
    concerns.push(
      `Supervisor review rate at ${supervisorReviewRate}% — not all reconciliations are receiving management oversight, which weakens financial governance.`,
    );
  }

  if (above(significantImpactRate, 30) && totalDiscrepancies > 0) {
    concerns.push(
      `${significantImpactRate}% of discrepancies have moderate or significant child impact — financial discrepancies are directly affecting children's access to their money or their trust in the home's financial management.`,
    );
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No pocket money audits recorded despite children being on placement — the home cannot evidence that children's pocket money is being audited or that financial records are being verified.",
    );
  }

  if (totalReconciliations === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No pocket money reconciliations recorded — the home cannot evidence that children's financial balances are being verified against actual holdings.",
    );
  }

  if (totalTransparency === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No financial transparency records — the home cannot evidence that children have access to their financial records or understand their pocket money arrangements.",
    );
  }

  if (totalAwareness === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child financial awareness assessments recorded — the home cannot evidence that children understand their pocket money arrangements or are developing financial literacy skills.",
    );
  }

  if (below(correctiveActionCompletionRate, 50) && auditsNeedingCorrection > 0) {
    concerns.push(
      `Only ${correctiveActionCompletionRate}% of corrective actions completed — issues identified in audits are not being addressed, meaning the same problems are likely to recur.`,
    );
  }

  if (below(rootCauseRate, 50) && totalDiscrepancies > 0) {
    concerns.push(
      `Only ${rootCauseRate}% root cause analysis — the home is not consistently investigating why discrepancies occur, limiting its ability to prevent recurrence and learn from financial management failures.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: PocketMoneyAuditRecommendation[] = [];
  let rank = 0;

  if (below(auditComplianceRate, 50) && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently overhaul pocket money audit processes — ensure every audit verifies receipts, running totals, cash counts, signatures, and complete documentation. Provide staff training on audit standards and implement quality assurance checks on completed audits.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (below(reconciliationAccuracyRate, 50) && totalReconciliations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement robust reconciliation procedures immediately — every reconciliation must verify expected versus actual balances, account for all transactions, match bank statements, verify petty cash, and receive supervisory sign-off.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (above(criticalDiscrepancyRate, 40) && totalDiscrepancies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate review of all critical and major financial discrepancies — identify systemic causes, implement corrective measures, and consider whether safeguarding thresholds have been met regarding financial mismanagement affecting children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
    });
  }

  if (below(transparencyRate, 40) && totalTransparency > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve financial transparency — ensure every child has access to their financial records, receives regular statements, understands their pocket money amount, and is involved in budget decisions. Children must be empowered to understand and oversee their own finances.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (above(reconUnexplainedRate, 30) && totalReconciliations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and resolve all unexplained variances in pocket money reconciliations immediately — unaccounted money raises serious governance concerns. Implement segregation of duties and additional verification controls.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured pocket money audit schedule immediately — establish weekly, monthly, and quarterly audits with clear standards, documented outcomes, and corrective action tracking.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (totalReconciliations === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin regular pocket money reconciliations for all children — reconcile expected and actual balances at least monthly, with supervisory review and documentation of any variances.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (below(discrepancyResolutionRate, 50) && totalDiscrepancies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a clear discrepancy resolution process with defined timeframes — all financial discrepancies must be investigated, resolved, and documented within 14 days, with root cause analysis and preventive actions implemented.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (below(feelsFairRate, 50) && totalAwareness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently consult children about their experience of pocket money management — understand why children do not feel their money is managed fairly and take concrete steps to address their concerns, improving trust and transparency.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(childAwarenessRate, 50) && totalAwareness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement comprehensive financial awareness education for all children — ensure every child understands their pocket money amount, how to check their balance, how to raise concerns, and basic budgeting skills.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (below(supervisorReviewRate, 50) && totalReconciliations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all reconciliations receive supervisory review and sign-off — management oversight is essential for financial governance and must be embedded as a non-negotiable step in the reconciliation process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (below(correctiveActionCompletionRate, 50) && auditsNeedingCorrection > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a corrective action tracker for audit findings — all issues identified during audits must be addressed within defined timeframes, with completion monitored by management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (below(rootCauseRate, 50) && totalDiscrepancies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed root cause analysis in the discrepancy resolution process — without understanding why discrepancies occur, the home cannot implement effective preventive measures or demonstrate learning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (totalTransparency === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish financial transparency records for every child — document access to records, statement provision, budget involvement, and complaints awareness to evidence child-centred financial management.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalAwareness === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct child financial awareness assessments for all children on placement — understand each child's financial literacy level and create support plans to develop their understanding and independence skills.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (
    meets(auditComplianceRate, 50) &&
    below(auditComplianceRate, 70) &&
    totalAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve audit compliance to at least 70% — review which specific checks are most commonly failed and provide targeted staff training and quality assurance to address persistent gaps.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (
    meets(reconciliationAccuracyRate, 50) &&
    below(reconciliationAccuracyRate, 70) &&
    totalReconciliations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance reconciliation accuracy through improved procedures and staff training — target areas where accuracy consistently falls short, particularly bank statement matching and supervisory review.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (
    meets(discrepancyResolutionRate, 50) &&
    below(discrepancyResolutionRate, 70) &&
    totalDiscrepancies > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve discrepancy resolution rate to above 70% — review outstanding discrepancies, prioritise by severity, and allocate dedicated time for investigation and resolution.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (
    meets(transparencyRate, 40) &&
    below(transparencyRate, 70) &&
    totalTransparency > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen financial transparency by ensuring all children receive regular statements, have access to records, and are involved in budget discussions appropriate to their age and understanding.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    meets(childAwarenessRate, 50) &&
    below(childAwarenessRate, 70) &&
    totalAwareness > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a structured financial education programme for children — cover budgeting, saving, understanding receipts, and how to query transactions to build independence skills.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (below(childSignatureRate, 70) && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children sign their pocket money audit records where age-appropriate — this promotes ownership, transparency, and provides evidence that children are involved in verifying their financial records.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(preventiveActionRate, 70) && totalDiscrepancies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement preventive actions after each resolved discrepancy — document what changes have been made to prevent recurrence, building a culture of continuous improvement in financial management.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (below(savingsDiscussedRate, 70) && totalTransparency > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Discuss savings goals with all children as part of regular keyworking or financial check-ins — help children understand the value of saving and set age-appropriate goals.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (
    above(significantImpactRate, 20) &&
    significantImpactRate! <= 30 &&
    totalDiscrepancies > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Monitor and reduce the impact of financial discrepancies on children — ensure discrepancies are resolved before they affect children's access to their money and that children are kept informed throughout.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: PocketMoneyAuditInsight[] = [];

  // -- Critical insights --

  if (below(auditComplianceRate, 50) && totalAudits > 0) {
    insights.push({
      text: `Only ${auditComplianceRate}% audit compliance. Ofsted expects children's homes to manage pocket money with the same rigour as any fiduciary responsibility. When audits consistently fail to verify receipts, cash counts, and running totals, the home cannot evidence that children's finances are being safeguarded. This is a Reg 36 compliance failure.`,
      severity: "critical",
    });
  }

  if (below(reconciliationAccuracyRate, 50) && totalReconciliations > 0) {
    insights.push({
      text: `Only ${reconciliationAccuracyRate}% reconciliation accuracy. Inaccurate reconciliations mean the home cannot verify that children's pocket money balances are correct. This creates risk of undetected loss, misappropriation, or error that directly affects children's financial wellbeing.`,
      severity: "critical",
    });
  }

  if (above(criticalDiscrepancyRate, 40) && totalDiscrepancies > 0) {
    insights.push({
      text: `${criticalDiscrepancyRate}% of discrepancies are critical or major. A high proportion of serious financial discrepancies indicates systemic weaknesses in pocket money management. Ofsted may view this as evidence of inadequate leadership and management, particularly regarding financial governance and children's welfare.`,
      severity: "critical",
    });
  }

  if (below(transparencyRate, 40) && totalTransparency > 0) {
    insights.push({
      text: `Only ${transparencyRate}% financial transparency. Children in care have a right to understand and oversee their own finances. When transparency is critically low, children cannot verify their balances, understand their entitlements, or raise concerns effectively — this undermines their voice and their rights.`,
      severity: "critical",
    });
  }

  if (above(reconUnexplainedRate, 30) && totalReconciliations > 0) {
    insights.push({
      text: `${reconUnexplainedRate}% of reconciliations have unexplained variances. Unaccounted money in children's pocket money accounts is a serious governance concern. This may indicate inadequate record-keeping, potential misappropriation, or systemic failures in financial controls that could constitute a safeguarding issue.`,
      severity: "critical",
    });
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No pocket money audits recorded despite children being on placement. Without audit records, the home cannot evidence that children's financial records have been verified, that cash counts have been performed, or that pocket money management meets any standard. This is a fundamental gap in Reg 36 compliance.",
      severity: "critical",
    });
  }

  if (totalReconciliations === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No pocket money reconciliations recorded. Reconciliation is the primary mechanism for detecting errors, discrepancies, and potential mismanagement. Its complete absence means the home has no financial verification processes in place for children's money.",
      severity: "critical",
    });
  }

  if (below(discrepancyResolutionRate, 50) && totalDiscrepancies > 0) {
    insights.push({
      text: `Only ${discrepancyResolutionRate}% discrepancy resolution. Unresolved financial discrepancies accumulate risk and may indicate that the home lacks the capacity or commitment to investigate and resolve financial issues. Children's finances remain at risk until discrepancies are addressed.`,
      severity: "critical",
    });
  }

  if (below(feelsFairRate, 50) && totalAwareness > 0) {
    insights.push({
      text: `Only ${feelsFairRate}% of children feel their money is managed fairly. When the majority of children do not trust the home's financial management, this is a significant safeguarding and welfare concern. Children's perceptions of financial unfairness can erode trust in the home overall and may indicate real issues with how money is handled.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(auditComplianceRate, 50) &&
    below(auditComplianceRate, 70) &&
    totalAudits > 0
  ) {
    insights.push({
      text: `Audit compliance at ${auditComplianceRate}% — improving but not yet meeting the standard expected. Common gaps may include incomplete receipts, missing signatures, or inaccurate running totals. Targeted training on specific failing areas could yield significant improvement.`,
      severity: "warning",
    });
  }

  if (
    meets(reconciliationAccuracyRate, 50) &&
    below(reconciliationAccuracyRate, 70) &&
    totalReconciliations > 0
  ) {
    insights.push({
      text: `Reconciliation accuracy at ${reconciliationAccuracyRate}% — some reconciliation checks are not consistently being met. Review whether the issues are procedural (missing steps) or systemic (inadequate tools or training) and address accordingly.`,
      severity: "warning",
    });
  }

  if (
    meets(discrepancyResolutionRate, 50) &&
    below(discrepancyResolutionRate, 70) &&
    totalDiscrepancies > 0
  ) {
    insights.push({
      text: `Discrepancy resolution at ${discrepancyResolutionRate}% — some financial discrepancies remain unresolved. Consider whether resource constraints, unclear procedures, or lack of prioritisation are preventing timely resolution.`,
      severity: "warning",
    });
  }

  if (
    meets(transparencyRate, 40) &&
    below(transparencyRate, 70) &&
    totalTransparency > 0
  ) {
    insights.push({
      text: `Financial transparency at ${transparencyRate}% — children's access to their financial information is inconsistent. Ensuring all children receive regular statements and understand their pocket money arrangements should be a priority for promoting children's rights and voice.`,
      severity: "warning",
    });
  }

  if (
    meets(childAwarenessRate, 50) &&
    below(childAwarenessRate, 70) &&
    totalAwareness > 0
  ) {
    insights.push({
      text: `Child financial awareness at ${childAwarenessRate}% — some children do not fully understand their pocket money arrangements. Building financial literacy is a key independence skill that supports children's transition to adulthood.`,
      severity: "warning",
    });
  }

  if (
    meets(supervisorReviewRate, 50) &&
    below(supervisorReviewRate, 70) &&
    totalReconciliations > 0
  ) {
    insights.push({
      text: `Supervisor review rate at ${supervisorReviewRate}% — not all reconciliations are receiving management oversight. Consistent supervisory review is essential for financial governance and detecting issues that individual staff may miss.`,
      severity: "warning",
    });
  }

  if (
    above(auditFailRate, 15) &&
    auditFailRate! <= 30 &&
    totalAudits > 0
  ) {
    insights.push({
      text: `Audit failure rate at ${auditFailRate}% — some audits are consistently failing. Analyse the common reasons for failure and provide targeted support to improve audit quality.`,
      severity: "warning",
    });
  }

  if (
    meets(correctiveActionCompletionRate, 50) &&
    below(correctiveActionCompletionRate, 70) &&
    auditsNeedingCorrection > 0
  ) {
    insights.push({
      text: `Corrective action completion at ${correctiveActionCompletionRate}% — some issues identified in audits are not being addressed. Without completing corrective actions, the same problems will recur in subsequent audits.`,
      severity: "warning",
    });
  }

  if (
    meets(rootCauseRate, 50) &&
    below(rootCauseRate, 70) &&
    totalDiscrepancies > 0
  ) {
    insights.push({
      text: `Root cause identification at ${rootCauseRate}% — not all discrepancies are being investigated to understand why they occurred. Root cause analysis is essential for preventing recurrence and demonstrating a learning culture.`,
      severity: "warning",
    });
  }

  if (avgDaysToResolve > 14 && resolvedDiscrepancies.length > 0) {
    insights.push({
      text: `Average ${avgDaysToResolve} days to resolve discrepancies — resolution is taking longer than the recommended 14-day target. Prolonged unresolved discrepancies increase risk to children's finances and may undermine their trust in the home.`,
      severity: "warning",
    });
  } else if (avgDaysToResolve > 7 && avgDaysToResolve <= 14 && resolvedDiscrepancies.length > 0) {
    insights.push({
      text: `Average ${avgDaysToResolve} days to resolve discrepancies — within the 14-day target but could be improved. Aim to resolve the majority of discrepancies within 7 days for optimal financial governance.`,
      severity: "warning",
    });
  }

  // Discrepancy type analysis
  const discrepancyTypes: Record<string, number> = {};
  for (const d of discrepancy_records) {
    discrepancyTypes[d.discrepancy_type] = (discrepancyTypes[d.discrepancy_type] ?? 0) + 1;
  }
  const topDiscrepancies = Object.entries(discrepancyTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topDiscrepancies.length > 0) {
    const formatted = topDiscrepancies
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common discrepancy types: ${formatted}. Understanding the pattern of discrepancies enables targeted interventions — recurring types may indicate training gaps, procedural weaknesses, or systemic issues in pocket money management.`,
      severity: "warning",
    });
  }

  if (
    below(childBudgetInvolvementRate, 50) &&
    totalTransparency > 0
  ) {
    insights.push({
      text: `Only ${childBudgetInvolvementRate}% of children are involved in budget decisions. Involving children in financial decisions appropriate to their age builds independence skills and ensures pocket money arrangements reflect their needs and preferences.`,
      severity: "warning",
    });
  }

  if (below(financialEdRate, 50) && totalAwareness > 0) {
    insights.push({
      text: `Only ${financialEdRate}% of children have received financial education. Financial literacy is a critical independence skill — children leaving care without these skills are at increased risk of financial exploitation, debt, and poverty.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (audit_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding pocket money audit and reconciliation quality — financial records are accurate, audits are comprehensive, discrepancies are resolved promptly, children have transparent access to their finances, and financial awareness is actively developed. This provides strong evidence for Reg 5, Reg 36, and SCCIF leadership and management compliance.",
      severity: "positive",
    });
  }

  if (
    meets(auditComplianceRate, 90) &&
    meets(auditPassRate, 95) &&
    totalAudits > 0
  ) {
    insights.push({
      text: `${auditComplianceRate}% audit compliance with ${auditPassRate}% pass rate — the home maintains exemplary pocket money audit standards. This level of financial governance provides clear evidence that children's money is being managed with rigour, accuracy, and accountability.`,
      severity: "positive",
    });
  }

  if (
    meets(reconciliationAccuracyRate, 90) &&
    meets(reconPerfectRate, 80) &&
    totalReconciliations > 0
  ) {
    insights.push({
      text: `${reconciliationAccuracyRate}% reconciliation accuracy with ${reconPerfectRate}% achieving perfect balance — pocket money reconciliations consistently demonstrate that children's financial records are accurate and complete. This is strong evidence of robust financial management.`,
      severity: "positive",
    });
  }

  if (
    meets(discrepancyResolutionRate, 90) &&
    meets(rootCauseRate, 90) &&
    totalDiscrepancies > 0
  ) {
    insights.push({
      text: `${discrepancyResolutionRate}% discrepancy resolution with ${rootCauseRate}% root cause analysis — the home not only resolves financial discrepancies effectively but investigates why they occurred, demonstrating a learning culture that continuously strengthens financial governance.`,
      severity: "positive",
    });
  }

  if (
    meets(transparencyRate, 90) &&
    meets(childAwarenessRate, 90) &&
    totalTransparency > 0 &&
    totalAwareness > 0
  ) {
    insights.push({
      text: `${transparencyRate}% transparency combined with ${childAwarenessRate}% child awareness — children have excellent access to their financial records and demonstrate strong understanding of their pocket money. This child-centred approach empowers children and builds essential independence skills.`,
      severity: "positive",
    });
  }

  if (
    meets(feelsFairRate, 90) &&
    totalAwareness > 0
  ) {
    insights.push({
      text: `${feelsFairRate}% of children feel their money is managed fairly — children have strong confidence in the home's financial management. This level of trust reflects transparent, consistent, and child-centred financial practices that genuinely serve children's interests.`,
      severity: "positive",
    });
  }

  if (
    meets(supervisorReviewRate, 90) &&
    totalReconciliations > 0
  ) {
    insights.push({
      text: `${supervisorReviewRate}% supervisor review of reconciliations — management oversight of financial processes is thorough and embedded in practice. This provides assurance that pocket money management is subject to appropriate governance and accountability.`,
      severity: "positive",
    });
  }

  if (
    meets(preventiveActionRate, 90) &&
    totalDiscrepancies > 0
  ) {
    insights.push({
      text: `${preventiveActionRate}% preventive action rate — the home consistently implements measures to prevent recurrence of financial discrepancies. This demonstrates excellent organisational learning and a commitment to continuous improvement in financial management.`,
      severity: "positive",
    });
  }

  if (
    meets(rapidResolutionRate, 90) &&
    resolvedDiscrepancies.length > 0
  ) {
    insights.push({
      text: `${rapidResolutionRate}% of discrepancies resolved within 7 days — the home demonstrates excellent responsiveness to financial issues. Rapid resolution minimises the impact on children and maintains trust in the financial management process.`,
      severity: "positive",
    });
  }

  if (
    meets(childSignatureRate, 90) &&
    meets(spendingRespectedRate, 90) &&
    totalAudits > 0 &&
    totalTransparency > 0
  ) {
    insights.push({
      text: `${childSignatureRate}% child signature rate with ${spendingRespectedRate}% spending choices respected — children are actively involved in verifying their financial records and their autonomy in spending decisions is appropriately supported. This exemplifies child-centred financial practice.`,
      severity: "positive",
    });
  }

  if (
    meets(financialEdRate, 90) &&
    meets(budgetManagementRate, 80) &&
    totalAwareness > 0
  ) {
    insights.push({
      text: `${financialEdRate}% financial education provision with ${budgetManagementRate}% demonstrating budget management skills — the home is effectively preparing children for financial independence through education and practical skill development.`,
      severity: "positive",
    });
  }

  if (
    meets(concernsAddressedRate, 90) &&
    childrenWithConcerns > 0
  ) {
    insights.push({
      text: `${concernsAddressedRate}% of children's financial concerns addressed — when children raise issues about their pocket money, the home responds effectively. This demonstrates that the complaints and feedback process works well for financial matters.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (audit_rating === "outstanding") {
    headline =
      "Outstanding pocket money audit and reconciliation quality — financial records are accurate, audits are thorough, discrepancies are resolved promptly, and children have transparent access to their finances.";
  } else if (audit_rating === "good") {
    headline = `Good pocket money audit and reconciliation quality — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (audit_rating === "adequate") {
    headline = `Adequate pocket money audit and reconciliation quality — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's finances are managed transparently and accurately.`;
  } else {
    headline = `Pocket money audit and reconciliation quality is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's financial welfare is protected.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    audit_rating,
    audit_score: score,
    headline,
    total_audits: totalAudits,
    total_reconciliations: totalReconciliations,
    total_discrepancies: totalDiscrepancies,
    audit_compliance_rate: auditComplianceRate,
    reconciliation_accuracy_rate: reconciliationAccuracyRate,
    discrepancy_resolution_rate: discrepancyResolutionRate,
    transparency_rate: transparencyRate,
    child_awareness_rate: childAwarenessRate,
    timeliness_rate: timelinessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
