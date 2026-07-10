// ==============================================================================
// CARA -- CLOTHING ALLOWANCE & WARDROBE MANAGEMENT SERVICE
// Tracks clothing purchases, allowances, wardrobe audits, style consultations,
// school uniforms, and seasonal clothing for looked-after children. Covers child
// choice, age appropriateness, condition, quantity, brand preferences, cultural
// needs, receipts, season suitability, and school requirements.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — ensuring children are well-clothed),
// Reg 5 (individual needs),
// SCCIF: Experiences — "Children have appropriate clothing."
// Corporate Parenting Principles — children should have what peers have.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Seasonal Allowance",
  "Emergency Purchase",
  "School Uniform",
  "Sports Kit",
  "Special Occasion Outfit",
  "Footwear",
  "Outerwear",
  "Underwear/Socks",
  "Accessories",
  "Style Consultation",
  "Wardrobe Audit",
  "Budget Planning",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const BUDGET_PERIODS = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Seasonal",
  "Annual",
  "One-Off",
] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const ESSENTIAL_TYPES: RecordType[] = [
  "School Uniform",
  "Footwear",
  "Outerwear",
  "Underwear/Socks",
];

export const DISCRETIONARY_TYPES: RecordType[] = [
  "Special Occasion Outfit",
  "Accessories",
  "Style Consultation",
];

export const PLANNING_TYPES: RecordType[] = [
  "Wardrobe Audit",
  "Budget Planning",
  "Style Consultation",
];

export const PURCHASE_TYPES: RecordType[] = [
  "Seasonal Allowance",
  "Emergency Purchase",
  "School Uniform",
  "Sports Kit",
  "Special Occasion Outfit",
  "Footwear",
  "Outerwear",
  "Underwear/Socks",
  "Accessories",
];

export const SCHOOL_RELATED_TYPES: RecordType[] = [
  "School Uniform",
  "Sports Kit",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Seasonal Allowance", label: "Seasonal Allowance" },
  { type: "Emergency Purchase", label: "Emergency Purchase" },
  { type: "School Uniform", label: "School Uniform" },
  { type: "Sports Kit", label: "Sports Kit" },
  { type: "Special Occasion Outfit", label: "Special Occasion Outfit" },
  { type: "Footwear", label: "Footwear" },
  { type: "Outerwear", label: "Outerwear" },
  { type: "Underwear/Socks", label: "Underwear / Socks" },
  { type: "Accessories", label: "Accessories" },
  { type: "Style Consultation", label: "Style Consultation" },
  { type: "Wardrobe Audit", label: "Wardrobe Audit" },
  { type: "Budget Planning", label: "Budget Planning" },
];

export const BUDGET_PERIOD_LABELS: { period: BudgetPeriod; label: string }[] = [
  { period: "Weekly", label: "Weekly" },
  { period: "Monthly", label: "Monthly" },
  { period: "Quarterly", label: "Quarterly" },
  { period: "Seasonal", label: "Seasonal" },
  { period: "Annual", label: "Annual" },
  { period: "One-Off", label: "One-Off" },
];

// -- Row type -----------------------------------------------------------------

export interface ClothingAllowanceRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  recorded_by: string;
  record_type: RecordType;
  amount: number;
  budget_period: BudgetPeriod | null;
  child_chose: boolean;
  age_appropriate: boolean;
  good_condition: boolean;
  sufficient_quantity: boolean;
  brand_preference_respected: boolean;
  cultural_needs_met: boolean;
  receipt_kept: boolean;
  season_appropriate: boolean;
  school_requirements_met: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateClothingAllowance(input: {
  childName?: string;
  recordDate?: string;
  recordedBy?: string;
  recordType?: string;
  amount?: number;
  budgetPeriod?: string | null;
  childChose?: boolean;
  ageAppropriate?: boolean;
  goodCondition?: boolean;
  sufficientQuantity?: boolean;
  brandPreferenceRespected?: boolean;
  culturalNeedsMet?: boolean;
  receiptKept?: boolean;
  seasonAppropriate?: boolean;
  schoolRequirementsMet?: boolean | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff name) is required");
  }

  if (
    !input.recordType ||
    !(RECORD_TYPES as readonly string[]).includes(input.recordType)
  ) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (input.amount !== undefined && input.amount < 0) {
    errors.push("Amount cannot be negative");
  }

  if (
    input.budgetPeriod &&
    input.budgetPeriod !== null &&
    !(BUDGET_PERIODS as readonly string[]).includes(input.budgetPeriod)
  ) {
    errors.push(`Budget period must be one of: ${BUDGET_PERIODS.join(", ")}`);
  }

  // Business rule: Age-inappropriate clothing must be flagged
  if (input.ageAppropriate === false) {
    errors.push(
      "Clothing flagged as not age-appropriate — CHR 2015 Reg 5 requires that the home meets each child's individual needs, including their developmental stage. Age-inappropriate clothing (overly mature styles for young children, or styles that do not respect the child's emerging identity) may raise safeguarding concerns or cause social difficulties. Staff should guide children's choices sensitively while respecting their preferences",
    );
  }

  // Business rule: Insufficient quantity is a welfare concern
  if (input.sufficientQuantity === false) {
    errors.push(
      "Clothing quantity flagged as insufficient — CHR 2015 Reg 9 requires that children are well-clothed. Corporate Parenting Principles require that looked-after children have what their peers have. Children should have enough clothing to avoid frequent rewearing, to accommodate laundry cycles, and to have options for different occasions. SCCIF inspectors will check that children have adequate wardrobes. The Registered Manager should review this child's clothing provision immediately",
    );
  }

  // Business rule: Poor condition clothing is a welfare concern
  if (input.goodCondition === false) {
    errors.push(
      "Clothing flagged as not in good condition — children in care should not be wearing worn, damaged, or ill-fitting clothing. This is a basic dignity issue and a requirement of CHR 2015 Reg 9. SCCIF inspectors assess whether children are well-presented and have clothing they can be proud of. Corporate Parenting Principles require that looked-after children have the same standard as their peers. Replace or repair clothing that is not in good condition",
    );
  }

  // Business rule: Season-inappropriate clothing
  if (input.seasonAppropriate === false) {
    errors.push(
      "Clothing flagged as not season-appropriate — children must have suitable clothing for the current weather. This includes warm coats, hats, and gloves in winter; appropriate summer clothing; waterproof outerwear; and suitable footwear for the conditions. A child without a proper winter coat, for example, is a visible indicator of poor care. CHR 2015 Reg 9 requires that children's physical needs are met",
    );
  }

  // Business rule: School requirements not met
  if (input.schoolRequirementsMet === false) {
    errors.push(
      "School clothing requirements not met — children must have correct school uniform and PE kit. Attending school without the right uniform can cause embarrassment, social exclusion, and disciplinary consequences. Corporate Parenting Principles require that looked-after children are not disadvantaged compared to peers. The home should ensure uniforms are purchased in good time before term starts and that spares are available for growth spurts",
    );
  }

  // Business rule: Receipt should be kept for purchases
  if (
    input.receiptKept === false &&
    input.recordType &&
    (PURCHASE_TYPES as string[]).includes(input.recordType) &&
    input.amount !== undefined &&
    input.amount > 30
  ) {
    errors.push(
      "Receipt not kept for clothing purchase over £30 — the home has a duty of financial accountability. All clothing purchases should have receipts retained, both for audit purposes and in case items need to be returned or exchanged. Ofsted inspectors and local authority auditors expect to see a clear financial trail for expenditure on children's clothing",
    );
  }

  // Business rule: Cultural needs
  if (input.culturalNeedsMet === false) {
    // Advisory: cultural needs should be met where possible
    // This is important but depends on the child's specific cultural requirements
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: ClothingAllowanceRow[],
): {
  total_records: number;
  unique_children: number;
  by_record_type: Record<string, number>;
  by_budget_period: Record<string, number>;
  total_spend: number;
  average_spend_per_record: number;
  average_spend_per_child: number;
  child_choice_rate: number;
  age_appropriate_rate: number;
  good_condition_rate: number;
  sufficient_quantity_rate: number;
  brand_preference_rate: number;
  cultural_needs_rate: number;
  receipt_kept_rate: number;
  season_appropriate_rate: number;
  school_requirements_rate: number;
  essential_purchase_count: number;
  discretionary_purchase_count: number;
  planning_activity_count: number;
  school_related_count: number;
  emergency_purchase_count: number;
  highest_single_spend: number;
  average_records_per_child: number;
} {
  const total = rows.length;

  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Budget period breakdown
  const byBudgetPeriod: Record<string, number> = {};
  for (const bp of BUDGET_PERIODS) byBudgetPeriod[bp] = 0;
  for (const r of rows) {
    if (r.budget_period) byBudgetPeriod[r.budget_period] = (byBudgetPeriod[r.budget_period] || 0) + 1;
  }

  // Financial metrics
  const totalSpend = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const avgPerRecord = total > 0 ? Math.round((totalSpend / total) * 100) / 100 : 0;
  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((totalSpend / uniqueChildren.size) * 100) / 100
    : 0;
  const highestSpend = total > 0 ? Math.max(...rows.map((r) => Number(r.amount) || 0)) : 0;

  // Boolean rates
  const pct = (filter: (r: ClothingAllowanceRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const childChoiceRate = pct((r) => r.child_chose);
  const ageAppropriateRate = pct((r) => r.age_appropriate);
  const goodConditionRate = pct((r) => r.good_condition);
  const sufficientQuantityRate = pct((r) => r.sufficient_quantity);
  const brandPreferenceRate = pct((r) => r.brand_preference_respected);
  const culturalNeedsRate = pct((r) => r.cultural_needs_met);
  const receiptKeptRate = pct((r) => r.receipt_kept);
  const seasonAppropriateRate = pct((r) => r.season_appropriate);

  const schoolRows = rows.filter((r) => r.school_requirements_met !== null);
  const schoolRequirementsRate = schoolRows.length > 0
    ? Math.round((schoolRows.filter((r) => r.school_requirements_met === true).length / schoolRows.length) * 1000) / 10
    : 0;

  // Category counts
  const essentialCount = rows.filter((r) => (ESSENTIAL_TYPES as string[]).includes(r.record_type)).length;
  const discretionaryCount = rows.filter((r) => (DISCRETIONARY_TYPES as string[]).includes(r.record_type)).length;
  const planningCount = rows.filter((r) => (PLANNING_TYPES as string[]).includes(r.record_type)).length;
  const schoolRelatedCount = rows.filter((r) => (SCHOOL_RELATED_TYPES as string[]).includes(r.record_type)).length;
  const emergencyCount = rows.filter((r) => r.record_type === "Emergency Purchase").length;

  const avgRecordsPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_record_type: byRecordType,
    by_budget_period: byBudgetPeriod,
    total_spend: Math.round(totalSpend * 100) / 100,
    average_spend_per_record: avgPerRecord,
    average_spend_per_child: avgPerChild,
    child_choice_rate: childChoiceRate,
    age_appropriate_rate: ageAppropriateRate,
    good_condition_rate: goodConditionRate,
    sufficient_quantity_rate: sufficientQuantityRate,
    brand_preference_rate: brandPreferenceRate,
    cultural_needs_rate: culturalNeedsRate,
    receipt_kept_rate: receiptKeptRate,
    season_appropriate_rate: seasonAppropriateRate,
    school_requirements_rate: schoolRequirementsRate,
    essential_purchase_count: essentialCount,
    discretionary_purchase_count: discretionaryCount,
    planning_activity_count: planningCount,
    school_related_count: schoolRelatedCount,
    emergency_purchase_count: emergencyCount,
    highest_single_spend: highestSpend,
    average_records_per_child: avgRecordsPerChild,
  };
}

export function computeAlerts(
  rows: ClothingAllowanceRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Insufficient clothing quantity
  for (const r of rows) {
    if (!r.sufficient_quantity) {
      alerts.push({
        type: "insufficient_quantity",
        severity: "critical",
        message: `${r.child_name}'s clothing flagged as insufficient quantity (${r.record_type}, ${r.record_date}) — CHR 2015 Reg 9 requires that children are well-clothed. Corporate Parenting Principles require that looked-after children have the same as their peers. A child without enough clothing faces daily dignity issues — not enough options for different occasions, insufficient changes during laundry cycles, and potential embarrassment. The Registered Manager must ensure this child's wardrobe is supplemented immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: Clothing not in good condition
  for (const r of rows) {
    if (!r.good_condition) {
      alerts.push({
        type: "poor_condition",
        severity: "critical",
        message: `${r.child_name}'s clothing flagged as not in good condition (${r.record_type}, ${r.record_date}) — children in care should never be wearing worn, damaged, stained, or ill-fitting clothing. This is a fundamental indicator of care quality that SCCIF inspectors will assess. Corporate Parenting Principles require that looked-after children are not distinguishable from their peers by the quality of their clothing. Replace or repair items immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: Not season-appropriate
  for (const r of rows) {
    if (!r.season_appropriate) {
      alerts.push({
        type: "not_season_appropriate",
        severity: "critical",
        message: `${r.child_name}'s clothing flagged as not season-appropriate (${r.record_type}, ${r.record_date}) — a child without suitable clothing for current weather conditions (no winter coat, no waterproof, no warm layers) is a serious welfare concern. CHR 2015 Reg 9 requires that children's physical needs are met. This must be addressed same-day; a child should never leave the home inadequately dressed for the weather`,
        record_id: r.id,
      });
    }
  }

  // Critical: School requirements not met
  for (const r of rows) {
    if (r.school_requirements_met === false) {
      alerts.push({
        type: "school_requirements_not_met",
        severity: "critical",
        message: `${r.child_name}'s school clothing requirements not met (${r.record_type}, ${r.record_date}) — attending school without correct uniform or PE kit causes embarrassment and social exclusion. Schools may impose sanctions that affect the child's education. Corporate Parenting Principles require that looked-after children are not disadvantaged. The home must provide correct school uniform as a priority. If uniform costs are a concern, many local authorities and schools have assistance schemes`,
        record_id: r.id,
      });
    }
  }

  // High: Child never chooses own clothing
  const childChoiceMap = new Map<string, ClothingAllowanceRow[]>();
  for (const r of rows) {
    if ((PURCHASE_TYPES as string[]).includes(r.record_type)) {
      const key = r.child_name.toLowerCase().trim();
      if (!childChoiceMap.has(key)) childChoiceMap.set(key, []);
      childChoiceMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childChoiceMap) {
    const chosenCount = childRows.filter((r) => r.child_chose).length;
    if (childRows.length >= 3 && chosenCount === 0) {
      alerts.push({
        type: "child_never_chooses_clothing",
        severity: "high",
        message: `${childRows[0].child_name} has ${childRows.length} clothing purchase records but has never been recorded as choosing their own clothing — personal style is an important part of identity development for young people. UNCRC Article 12 requires that children's views are respected. Corporate Parenting Principles require that children have choice. Many looked-after children have had clothing imposed on them; enabling choice is empowering. Is this child being taken shopping, offered catalogues, or given genuine input into their wardrobe?`,
      });
    }
  }

  // High: High emergency purchase ratio
  const emergencyCount = rows.filter((r) => r.record_type === "Emergency Purchase").length;
  const purchaseRows = rows.filter((r) => (PURCHASE_TYPES as string[]).includes(r.record_type));
  if (purchaseRows.length >= 5 && emergencyCount / purchaseRows.length > 0.4) {
    alerts.push({
      type: "high_emergency_purchase_ratio",
      severity: "high",
      message: `${Math.round((emergencyCount / purchaseRows.length) * 100)}% of clothing purchases are emergency purchases — this suggests inadequate forward planning. Seasonal clothing needs are predictable (winter coats in autumn, school uniform before term). A high emergency rate means children may be going without until a crisis forces a purchase. The home should implement seasonal wardrobe reviews and proactive purchasing schedules`,
    });
  }

  // High: Low receipt-keeping rate
  const purchaseWithCostRows = purchaseRows.filter((r) => Number(r.amount) > 0);
  const receiptCount = purchaseWithCostRows.filter((r) => r.receipt_kept).length;
  if (purchaseWithCostRows.length >= 5 && receiptCount / purchaseWithCostRows.length < 0.5) {
    alerts.push({
      type: "low_receipt_rate",
      severity: "high",
      message: `Receipts kept for only ${Math.round((receiptCount / purchaseWithCostRows.length) * 100)}% of clothing purchases — financial accountability for clothing expenditure is essential. Ofsted and local authority auditors expect a clear paper trail. Receipts also enable returns and exchanges. The home should implement a receipt collection system at point of purchase`,
    });
  }

  // High: Age-inappropriate clothing
  for (const r of rows) {
    if (!r.age_appropriate) {
      alerts.push({
        type: "age_inappropriate",
        severity: "high",
        message: `${r.child_name}'s clothing flagged as not age-appropriate (${r.record_type}, ${r.record_date}) — while children should have choice (especially teenagers expressing their identity), staff have a responsibility to ensure clothing is developmentally appropriate. CHR 2015 Reg 5 requires that individual needs are met. This requires sensitive conversation with the child, not dictation, but genuine dialogue about appropriate dressing`,
        record_id: r.id,
      });
    }
  }

  // Medium: Low brand preference rate
  const brandCount = rows.filter((r) => r.brand_preference_respected).length;
  if (rows.length >= 5 && brandCount / rows.length < 0.3) {
    alerts.push({
      type: "low_brand_preference",
      severity: "medium",
      message: `Brand preferences respected in only ${Math.round((brandCount / rows.length) * 100)}% of records — for looked-after children, having clothing that matches what their peers wear is important for social inclusion. Corporate Parenting Principles require that children have what their peers have. This does not mean every request must be met, but children's preferences for popular brands should be considered, especially for items visible at school or in social settings`,
    });
  }

  // Medium: No wardrobe audits
  const auditCount = rows.filter((r) => r.record_type === "Wardrobe Audit").length;
  if (rows.length >= 8 && auditCount === 0) {
    alerts.push({
      type: "no_wardrobe_audits",
      severity: "medium",
      message: `No wardrobe audits recorded across ${rows.length} clothing records — regular wardrobe reviews help identify gaps, remove worn items, assess seasonal needs, and plan purchases. This is basic good practice recommended by the Children's Home Quality Standards. Wardrobe audits should involve the child and be done at least seasonally`,
    });
  }

  // Medium: Low cultural needs rate
  const culturalCount = rows.filter((r) => r.cultural_needs_met).length;
  if (rows.length >= 5 && culturalCount / rows.length < 0.3) {
    alerts.push({
      type: "low_cultural_needs",
      severity: "medium",
      message: `Cultural needs met in only ${Math.round((culturalCount / rows.length) * 100)}% of clothing records — CHR 2015 Reg 5 requires that individual needs are met, including cultural identity. For children from diverse cultural backgrounds, access to cultural clothing (for celebrations, religious observances, or daily wear) is an important part of identity. Is the home supporting children to maintain their cultural dress where they wish to?`,
    });
  }

  // Medium: Spending inequality between children
  const childSpendMap = new Map<string, number>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    childSpendMap.set(key, (childSpendMap.get(key) || 0) + (Number(r.amount) || 0));
  }
  const spendValues = Array.from(childSpendMap.values());
  if (spendValues.length >= 2) {
    const maxSpend = Math.max(...spendValues);
    const minSpend = Math.min(...spendValues);
    if (maxSpend > 0 && minSpend < maxSpend * 0.3) {
      alerts.push({
        type: "spending_inequality",
        severity: "medium",
        message: `Significant spending inequality between children — highest total clothing spend is £${Math.round(maxSpend * 100) / 100} while lowest is £${Math.round(minSpend * 100) / 100}. Corporate Parenting Principles require equitable treatment. While individual needs differ (growth spurts, different activities, different starting wardrobes), large disparities should be reviewed. Children notice inequalities and may feel less valued. Is there a consistent per-child clothing budget?`,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: ClothingAllowanceRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const periodBreakdown = Object.entries(metrics.by_budget_period)
    .filter(([, count]) => count > 0)
    .map(([period, count]) => `${period}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} clothing ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Budget periods: ${periodBreakdown || "none set"}. ` +
      `Total spend: £${metrics.total_spend}. Average per child: £${metrics.average_spend_per_child}. ` +
      `Average per record: £${metrics.average_spend_per_record}. ` +
      `Highest single spend: £${metrics.highest_single_spend}. ` +
      `Essential purchases: ${metrics.essential_purchase_count}. ` +
      `Emergency purchases: ${metrics.emergency_purchase_count}. ` +
      `School-related: ${metrics.school_related_count}. ` +
      `Planning activities: ${metrics.planning_activity_count}. ` +
      `Average records per child: ${metrics.average_records_per_child}. ` +
      `Child choice rate: ${metrics.child_choice_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Good condition rate: ${metrics.good_condition_rate}%. ` +
        `Sufficient quantity rate: ${metrics.sufficient_quantity_rate}%. ` +
        `Season appropriate rate: ${metrics.season_appropriate_rate}%. ` +
        `Age appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `School requirements rate: ${metrics.school_requirements_rate}%. ` +
        `Receipt keeping rate: ${metrics.receipt_kept_rate}%. ` +
        `Brand preference rate: ${metrics.brand_preference_rate}%. ` +
        `Cultural needs rate: ${metrics.cultural_needs_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority clothing alerts. ` +
        `Good condition rate: ${metrics.good_condition_rate}%. ` +
        `Sufficient quantity rate: ${metrics.sufficient_quantity_rate}%. ` +
        `Season appropriate rate: ${metrics.season_appropriate_rate}%. ` +
        `Age appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `School requirements rate: ${metrics.school_requirements_rate}%. ` +
        `Receipt keeping rate: ${metrics.receipt_kept_rate}%. ` +
        `Continue ensuring children are well-clothed per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_choice_rate < 40 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Child choice is recorded in only ${metrics.child_choice_rate}% of clothing ` +
        `records. For looked-after children, clothing is deeply personal — it ` +
        `is how they present themselves to the world, express their identity, ` +
        `and feel a sense of belonging among peers. Corporate Parenting ` +
        `Principles require that children have the same opportunities as ` +
        `their peers, and most children in family settings choose their own ` +
        `clothes. CHR 2015 Reg 9 requires child-centred care. Is the home ` +
        `taking children shopping and letting them choose? Are online shopping ` +
        `options being offered? Are children consulted about their style ` +
        `preferences? For many looked-after children, having someone buy ` +
        `them clothes without asking what they like reinforces feelings of ` +
        `powerlessness and institutional care.`,
    );
  } else if (metrics.brand_preference_rate < 30 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Brand preferences respected in only ${metrics.brand_preference_rate}% of records. ` +
        `This is a sensitive area. Corporate Parenting Principles require ` +
        `that looked-after children have what their peers have. In most ` +
        `schools and social settings, certain brands carry significant social ` +
        `currency. A child wearing obviously cheaper alternatives may face ` +
        `bullying or social exclusion. This does not mean every expensive ` +
        `brand request must be met, but the home should find a reasonable ` +
        `balance — perhaps brand items for visible clothing (trainers, ` +
        `coats, hoodies) and standard items for less visible clothing. Is ` +
        `the home having honest conversations with children about budgets ` +
        `while respecting their desire to fit in?`,
    );
  } else if (metrics.emergency_purchase_count > metrics.essential_purchase_count && metrics.total_records > 5) {
    insights.push(
      `[reflect] Emergency purchases (${metrics.emergency_purchase_count}) exceed planned essential ` +
        `purchases (${metrics.essential_purchase_count}). Clothing needs are largely ` +
        `predictable — children grow, seasons change, school years start. ` +
        `A high rate of emergency purchases suggests reactive rather than ` +
        `proactive wardrobe management. Is the home conducting regular ` +
        `wardrobe audits? Are seasonal clothing needs being anticipated? ` +
        `Is the budget allocated in advance? For children who may have ` +
        `arrived with inadequate clothing, an initial wardrobe assessment ` +
        `and purchase plan should be part of the placement start-up. ` +
        `Proactive planning ensures children always have what they need ` +
        `without crisis-driven shopping trips.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that clothing provision supports ` +
        `each child's sense of identity and self-esteem? Clothing is not ` +
        `just a functional necessity — for adolescents especially, it is a ` +
        `primary means of self-expression. CHR 2015 Reg 5 requires that ` +
        `individual needs are met. SCCIF inspectors look for evidence that ` +
        `children are well-presented and have clothing they can be proud of. ` +
        `Does the home arrange style consultations or shopping trips as ` +
        `positive experiences? Are children's evolving tastes tracked and ` +
        `respected? Is there a culture where children feel comfortable ` +
        `asking for new clothes when they need them, without feeling like ` +
        `a burden?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    budgetPeriod?: BudgetPeriod;
    limit?: number;
  },
): Promise<ServiceResult<ClothingAllowanceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_clothing_allowance") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.budgetPeriod) q = q.eq("budget_period", filters.budgetPeriod);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<ClothingAllowanceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_clothing_allowance") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  recordedBy: string;
  recordType: RecordType;
  amount?: number;
  budgetPeriod?: BudgetPeriod | null;
  childChose?: boolean;
  ageAppropriate?: boolean;
  goodCondition?: boolean;
  sufficientQuantity?: boolean;
  brandPreferenceRespected?: boolean;
  culturalNeedsMet?: boolean;
  receiptKept?: boolean;
  seasonAppropriate?: boolean;
  schoolRequirementsMet?: boolean | null;
  notes?: string | null;
}): Promise<ServiceResult<ClothingAllowanceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateClothingAllowance({
    childName: input.childName,
    recordDate: input.recordDate,
    recordedBy: input.recordedBy,
    recordType: input.recordType,
    amount: input.amount,
    budgetPeriod: input.budgetPeriod,
    childChose: input.childChose,
    ageAppropriate: input.ageAppropriate,
    goodCondition: input.goodCondition,
    sufficientQuantity: input.sufficientQuantity,
    brandPreferenceRespected: input.brandPreferenceRespected,
    culturalNeedsMet: input.culturalNeedsMet,
    receiptKept: input.receiptKept,
    seasonAppropriate: input.seasonAppropriate,
    schoolRequirementsMet: input.schoolRequirementsMet,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_clothing_allowance") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      recorded_by: input.recordedBy,
      record_type: input.recordType,
      amount: input.amount ?? 0,
      budget_period: input.budgetPeriod ?? null,
      child_chose: input.childChose ?? false,
      age_appropriate: input.ageAppropriate ?? true,
      good_condition: input.goodCondition ?? true,
      sufficient_quantity: input.sufficientQuantity ?? true,
      brand_preference_respected: input.brandPreferenceRespected ?? false,
      cultural_needs_met: input.culturalNeedsMet ?? false,
      receipt_kept: input.receiptKept ?? false,
      season_appropriate: input.seasonAppropriate ?? true,
      school_requirements_met: input.schoolRequirementsMet ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    recordDate: string;
    recordedBy: string;
    recordType: RecordType;
    amount: number;
    budgetPeriod: BudgetPeriod | null;
    childChose: boolean;
    ageAppropriate: boolean;
    goodCondition: boolean;
    sufficientQuantity: boolean;
    brandPreferenceRespected: boolean;
    culturalNeedsMet: boolean;
    receiptKept: boolean;
    seasonAppropriate: boolean;
    schoolRequirementsMet: boolean | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ClothingAllowanceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.amount !== undefined) mapped.amount = updates.amount;
  if (updates.budgetPeriod !== undefined) mapped.budget_period = updates.budgetPeriod;
  if (updates.childChose !== undefined) mapped.child_chose = updates.childChose;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.goodCondition !== undefined) mapped.good_condition = updates.goodCondition;
  if (updates.sufficientQuantity !== undefined) mapped.sufficient_quantity = updates.sufficientQuantity;
  if (updates.brandPreferenceRespected !== undefined) mapped.brand_preference_respected = updates.brandPreferenceRespected;
  if (updates.culturalNeedsMet !== undefined) mapped.cultural_needs_met = updates.culturalNeedsMet;
  if (updates.receiptKept !== undefined) mapped.receipt_kept = updates.receiptKept;
  if (updates.seasonAppropriate !== undefined) mapped.season_appropriate = updates.seasonAppropriate;
  if (updates.schoolRequirementsMet !== undefined) mapped.school_requirements_met = updates.schoolRequirementsMet;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_clothing_allowance") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_clothing_allowance") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
