// ==============================================================================
// CARA -- BIRTHDAY, CHRISTMAS & CELEBRATION MANAGEMENT SERVICE
// Tracks gift-giving, celebrations, cultural occasions, and special events for
// looked-after children. Covers occasion types (Birthday, Christmas, Eid, Diwali,
// Hanukkah, Easter, cultural celebrations, achievement celebrations, leaving/welcome
// gifts), gift types, budgets, child choice, age appropriateness, receipts, cultural
// preference consideration, celebration activities, peer inclusion, and child feedback.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — celebrations and special occasions),
// SCCIF: Experiences — "Children enjoy celebrations."
// Corporate Parenting Principles (Children and Social Work Act 2017).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const OCCASION_TYPES = [
  "Birthday",
  "Christmas",
  "Eid",
  "Diwali",
  "Hanukkah",
  "Easter",
  "Cultural Celebration",
  "Achievement Celebration",
  "Leaving Gift",
  "Welcome Gift",
  "Other",
] as const;
export type OccasionType = (typeof OCCASION_TYPES)[number];

export const GIFT_TYPES = [
  "Cash",
  "Gift Card",
  "Clothing",
  "Electronics",
  "Sports Equipment",
  "Books",
  "Experience/Trip",
  "Multiple Items",
  "Other",
] as const;
export type GiftType = (typeof GIFT_TYPES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const CULTURAL_OCCASIONS: OccasionType[] = [
  "Eid",
  "Diwali",
  "Hanukkah",
  "Cultural Celebration",
];

export const RELIGIOUS_OCCASIONS: OccasionType[] = [
  "Christmas",
  "Eid",
  "Diwali",
  "Hanukkah",
  "Easter",
];

export const MILESTONE_OCCASIONS: OccasionType[] = [
  "Birthday",
  "Achievement Celebration",
  "Leaving Gift",
  "Welcome Gift",
];

export const EXPERIENTIAL_GIFT_TYPES: GiftType[] = [
  "Experience/Trip",
];

export const MATERIAL_GIFT_TYPES: GiftType[] = [
  "Cash",
  "Gift Card",
  "Clothing",
  "Electronics",
  "Sports Equipment",
  "Books",
  "Multiple Items",
];

// -- Label maps ---------------------------------------------------------------

export const OCCASION_TYPE_LABELS: { type: OccasionType; label: string }[] = [
  { type: "Birthday", label: "Birthday" },
  { type: "Christmas", label: "Christmas" },
  { type: "Eid", label: "Eid" },
  { type: "Diwali", label: "Diwali" },
  { type: "Hanukkah", label: "Hanukkah" },
  { type: "Easter", label: "Easter" },
  { type: "Cultural Celebration", label: "Cultural Celebration" },
  { type: "Achievement Celebration", label: "Achievement Celebration" },
  { type: "Leaving Gift", label: "Leaving Gift" },
  { type: "Welcome Gift", label: "Welcome Gift" },
  { type: "Other", label: "Other" },
];

export const GIFT_TYPE_LABELS: { type: GiftType; label: string }[] = [
  { type: "Cash", label: "Cash" },
  { type: "Gift Card", label: "Gift Card" },
  { type: "Clothing", label: "Clothing" },
  { type: "Electronics", label: "Electronics" },
  { type: "Sports Equipment", label: "Sports Equipment" },
  { type: "Books", label: "Books" },
  { type: "Experience/Trip", label: "Experience / Trip" },
  { type: "Multiple Items", label: "Multiple Items" },
  { type: "Other", label: "Other" },
];

// -- Row type -----------------------------------------------------------------

export interface CelebrationGiftRow {
  id: string;
  home_id: string;
  child_name: string;
  occasion_date: string;
  recorded_by: string;
  occasion_type: OccasionType;
  gift_type: GiftType;
  gift_value: number;
  budget_limit: number | null;
  within_budget: boolean;
  child_chose: boolean;
  age_appropriate: boolean;
  receipt_kept: boolean;
  social_worker_aware: boolean | null;
  cultural_preference_considered: boolean;
  celebration_activity_planned: boolean;
  peers_included: boolean;
  child_feedback: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateCelebrationGift(input: {
  childName?: string;
  occasionDate?: string;
  recordedBy?: string;
  occasionType?: string;
  giftType?: string;
  giftValue?: number;
  budgetLimit?: number | null;
  withinBudget?: boolean;
  childChose?: boolean;
  ageAppropriate?: boolean;
  receiptKept?: boolean;
  culturalPreferenceConsidered?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.occasionDate) {
    errors.push("Occasion date is required");
  } else {
    const dateObj = new Date(input.occasionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Occasion date must be a valid date");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff name) is required");
  }

  if (
    !input.occasionType ||
    !(OCCASION_TYPES as readonly string[]).includes(input.occasionType)
  ) {
    errors.push(`Occasion type must be one of: ${OCCASION_TYPES.join(", ")}`);
  }

  if (
    input.giftType &&
    !(GIFT_TYPES as readonly string[]).includes(input.giftType)
  ) {
    errors.push(`Gift type must be one of: ${GIFT_TYPES.join(", ")}`);
  }

  if (input.giftValue !== undefined && input.giftValue < 0) {
    errors.push("Gift value cannot be negative");
  }

  if (input.budgetLimit !== undefined && input.budgetLimit !== null && input.budgetLimit < 0) {
    errors.push("Budget limit cannot be negative");
  }

  // Business rule: Over-budget gifts need justification
  if (
    input.giftValue !== undefined &&
    input.budgetLimit !== undefined &&
    input.budgetLimit !== null &&
    input.giftValue > input.budgetLimit &&
    input.withinBudget === true
  ) {
    errors.push(
      "Gift value exceeds budget limit but within_budget is marked as true — Corporate Parenting Principles require responsible financial management of children's allowances. If the gift genuinely exceeds the budget, this should be recorded accurately and the overspend authorised by a manager. Accurate financial records are essential for Ofsted scrutiny and local authority oversight",
    );
  }

  // Business rule: Age-inappropriate gifts must be flagged
  if (input.ageAppropriate === false) {
    errors.push(
      "Gift flagged as not age-appropriate — CHR 2015 Reg 9 requires that care meets each child's individual needs, including developmental stage. Age-inappropriate gifts may cause safeguarding concerns (e.g., electronics for very young children, items that could be harmful). The Registered Manager should review this purchase and consider whether it should be exchanged",
    );
  }

  // Business rule: Cultural occasions should have cultural consideration
  if (
    input.occasionType &&
    (CULTURAL_OCCASIONS as string[]).includes(input.occasionType) &&
    input.culturalPreferenceConsidered === false
  ) {
    errors.push(
      `Cultural preference not considered for ${input.occasionType} — this is a cultural or faith-based celebration and the child's cultural identity must be respected. CHR 2015 Reg 9 requires that care meets cultural needs, and Corporate Parenting Principles require that looked-after children have the same opportunities as their peers to celebrate their heritage. The home should consult with the child about how they wish to celebrate and what gifts would be meaningful to them`,
    );
  }

  // Business rule: Receipts should be kept for financial accountability
  if (
    input.receiptKept === false &&
    input.giftValue !== undefined &&
    input.giftValue > 50
  ) {
    errors.push(
      "Receipt not kept for gift valued over £50 — the home has a duty of financial accountability to the local authority and Ofsted. All significant purchases should have receipts retained. This is especially important for gifts funded from the child's allowance or local authority budgets. The absence of receipts for high-value items may raise questions during inspection",
    );
  }

  // Business rule: Child choice is important for empowerment
  if (input.childChose === false && input.occasionType === "Birthday") {
    // Advisory: children should ideally choose their own birthday gifts
    // Not a hard error as surprise gifts are also appropriate
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: CelebrationGiftRow[],
): {
  total_records: number;
  unique_children: number;
  by_occasion_type: Record<string, number>;
  by_gift_type: Record<string, number>;
  total_gift_value: number;
  average_gift_value: number;
  within_budget_rate: number;
  child_choice_rate: number;
  age_appropriate_rate: number;
  receipt_kept_rate: number;
  cultural_consideration_rate: number;
  celebration_activity_rate: number;
  peers_included_rate: number;
  social_worker_aware_rate: number;
  cultural_occasion_count: number;
  religious_occasion_count: number;
  milestone_occasion_count: number;
  average_per_child: number;
  over_budget_count: number;
  feedback_provided_rate: number;
  highest_gift_value: number;
} {
  const total = rows.length;

  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Occasion type breakdown
  const byOccasionType: Record<string, number> = {};
  for (const ot of OCCASION_TYPES) byOccasionType[ot] = 0;
  for (const r of rows) byOccasionType[r.occasion_type] = (byOccasionType[r.occasion_type] || 0) + 1;

  // Gift type breakdown
  const byGiftType: Record<string, number> = {};
  for (const gt of GIFT_TYPES) byGiftType[gt] = 0;
  for (const r of rows) byGiftType[r.gift_type] = (byGiftType[r.gift_type] || 0) + 1;

  // Financial metrics
  const totalValue = rows.reduce((sum, r) => sum + (Number(r.gift_value) || 0), 0);
  const avgValue = total > 0 ? Math.round((totalValue / total) * 100) / 100 : 0;
  const highestValue = total > 0 ? Math.max(...rows.map((r) => Number(r.gift_value) || 0)) : 0;

  // Boolean rates
  const pct = (filter: (r: CelebrationGiftRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const withinBudgetRate = pct((r) => r.within_budget);
  const childChoiceRate = pct((r) => r.child_chose);
  const ageAppropriateRate = pct((r) => r.age_appropriate);
  const receiptKeptRate = pct((r) => r.receipt_kept);
  const culturalConsiderationRate = pct((r) => r.cultural_preference_considered);
  const celebrationActivityRate = pct((r) => r.celebration_activity_planned);
  const peersIncludedRate = pct((r) => r.peers_included);

  const swAwareRows = rows.filter((r) => r.social_worker_aware !== null);
  const socialWorkerAwareRate = swAwareRows.length > 0
    ? Math.round((swAwareRows.filter((r) => r.social_worker_aware === true).length / swAwareRows.length) * 1000) / 10
    : 0;

  // Category counts
  const culturalCount = rows.filter((r) => (CULTURAL_OCCASIONS as string[]).includes(r.occasion_type)).length;
  const religiousCount = rows.filter((r) => (RELIGIOUS_OCCASIONS as string[]).includes(r.occasion_type)).length;
  const milestoneCount = rows.filter((r) => (MILESTONE_OCCASIONS as string[]).includes(r.occasion_type)).length;

  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  const overBudgetCount = rows.filter(
    (r) => r.budget_limit !== null && Number(r.gift_value) > Number(r.budget_limit),
  ).length;

  const feedbackRate = pct((r) => r.child_feedback !== null && r.child_feedback.trim().length > 0);

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_occasion_type: byOccasionType,
    by_gift_type: byGiftType,
    total_gift_value: Math.round(totalValue * 100) / 100,
    average_gift_value: avgValue,
    within_budget_rate: withinBudgetRate,
    child_choice_rate: childChoiceRate,
    age_appropriate_rate: ageAppropriateRate,
    receipt_kept_rate: receiptKeptRate,
    cultural_consideration_rate: culturalConsiderationRate,
    celebration_activity_rate: celebrationActivityRate,
    peers_included_rate: peersIncludedRate,
    social_worker_aware_rate: socialWorkerAwareRate,
    cultural_occasion_count: culturalCount,
    religious_occasion_count: religiousCount,
    milestone_occasion_count: milestoneCount,
    average_per_child: avgPerChild,
    over_budget_count: overBudgetCount,
    feedback_provided_rate: feedbackRate,
    highest_gift_value: highestValue,
  };
}

export function computeAlerts(
  rows: CelebrationGiftRow[],
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

  // Critical: Age-inappropriate gift recorded
  for (const r of rows) {
    if (!r.age_appropriate) {
      alerts.push({
        type: "age_inappropriate_gift",
        severity: "critical",
        message: `Gift for ${r.child_name} on ${r.occasion_date} (${r.occasion_type}) flagged as not age-appropriate — ${r.gift_type} valued at £${r.gift_value}. CHR 2015 Reg 9 requires care that meets each child's developmental needs. Age-inappropriate gifts may pose safeguarding risks (e.g., unsupervised internet-enabled devices, items with small parts for young children) or may not be meaningful to the child. The Registered Manager should review this purchase immediately and consider whether it needs to be exchanged or additional safeguards put in place`,
        record_id: r.id,
      });
    }
  }

  // Critical: Very high value gift without receipt
  for (const r of rows) {
    if (Number(r.gift_value) > 100 && !r.receipt_kept) {
      alerts.push({
        type: "high_value_no_receipt",
        severity: "critical",
        message: `Gift valued at £${r.gift_value} for ${r.child_name} (${r.occasion_type}, ${r.occasion_date}) has no receipt — financial accountability is a core expectation of Ofsted inspections and local authority monitoring. The home must be able to demonstrate that children's funds and budgets are managed responsibly. High-value purchases without receipts may raise questions about financial propriety. The Registered Manager should investigate and obtain a receipt or written record of the purchase`,
        record_id: r.id,
      });
    }
  }

  // Critical: Significantly over budget
  for (const r of rows) {
    if (
      r.budget_limit !== null &&
      Number(r.gift_value) > Number(r.budget_limit) * 1.5
    ) {
      alerts.push({
        type: "significantly_over_budget",
        severity: "critical",
        message: `Gift for ${r.child_name} (${r.occasion_type}, ${r.occasion_date}) is £${r.gift_value} against a budget of £${r.budget_limit} — more than 50% over budget. While Corporate Parenting Principles encourage generosity, the home must manage finances responsibly. Significant overspends should be authorised by the Registered Manager and the reason documented. Consistent overspending may indicate that budgets need reviewing or that purchasing decisions are not being properly controlled`,
        record_id: r.id,
      });
    }
  }

  // High: Cultural occasion without cultural consideration
  for (const r of rows) {
    if (
      (CULTURAL_OCCASIONS as string[]).includes(r.occasion_type) &&
      !r.cultural_preference_considered
    ) {
      alerts.push({
        type: "cultural_occasion_no_consideration",
        severity: "high",
        message: `${r.occasion_type} celebration for ${r.child_name} on ${r.occasion_date} recorded without cultural preference being considered — this is a cultural or faith-based occasion and the child's identity and heritage must be respected. CHR 2015 Reg 9 requires that cultural needs are met. Corporate Parenting Principles require that looked-after children can celebrate their heritage. Was the child consulted about how they wished to celebrate? Were culturally appropriate gifts and activities offered?`,
        record_id: r.id,
      });
    }
  }

  // High: Child who never gets to choose their gifts
  const childChoiceMap = new Map<string, CelebrationGiftRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childChoiceMap.has(key)) childChoiceMap.set(key, []);
    childChoiceMap.get(key)!.push(r);
  }
  for (const [, childRows] of childChoiceMap) {
    const chosenCount = childRows.filter((r) => r.child_chose).length;
    if (childRows.length >= 3 && chosenCount === 0) {
      alerts.push({
        type: "child_never_chooses",
        severity: "high",
        message: `${childRows[0].child_name} has ${childRows.length} recorded celebrations but has never been recorded as choosing their own gift — UNCRC Article 12 gives children the right to have their views taken into account, and Corporate Parenting Principles require that children are listened to. Many looked-after children have had limited opportunities to make choices; gift selection is a meaningful way to exercise autonomy and feel valued. Is this child being offered genuine choice?`,
      });
    }
  }

  // High: No celebration activities planned across multiple occasions
  const activityCount = rows.filter((r) => r.celebration_activity_planned).length;
  if (rows.length >= 5 && activityCount / rows.length < 0.3) {
    alerts.push({
      type: "low_celebration_activity_rate",
      severity: "high",
      message: `Celebration activities planned for only ${Math.round((activityCount / rows.length) * 100)}% of occasions — celebrations should be about more than just gifts. SCCIF expects that children enjoy celebrations, which includes activities, parties, outings, and shared experiences. Corporate Parenting Principles require that looked-after children have the same quality of celebrations as their peers. Are birthdays being properly celebrated with cakes, decorations, and chosen activities? Are cultural and religious occasions being marked with appropriate festivities?`,
    });
  }

  // High: Low receipt-keeping rate
  const receiptCount = rows.filter((r) => r.receipt_kept).length;
  if (rows.length >= 5 && receiptCount / rows.length < 0.5) {
    alerts.push({
      type: "low_receipt_rate",
      severity: "high",
      message: `Receipts kept for only ${Math.round((receiptCount / rows.length) * 100)}% of gift purchases — financial accountability requires receipt retention for all purchases made on behalf of children. Ofsted inspectors and local authority auditors expect to see a clear paper trail for expenditure on children. The home should implement a system for collecting and filing receipts at the point of purchase`,
    });
  }

  // Medium: No peer inclusion across celebrations
  const peersCount = rows.filter((r) => r.peers_included).length;
  if (rows.length >= 5 && peersCount / rows.length < 0.3) {
    alerts.push({
      type: "low_peer_inclusion",
      severity: "medium",
      message: `Peers included in only ${Math.round((peersCount / rows.length) * 100)}% of celebrations — celebrations are social occasions and including peers helps build relationships and a sense of community within the home. CHR 2015 Reg 11 promotes positive relationships between children. SCCIF expects children to be supported in forming friendships. Is the home encouraging shared celebrations where appropriate, while respecting each child's preferences?`,
    });
  }

  // Medium: Low child feedback rate
  const feedbackCount = rows.filter((r) => r.child_feedback !== null && r.child_feedback.trim().length > 0).length;
  if (rows.length >= 5 && feedbackCount / rows.length < 0.3) {
    alerts.push({
      type: "low_child_feedback",
      severity: "medium",
      message: `Child feedback recorded for only ${Math.round((feedbackCount / rows.length) * 100)}% of celebrations — capturing the child's voice about their celebrations is important evidence for SCCIF inspections and care planning. Did the child enjoy their celebration? Was the gift what they wanted? Would they like anything different next time? This feedback helps the home improve and demonstrates child-centred practice`,
    });
  }

  // Medium: Budget not set for many records
  const noBudgetCount = rows.filter((r) => r.budget_limit === null).length;
  if (rows.length >= 5 && noBudgetCount / rows.length > 0.6) {
    alerts.push({
      type: "budget_not_set",
      severity: "medium",
      message: `Budget limits not set for ${Math.round((noBudgetCount / rows.length) * 100)}% of celebrations — while flexibility is important, having budget guidelines helps ensure equitable treatment of all children. Corporate Parenting Principles require that looked-after children are treated fairly. Setting budgets also helps the home manage finances responsibly and demonstrates good governance to Ofsted`,
    });
  }

  // Medium: No cultural occasions recorded
  const culturalCount = rows.filter((r) => (CULTURAL_OCCASIONS as string[]).includes(r.occasion_type)).length;
  if (rows.length >= 8 && culturalCount === 0) {
    alerts.push({
      type: "no_cultural_celebrations",
      severity: "medium",
      message: `No cultural celebrations recorded across ${rows.length} occasions — CHR 2015 Reg 9 requires that children's cultural needs are met, and Corporate Parenting Principles emphasise respecting identity. Does the home have children from diverse cultural backgrounds whose celebrations should be recognised? Even where all children share the same cultural background, celebrating diversity enriches everyone's experience`,
    });
  }

  // Medium: Over-budget pattern
  const overBudgetCount = rows.filter(
    (r) => r.budget_limit !== null && Number(r.gift_value) > Number(r.budget_limit),
  ).length;
  if (overBudgetCount >= 3) {
    alerts.push({
      type: "repeated_over_budget",
      severity: "medium",
      message: `${overBudgetCount} gifts have exceeded their budget limits — occasional overspends may be justified, but a pattern suggests budgets may be unrealistic or purchasing decisions are not being controlled. The Registered Manager should review whether budgets are set at appropriate levels and whether staff understand the authorisation process for exceeding budgets`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: CelebrationGiftRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const occasionBreakdown = Object.entries(metrics.by_occasion_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const giftBreakdown = Object.entries(metrics.by_gift_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} celebration/gift ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Occasions: ${occasionBreakdown || "none recorded"}. ` +
      `Gift types: ${giftBreakdown || "none"}. ` +
      `Total spend: £${metrics.total_gift_value}. Average gift value: £${metrics.average_gift_value}. ` +
      `Highest single gift: £${metrics.highest_gift_value}. ` +
      `Average occasions per child: ${metrics.average_per_child}. ` +
      `Cultural occasions: ${metrics.cultural_occasion_count}. ` +
      `Milestone occasions: ${metrics.milestone_occasion_count}. ` +
      `Over-budget gifts: ${metrics.over_budget_count}. ` +
      `Child choice rate: ${metrics.child_choice_rate}%. ` +
      `Within budget rate: ${metrics.within_budget_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Receipt keeping rate: ${metrics.receipt_kept_rate}%. ` +
        `Age appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Cultural consideration rate: ${metrics.cultural_consideration_rate}%. ` +
        `Celebration activity rate: ${metrics.celebration_activity_rate}%. ` +
        `Peers included rate: ${metrics.peers_included_rate}%. ` +
        `Social worker aware rate: ${metrics.social_worker_aware_rate}%. ` +
        `Child feedback rate: ${metrics.feedback_provided_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority celebration alerts. ` +
        `Receipt keeping rate: ${metrics.receipt_kept_rate}%. ` +
        `Age appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Cultural consideration rate: ${metrics.cultural_consideration_rate}%. ` +
        `Celebration activity rate: ${metrics.celebration_activity_rate}%. ` +
        `Peers included rate: ${metrics.peers_included_rate}%. ` +
        `Social worker aware rate: ${metrics.social_worker_aware_rate}%. ` +
        `Child feedback rate: ${metrics.feedback_provided_rate}%. ` +
        `Continue celebrating children's occasions per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_choice_rate < 40 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Child choice is recorded in only ${metrics.child_choice_rate}% of celebrations. ` +
        `Corporate Parenting Principles emphasise that looked-after children ` +
        `should have the same opportunities as their peers — and most children ` +
        `in family settings get to choose their birthday and Christmas presents. ` +
        `For many looked-after children, the experience of choosing their own ` +
        `gifts is about more than the item itself: it affirms their identity, ` +
        `validates their preferences, and gives them a sense of control. CHR ` +
        `2015 Reg 9 requires child-centred care. Is the home actively offering ` +
        `children catalogues, shopping trips, or wish lists to enable genuine ` +
        `choice? Or are staff selecting gifts on behalf of children without ` +
        `meaningful consultation?`,
    );
  } else if (metrics.cultural_consideration_rate < 50 && metrics.cultural_occasion_count > 0) {
    insights.push(
      `[reflect] Cultural preference considered in only ${metrics.cultural_consideration_rate}% of ` +
        `celebrations, yet there are ${metrics.cultural_occasion_count} cultural occasions recorded. ` +
        `CHR 2015 Reg 9 requires that children's cultural needs are met, and ` +
        `Corporate Parenting Principles require respect for identity. Cultural ` +
        `celebrations are deeply personal and connect children to their heritage, ` +
        `community, and sense of belonging. For looked-after children who may ` +
        `already feel disconnected from their roots, celebrating cultural ` +
        `occasions authentically can be profoundly healing. Is the home seeking ` +
        `guidance from families, cultural communities, and the children themselves ` +
        `about how to celebrate these occasions meaningfully?`,
    );
  } else if (metrics.celebration_activity_rate < 50 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Celebration activities planned for only ${metrics.celebration_activity_rate}% of ` +
        `occasions. SCCIF inspectors look for evidence that children enjoy ` +
        `celebrations — this means more than receiving a gift. Birthday parties, ` +
        `special meals, outings, decorations, and shared experiences create ` +
        `memories and normalcy. Many looked-after children have never had a ` +
        `proper birthday party or celebration. Corporate Parenting Principles ` +
        `require that these children have what their peers have. Is the home ` +
        `creating celebration experiences that the children will remember ` +
        `positively? Are staff asking children what kind of celebration they ` +
        `would like, or just providing a gift and moving on?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure equitable treatment across all ` +
        `children when it comes to celebrations and gifts? Corporate Parenting ` +
        `Principles require fairness. Children notice differences — if one child ` +
        `receives a significantly more expensive gift than another, or if some ` +
        `children's occasions are celebrated more elaborately, this can cause ` +
        `resentment and feelings of being less valued. At the same time, equity ` +
        `does not mean identical treatment: each child's individual preferences ` +
        `and cultural needs should be respected. Is the home striking the right ` +
        `balance between fairness and personalisation? Are budgets transparent ` +
        `and consistently applied?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    occasionType?: OccasionType;
    giftType?: GiftType;
    limit?: number;
  },
): Promise<ServiceResult<CelebrationGiftRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_celebration_gifts") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.occasionType) q = q.eq("occasion_type", filters.occasionType);
  if (filters?.giftType) q = q.eq("gift_type", filters.giftType);

  q = q.order("occasion_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<CelebrationGiftRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_celebration_gifts") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  occasionDate: string;
  recordedBy: string;
  occasionType: OccasionType;
  giftType?: GiftType;
  giftValue?: number;
  budgetLimit?: number | null;
  withinBudget?: boolean;
  childChose?: boolean;
  ageAppropriate?: boolean;
  receiptKept?: boolean;
  socialWorkerAware?: boolean | null;
  culturalPreferenceConsidered?: boolean;
  celebrationActivityPlanned?: boolean;
  peersIncluded?: boolean;
  childFeedback?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<CelebrationGiftRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateCelebrationGift({
    childName: input.childName,
    occasionDate: input.occasionDate,
    recordedBy: input.recordedBy,
    occasionType: input.occasionType,
    giftType: input.giftType,
    giftValue: input.giftValue,
    budgetLimit: input.budgetLimit,
    withinBudget: input.withinBudget,
    childChose: input.childChose,
    ageAppropriate: input.ageAppropriate,
    receiptKept: input.receiptKept,
    culturalPreferenceConsidered: input.culturalPreferenceConsidered,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_celebration_gifts") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      occasion_date: input.occasionDate,
      recorded_by: input.recordedBy,
      occasion_type: input.occasionType,
      gift_type: input.giftType ?? "Multiple Items",
      gift_value: input.giftValue ?? 0,
      budget_limit: input.budgetLimit ?? null,
      within_budget: input.withinBudget ?? true,
      child_chose: input.childChose ?? false,
      age_appropriate: input.ageAppropriate ?? true,
      receipt_kept: input.receiptKept ?? false,
      social_worker_aware: input.socialWorkerAware ?? null,
      cultural_preference_considered: input.culturalPreferenceConsidered ?? false,
      celebration_activity_planned: input.celebrationActivityPlanned ?? false,
      peers_included: input.peersIncluded ?? false,
      child_feedback: input.childFeedback ?? null,
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
    occasionDate: string;
    recordedBy: string;
    occasionType: OccasionType;
    giftType: GiftType;
    giftValue: number;
    budgetLimit: number | null;
    withinBudget: boolean;
    childChose: boolean;
    ageAppropriate: boolean;
    receiptKept: boolean;
    socialWorkerAware: boolean | null;
    culturalPreferenceConsidered: boolean;
    celebrationActivityPlanned: boolean;
    peersIncluded: boolean;
    childFeedback: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CelebrationGiftRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.occasionDate !== undefined) mapped.occasion_date = updates.occasionDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.occasionType !== undefined) mapped.occasion_type = updates.occasionType;
  if (updates.giftType !== undefined) mapped.gift_type = updates.giftType;
  if (updates.giftValue !== undefined) mapped.gift_value = updates.giftValue;
  if (updates.budgetLimit !== undefined) mapped.budget_limit = updates.budgetLimit;
  if (updates.withinBudget !== undefined) mapped.within_budget = updates.withinBudget;
  if (updates.childChose !== undefined) mapped.child_chose = updates.childChose;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.receiptKept !== undefined) mapped.receipt_kept = updates.receiptKept;
  if (updates.socialWorkerAware !== undefined) mapped.social_worker_aware = updates.socialWorkerAware;
  if (updates.culturalPreferenceConsidered !== undefined) mapped.cultural_preference_considered = updates.culturalPreferenceConsidered;
  if (updates.celebrationActivityPlanned !== undefined) mapped.celebration_activity_planned = updates.celebrationActivityPlanned;
  if (updates.peersIncluded !== undefined) mapped.peers_included = updates.peersIncluded;
  if (updates.childFeedback !== undefined) mapped.child_feedback = updates.childFeedback;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_celebration_gifts") as SB)
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

  const { error } = await (client.from("cs_celebration_gifts") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
