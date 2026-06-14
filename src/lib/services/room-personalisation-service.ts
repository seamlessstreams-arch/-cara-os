// ==============================================================================
// CARA -- ROOM PERSONALISATION & LIVING SPACE SERVICE
// Tracks children's bedroom personalisation, decoration choices, furniture
// requests, safety checks, budget tracking, cultural/sensory needs, and child
// satisfaction with their living space. Ensures rooms feel homely, not institutional.
//
// UK Regulatory Framework:
// CHR 2015 Reg 25 (premises — suitable accommodation),
// CHR 2015 Reg 9 (quality of care — homely environment),
// SCCIF: Experiences — "Children's bedrooms are personalised and homely."
// Corporate Parenting Principles — children should have a space that feels like home.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Initial Room Setup",
  "Decoration Choice",
  "Furniture Request",
  "Poster/Art Display",
  "Bedding Choice",
  "Colour Scheme Selection",
  "Storage Solution",
  "Personal Items Display",
  "Technology Setup",
  "Lighting Choice",
  "Privacy Enhancement",
  "Seasonal Update",
  "Room Audit",
  "Damage Assessment",
  "Moving Rooms",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const DECORATION_TYPES: RecordType[] = [
  "Decoration Choice",
  "Poster/Art Display",
  "Bedding Choice",
  "Colour Scheme Selection",
  "Lighting Choice",
];

export const FUNCTIONAL_TYPES: RecordType[] = [
  "Furniture Request",
  "Storage Solution",
  "Technology Setup",
  "Privacy Enhancement",
];

export const ASSESSMENT_TYPES: RecordType[] = [
  "Initial Room Setup",
  "Room Audit",
  "Damage Assessment",
  "Moving Rooms",
];

export const CHILD_CHOICE_TYPES: RecordType[] = [
  "Decoration Choice",
  "Poster/Art Display",
  "Bedding Choice",
  "Colour Scheme Selection",
  "Lighting Choice",
  "Personal Items Display",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Initial Room Setup", label: "Initial Room Setup" },
  { type: "Decoration Choice", label: "Decoration Choice" },
  { type: "Furniture Request", label: "Furniture Request" },
  { type: "Poster/Art Display", label: "Poster / Art Display" },
  { type: "Bedding Choice", label: "Bedding Choice" },
  { type: "Colour Scheme Selection", label: "Colour Scheme Selection" },
  { type: "Storage Solution", label: "Storage Solution" },
  { type: "Personal Items Display", label: "Personal Items Display" },
  { type: "Technology Setup", label: "Technology Setup" },
  { type: "Lighting Choice", label: "Lighting Choice" },
  { type: "Privacy Enhancement", label: "Privacy Enhancement" },
  { type: "Seasonal Update", label: "Seasonal Update" },
  { type: "Room Audit", label: "Room Audit" },
  { type: "Damage Assessment", label: "Damage Assessment" },
  { type: "Moving Rooms", label: "Moving Rooms" },
];

// -- Row type -----------------------------------------------------------------

export interface RoomPersonalisationRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  recorded_by: string;
  record_type: RecordType;
  item_description: string;
  child_chose: boolean;
  budget: number | null;
  amount_spent: number | null;
  within_budget: boolean | null;
  age_appropriate: boolean;
  safety_checked: boolean;
  health_safety_compliant: boolean;
  cultural_needs_considered: boolean;
  sensory_needs_considered: boolean;
  child_satisfied: boolean;
  photos_taken: boolean;
  privacy_maintained: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateRoomPersonalisation(input: {
  childName?: string;
  recordDate?: string;
  recordedBy?: string;
  recordType?: string;
  itemDescription?: string;
  childChose?: boolean;
  budget?: number | null;
  amountSpent?: number | null;
  withinBudget?: boolean | null;
  ageAppropriate?: boolean;
  safetyChecked?: boolean;
  healthSafetyCompliant?: boolean;
  culturalNeedsConsidered?: boolean;
  sensoryNeedsConsidered?: boolean;
  childSatisfied?: boolean;
  privacyMaintained?: boolean;
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

  if (!input.itemDescription || input.itemDescription.trim().length === 0) {
    errors.push("Item description is required");
  }

  if (input.budget !== null && input.budget !== undefined && input.budget < 0) {
    errors.push("Budget cannot be negative");
  }

  if (input.amountSpent !== null && input.amountSpent !== undefined && input.amountSpent < 0) {
    errors.push("Amount spent cannot be negative");
  }

  // Business rule: Child must choose decoration items
  if (
    input.childChose === false &&
    input.recordType &&
    (CHILD_CHOICE_TYPES as string[]).includes(input.recordType)
  ) {
    errors.push(
      "Child did not choose this decoration/personalisation item — CHR 2015 Reg 9 requires child-centred care and SCCIF inspectors specifically look for evidence that children personalise their own bedrooms. A room decorated entirely by staff, without the child's input, is institutional rather than homely. Children must have genuine choice over their living space — colour schemes, bedding, posters, and personal items should reflect the child's personality and preferences, not staff taste",
    );
  }

  // Business rule: Safety must be checked for items in children's rooms
  if (input.safetyChecked === false) {
    errors.push(
      "Safety not checked — all items placed in children's bedrooms must be risk-assessed. CHR 2015 Reg 25 requires that the premises are safe. This includes checking for fire hazards (fairy lights, candles, flammable materials near heat sources), hanging risks (long cords, certain types of hooks), sharp edges, toxic materials, and electrical safety. For children with specific risk assessments (self-harm, fire-setting), additional checks are required. Safety must never be compromised, but restrictions should be proportionate and explained to the child",
    );
  }

  // Business rule: H&S compliance
  if (input.healthSafetyCompliant === false) {
    errors.push(
      "Item flagged as not health and safety compliant — CHR 2015 Reg 25 requires that the home meets all health and safety standards. Items that do not meet fire safety regulations, electrical safety standards, or that create trip hazards cannot be placed in children's rooms regardless of the child's preference. The child must be given an explanation and offered compliant alternatives",
    );
  }

  // Business rule: Privacy must be maintained
  if (input.privacyMaintained === false) {
    errors.push(
      "Privacy not maintained — CHR 2015 Reg 10 requires respect for children's privacy. Room personalisation records (including photos) must not compromise the child's privacy. Photos of children's rooms should not be shared outside the professional network. Children's personal items and displays should not be visible to other residents without consent. The child's bedroom is their private space",
    );
  }

  // Business rule: Over budget
  if (
    input.budget !== null &&
    input.budget !== undefined &&
    input.amountSpent !== null &&
    input.amountSpent !== undefined &&
    input.amountSpent > input.budget * 1.2
  ) {
    errors.push(
      "Amount spent significantly exceeds budget (>20% over) — while children's personalisation needs should be met generously, the home has a duty of financial accountability. If the budget was genuinely insufficient for the child's needs, this should be discussed with the Registered Manager and the budget increased formally rather than ad-hoc overspending. Corporate Parenting Principles support adequate expenditure but require good financial governance",
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: RoomPersonalisationRow[],
): {
  total_records: number;
  unique_children: number;
  by_record_type: Record<string, number>;
  decoration_count: number;
  functional_count: number;
  assessment_count: number;
  child_choice_rate: number;
  total_budget: number;
  total_spent: number;
  within_budget_rate: number;
  average_spend_per_record: number;
  average_spend_per_child: number;
  age_appropriate_rate: number;
  safety_checked_rate: number;
  health_safety_compliant_rate: number;
  cultural_needs_considered_rate: number;
  sensory_needs_considered_rate: number;
  child_satisfied_rate: number;
  photos_taken_rate: number;
  privacy_maintained_rate: number;
  average_records_per_child: number;
  children_with_no_decoration: number;
  seasonal_update_count: number;
} {
  const total = rows.length;
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Category counts
  const decorationCount = rows.filter((r) => (DECORATION_TYPES as string[]).includes(r.record_type)).length;
  const functionalCount = rows.filter((r) => (FUNCTIONAL_TYPES as string[]).includes(r.record_type)).length;
  const assessmentCount = rows.filter((r) => (ASSESSMENT_TYPES as string[]).includes(r.record_type)).length;

  // Financial metrics
  const totalBudget = rows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
  const totalSpent = rows.reduce((sum, r) => sum + (Number(r.amount_spent) || 0), 0);
  const budgetRows = rows.filter((r) => r.within_budget !== null);
  const withinBudgetRate = budgetRows.length > 0
    ? Math.round((budgetRows.filter((r) => r.within_budget === true).length / budgetRows.length) * 1000) / 10
    : 0;
  const avgSpendPerRecord = total > 0 ? Math.round((totalSpent / total) * 100) / 100 : 0;
  const avgSpendPerChild = uniqueChildren.size > 0
    ? Math.round((totalSpent / uniqueChildren.size) * 100) / 100
    : 0;

  // Boolean rates
  const pct = (filter: (r: RoomPersonalisationRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const childChoiceRate = pct((r) => r.child_chose);
  const ageAppropriateRate = pct((r) => r.age_appropriate);
  const safetyCheckedRate = pct((r) => r.safety_checked);
  const hsCompliantRate = pct((r) => r.health_safety_compliant);
  const culturalRate = pct((r) => r.cultural_needs_considered);
  const sensoryRate = pct((r) => r.sensory_needs_considered);
  const satisfiedRate = pct((r) => r.child_satisfied);
  const photosRate = pct((r) => r.photos_taken);
  const privacyRate = pct((r) => r.privacy_maintained);

  // Children with no decoration records
  const childDecorationMap = new Map<string, boolean>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if ((DECORATION_TYPES as string[]).includes(r.record_type)) {
      childDecorationMap.set(key, true);
    } else if (!childDecorationMap.has(key)) {
      childDecorationMap.set(key, false);
    }
  }
  const noDecorationCount = Array.from(childDecorationMap.values()).filter((v) => !v).length;

  const seasonalCount = rows.filter((r) => r.record_type === "Seasonal Update").length;
  const avgRecordsPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_record_type: byRecordType,
    decoration_count: decorationCount,
    functional_count: functionalCount,
    assessment_count: assessmentCount,
    child_choice_rate: childChoiceRate,
    total_budget: Math.round(totalBudget * 100) / 100,
    total_spent: Math.round(totalSpent * 100) / 100,
    within_budget_rate: withinBudgetRate,
    average_spend_per_record: avgSpendPerRecord,
    average_spend_per_child: avgSpendPerChild,
    age_appropriate_rate: ageAppropriateRate,
    safety_checked_rate: safetyCheckedRate,
    health_safety_compliant_rate: hsCompliantRate,
    cultural_needs_considered_rate: culturalRate,
    sensory_needs_considered_rate: sensoryRate,
    child_satisfied_rate: satisfiedRate,
    photos_taken_rate: photosRate,
    privacy_maintained_rate: privacyRate,
    average_records_per_child: avgRecordsPerChild,
    children_with_no_decoration: noDecorationCount,
    seasonal_update_count: seasonalCount,
  };
}

export function computeAlerts(
  rows: RoomPersonalisationRow[],
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

  // Critical: Safety not checked
  for (const r of rows) {
    if (!r.safety_checked) {
      alerts.push({
        type: "safety_not_checked",
        severity: "critical",
        message: `${r.child_name}'s room item not safety-checked: "${r.item_description}" (${r.record_type}, ${r.record_date}). CHR 2015 Reg 25 requires safe premises. All items in children's rooms must be assessed for fire risk, hanging risk, electrical safety, and sharp edges. For children with specific risk profiles, additional checks are mandatory. This item must be risk-assessed before remaining in the child's room`,
        record_id: r.id,
      });
    }
  }

  // Critical: H&S non-compliant
  for (const r of rows) {
    if (!r.health_safety_compliant) {
      alerts.push({
        type: "hs_non_compliant",
        severity: "critical",
        message: `${r.child_name}'s room item flagged as not H&S compliant: "${r.item_description}" (${r.record_type}, ${r.record_date}). This item does not meet health and safety standards and must be removed or replaced immediately. CHR 2015 Reg 25 is non-negotiable on safety. Offer the child a compliant alternative and explain clearly why the item cannot stay`,
        record_id: r.id,
      });
    }
  }

  // Critical: Privacy not maintained
  for (const r of rows) {
    if (!r.privacy_maintained) {
      alerts.push({
        type: "privacy_breach",
        severity: "critical",
        message: `${r.child_name}'s privacy not maintained in room personalisation record (${r.record_type}, ${r.record_date}). CHR 2015 Reg 10 requires respect for privacy. If photos were taken without consent, or personal items visible to others without agreement, this must be rectified immediately. Children's bedrooms are private spaces and records about them must be handled with appropriate confidentiality`,
        record_id: r.id,
      });
    }
  }

  // High: Child not choosing in decoration types
  const childChoiceMap = new Map<string, RoomPersonalisationRow[]>();
  for (const r of rows) {
    if ((CHILD_CHOICE_TYPES as string[]).includes(r.record_type)) {
      const key = r.child_name.toLowerCase().trim();
      if (!childChoiceMap.has(key)) childChoiceMap.set(key, []);
      childChoiceMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childChoiceMap) {
    const chosenCount = childRows.filter((r) => r.child_chose).length;
    if (childRows.length >= 3 && chosenCount === 0) {
      alerts.push({
        type: "child_never_chooses",
        severity: "high",
        message: `${childRows[0].child_name} has ${childRows.length} decoration/personalisation records but has never been recorded as making a choice. SCCIF inspectors specifically check whether children personalise their own rooms. A room decorated entirely by staff is institutional, not homely. Is this child being genuinely offered choices? Are their preferences being sought and respected? For children with communication difficulties, are alternative methods of expressing preference being used?`,
      });
    }
  }

  // High: Child not satisfied
  for (const r of rows) {
    if (!r.child_satisfied && (DECORATION_TYPES as string[]).includes(r.record_type)) {
      alerts.push({
        type: "child_not_satisfied",
        severity: "high",
        message: `${r.child_name} recorded as not satisfied with room personalisation: "${r.item_description}" (${r.record_type}, ${r.record_date}). If a child is not happy with their living space, this should be addressed promptly. Their bedroom is the one space in the home that should feel entirely theirs. What would make it better? Were they consulted? Can changes be made to meet their wishes?`,
        record_id: r.id,
      });
    }
  }

  // High: Children with no decoration records at all
  const allChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));
  const childrenWithDecoration = new Set(
    rows.filter((r) => (DECORATION_TYPES as string[]).includes(r.record_type))
      .map((r) => r.child_name.toLowerCase().trim())
  );
  for (const child of allChildren) {
    if (!childrenWithDecoration.has(child)) {
      const childRow = rows.find((r) => r.child_name.toLowerCase().trim() === child);
      if (childRow && rows.filter((r) => r.child_name.toLowerCase().trim() === child).length >= 2) {
        alerts.push({
          type: "no_decoration_records",
          severity: "high",
          message: `${childRow.child_name} has room records but none for personalisation/decoration. SCCIF inspectors look for evidence that bedrooms are personalised and homely. Every child should have opportunities to choose posters, bedding, colours, and personal displays. Is this child being offered personalisation options? Are there barriers (budget, risk assessment, placement uncertainty) preventing personalisation?`,
        });
      }
    }
  }

  // Medium: Low cultural needs consideration
  const culturalCount = rows.filter((r) => r.cultural_needs_considered).length;
  if (rows.length >= 5 && culturalCount / rows.length < 0.3) {
    alerts.push({
      type: "low_cultural_consideration",
      severity: "medium",
      message: `Cultural needs considered in only ${Math.round((culturalCount / rows.length) * 100)}% of room personalisation records. CHR 2015 Reg 5 requires that individual needs are met, including cultural identity. For children from diverse backgrounds, their room should be able to reflect their cultural heritage if they wish — prayer mats, cultural art, flags, religious items. Is the home proactively offering culturally relevant personalisation options?`,
    });
  }

  // Medium: Low sensory needs consideration
  const sensoryCount = rows.filter((r) => r.sensory_needs_considered).length;
  if (rows.length >= 5 && sensoryCount / rows.length < 0.3) {
    alerts.push({
      type: "low_sensory_consideration",
      severity: "medium",
      message: `Sensory needs considered in only ${Math.round((sensoryCount / rows.length) * 100)}% of room personalisation records. Many looked-after children have sensory processing differences (due to neurodevelopmental conditions, trauma, or anxiety). Room personalisation should consider lighting (dimmable, colour temperature), textures (bedding, rugs), noise levels, and visual stimulation. Has an occupational therapy assessment informed room setup where relevant?`,
    });
  }

  // Medium: No room audits
  const auditCount = rows.filter((r) => r.record_type === "Room Audit").length;
  if (rows.length >= 8 && auditCount === 0) {
    alerts.push({
      type: "no_room_audits",
      severity: "medium",
      message: `No room audits recorded across ${rows.length} personalisation records. Regular room audits (with the child's involvement) help identify maintenance needs, update personalisation, check safety, and ensure the room remains suitable as the child grows and their tastes change. Audits should be collaborative, not inspections — they are an opportunity to ask children what they would like to change`,
    });
  }

  // Medium: Spending inequality between children
  const childSpendMap = new Map<string, number>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    childSpendMap.set(key, (childSpendMap.get(key) || 0) + (Number(r.amount_spent) || 0));
  }
  const spendValues = Array.from(childSpendMap.values());
  if (spendValues.length >= 2) {
    const maxSpend = Math.max(...spendValues);
    const minSpend = Math.min(...spendValues);
    if (maxSpend > 0 && minSpend < maxSpend * 0.25) {
      alerts.push({
        type: "spending_inequality",
        severity: "medium",
        message: `Significant spending inequality on room personalisation between children — highest total is £${Math.round(maxSpend * 100) / 100} while lowest is £${Math.round(minSpend * 100) / 100}. Corporate Parenting Principles require equitable treatment. While individual needs differ, children notice disparities in room quality and personalisation. Is there a consistent per-child personalisation budget? Is it being used equitably?`,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: RoomPersonalisationRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} room personalisation ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Decoration items: ${metrics.decoration_count}. Functional: ${metrics.functional_count}. ` +
      `Assessments: ${metrics.assessment_count}. ` +
      `Total spent: £${metrics.total_spent}. Average per child: £${metrics.average_spend_per_child}. ` +
      `Within budget rate: ${metrics.within_budget_rate}%. ` +
      `Child choice rate: ${metrics.child_choice_rate}%. ` +
      `Child satisfaction rate: ${metrics.child_satisfied_rate}%. ` +
      `Safety checked rate: ${metrics.safety_checked_rate}%. ` +
      `Average records per child: ${metrics.average_records_per_child}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `H&S compliant rate: ${metrics.health_safety_compliant_rate}%. ` +
        `Age appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Cultural needs considered: ${metrics.cultural_needs_considered_rate}%. ` +
        `Sensory needs considered: ${metrics.sensory_needs_considered_rate}%. ` +
        `Privacy maintained rate: ${metrics.privacy_maintained_rate}%. ` +
        `Photos taken rate: ${metrics.photos_taken_rate}%. ` +
        `Children with no decoration: ${metrics.children_with_no_decoration}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority room personalisation alerts. ` +
        `H&S compliant rate: ${metrics.health_safety_compliant_rate}%. ` +
        `Cultural needs considered: ${metrics.cultural_needs_considered_rate}%. ` +
        `Sensory needs considered: ${metrics.sensory_needs_considered_rate}%. ` +
        `Continue ensuring bedrooms are personalised and homely per CHR 2015 Reg 25.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_choice_rate < 50 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Child choice recorded in only ${metrics.child_choice_rate}% of room ` +
        `personalisation records. SCCIF inspectors specifically assess whether ` +
        `children's bedrooms are personalised and homely — this is one of the ` +
        `clearest indicators of child-centred care. A room that looks like it ` +
        `was decorated by staff (matching colour schemes, no posters, generic ` +
        `bedding) tells inspectors that children lack agency in their own space. ` +
        `For many looked-after children, having control over their bedroom is ` +
        `the first experience of genuine autonomy. Are children being taken ` +
        `shopping for room items? Are they choosing colours, bedding, and ` +
        `decorations? Is there a personalisation budget they can spend freely?`,
    );
  } else if (metrics.child_satisfied_rate < 60 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Child satisfaction rate is only ${metrics.child_satisfied_rate}% for room ` +
        `personalisation. A child's bedroom should be their sanctuary — the ` +
        `one place in the home that is entirely theirs. If children are not ` +
        `satisfied with their rooms, what barriers exist? Is it budget? Is it ` +
        `overly restrictive risk assessments preventing normal personalisation? ` +
        `Is it that choices offered do not match their actual preferences? ` +
        `Corporate Parenting Principles require that children have what their ` +
        `peers have — most children in family settings have significant ` +
        `control over their bedroom environment.`,
    );
  } else if (metrics.children_with_no_decoration > 0) {
    insights.push(
      `[reflect] ${metrics.children_with_no_decoration} child(ren) have room records but no ` +
        `decoration or personalisation entries. Every child should have a ` +
        `personalised bedroom that reflects who they are. For new placements, ` +
        `personalisation should begin within the first week. For children who ` +
        `seem reluctant, gentle exploration of their interests can reveal what ` +
        `they might like. Some children may need time before they feel safe ` +
        `enough to personalise — this itself is important information about ` +
        `how settled they feel. Are there children who feel their placement ` +
        `is temporary and therefore do not invest in their space?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home balance safety with personalisation? ` +
        `CHR 2015 Reg 25 requires safe premises, but overly restrictive ` +
        `approaches to room personalisation can make bedrooms feel ` +
        `institutional. Banning posters because of adhesive damage, refusing ` +
        `fairy lights because of fire risk, or removing personal items ` +
        `because of ligature concerns must be proportionate and individual. ` +
        `Are risk assessments blanket or personalised? Is the home finding ` +
        `safe alternatives (poster putty, battery fairy lights, soft ` +
        `furnishings) rather than simply refusing? Does the home look and ` +
        `feel like a family home or an institution?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    limit?: number;
  },
): Promise<ServiceResult<RoomPersonalisationRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_room_personalisation") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<RoomPersonalisationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_room_personalisation") as SB)
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
  itemDescription: string;
  childChose?: boolean;
  budget?: number | null;
  amountSpent?: number | null;
  withinBudget?: boolean | null;
  ageAppropriate?: boolean;
  safetyChecked?: boolean;
  healthSafetyCompliant?: boolean;
  culturalNeedsConsidered?: boolean;
  sensoryNeedsConsidered?: boolean;
  childSatisfied?: boolean;
  photosTaken?: boolean;
  privacyMaintained?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<RoomPersonalisationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateRoomPersonalisation({
    childName: input.childName,
    recordDate: input.recordDate,
    recordedBy: input.recordedBy,
    recordType: input.recordType,
    itemDescription: input.itemDescription,
    childChose: input.childChose,
    budget: input.budget,
    amountSpent: input.amountSpent,
    withinBudget: input.withinBudget,
    ageAppropriate: input.ageAppropriate,
    safetyChecked: input.safetyChecked,
    healthSafetyCompliant: input.healthSafetyCompliant,
    culturalNeedsConsidered: input.culturalNeedsConsidered,
    sensoryNeedsConsidered: input.sensoryNeedsConsidered,
    childSatisfied: input.childSatisfied,
    privacyMaintained: input.privacyMaintained,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_room_personalisation") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      recorded_by: input.recordedBy,
      record_type: input.recordType,
      item_description: input.itemDescription,
      child_chose: input.childChose ?? false,
      budget: input.budget ?? null,
      amount_spent: input.amountSpent ?? null,
      within_budget: input.withinBudget ?? null,
      age_appropriate: input.ageAppropriate ?? true,
      safety_checked: input.safetyChecked ?? false,
      health_safety_compliant: input.healthSafetyCompliant ?? true,
      cultural_needs_considered: input.culturalNeedsConsidered ?? false,
      sensory_needs_considered: input.sensoryNeedsConsidered ?? false,
      child_satisfied: input.childSatisfied ?? false,
      photos_taken: input.photosTaken ?? false,
      privacy_maintained: input.privacyMaintained ?? true,
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
    itemDescription: string;
    childChose: boolean;
    budget: number | null;
    amountSpent: number | null;
    withinBudget: boolean | null;
    ageAppropriate: boolean;
    safetyChecked: boolean;
    healthSafetyCompliant: boolean;
    culturalNeedsConsidered: boolean;
    sensoryNeedsConsidered: boolean;
    childSatisfied: boolean;
    photosTaken: boolean;
    privacyMaintained: boolean;
    notes: string | null;
  }>,
): Promise<ServiceResult<RoomPersonalisationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.itemDescription !== undefined) mapped.item_description = updates.itemDescription;
  if (updates.childChose !== undefined) mapped.child_chose = updates.childChose;
  if (updates.budget !== undefined) mapped.budget = updates.budget;
  if (updates.amountSpent !== undefined) mapped.amount_spent = updates.amountSpent;
  if (updates.withinBudget !== undefined) mapped.within_budget = updates.withinBudget;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.safetyChecked !== undefined) mapped.safety_checked = updates.safetyChecked;
  if (updates.healthSafetyCompliant !== undefined) mapped.health_safety_compliant = updates.healthSafetyCompliant;
  if (updates.culturalNeedsConsidered !== undefined) mapped.cultural_needs_considered = updates.culturalNeedsConsidered;
  if (updates.sensoryNeedsConsidered !== undefined) mapped.sensory_needs_considered = updates.sensoryNeedsConsidered;
  if (updates.childSatisfied !== undefined) mapped.child_satisfied = updates.childSatisfied;
  if (updates.photosTaken !== undefined) mapped.photos_taken = updates.photosTaken;
  if (updates.privacyMaintained !== undefined) mapped.privacy_maintained = updates.privacyMaintained;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_room_personalisation") as SB)
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

  const { error } = await (client.from("cs_room_personalisation") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
