// ══════════════════════════════════════════════════════════════════════════════
// CARA — LAUNDRY & CLOTHING MANAGEMENT SERVICE
// Tracks clothing provision, laundry management, personal appearance,
// clothing budgets, and children's dignity in clothing choices.
// CHR 2015 Reg 7 (children's plan — personal appearance),
// Reg 6 (quality of care — daily living),
// Reg 10 (children's views — clothing choices).
//
// Covers: clothing inventories, laundry schedules, budget tracking,
// seasonal clothing, school uniforms, and personal choice.
//
// SCCIF: Overall Experiences — "Children are well-clothed."
// "Children choose their own clothes and take pride in appearance."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ClothingEventType =
  | "clothing_purchase"
  | "clothing_inventory"
  | "laundry_check"
  | "uniform_provision"
  | "seasonal_update"
  | "clothing_repair"
  | "personal_care_items"
  | "budget_review"
  | "other";

export type ClothingCondition =
  | "new"
  | "good"
  | "fair"
  | "worn"
  | "needs_replacing";

export type LaundryStandard =
  | "excellent"
  | "good"
  | "acceptable"
  | "poor"
  | "not_assessed";

export type ChoiceLevel =
  | "full_choice"
  | "some_choice"
  | "limited_choice"
  | "no_choice"
  | "not_assessed";

export interface LaundryClothingRecord {
  id: string;
  home_id: string;
  event_type: ClothingEventType;
  event_date: string;
  child_name: string;
  clothing_condition: ClothingCondition;
  laundry_standard: LaundryStandard;
  choice_level: ChoiceLevel;
  child_chose_own_clothes: boolean;
  adequate_wardrobe: boolean;
  school_uniform_adequate: boolean;
  seasonal_clothing_adequate: boolean;
  laundry_done_regularly: boolean;
  clothes_returned_promptly: boolean;
  personal_items_labelled: boolean;
  budget_amount: number | null;
  amount_spent: number | null;
  dignity_maintained: boolean;
  cultural_needs_met: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CLOTHING_EVENT_TYPES: { type: ClothingEventType; label: string }[] = [
  { type: "clothing_purchase", label: "Clothing Purchase" },
  { type: "clothing_inventory", label: "Clothing Inventory" },
  { type: "laundry_check", label: "Laundry Check" },
  { type: "uniform_provision", label: "Uniform Provision" },
  { type: "seasonal_update", label: "Seasonal Update" },
  { type: "clothing_repair", label: "Clothing Repair" },
  { type: "personal_care_items", label: "Personal Care Items" },
  { type: "budget_review", label: "Budget Review" },
  { type: "other", label: "Other" },
];

export const CLOTHING_CONDITIONS: { condition: ClothingCondition; label: string }[] = [
  { condition: "new", label: "New" },
  { condition: "good", label: "Good" },
  { condition: "fair", label: "Fair" },
  { condition: "worn", label: "Worn" },
  { condition: "needs_replacing", label: "Needs Replacing" },
];

export const LAUNDRY_STANDARDS: { standard: LaundryStandard; label: string }[] = [
  { standard: "excellent", label: "Excellent" },
  { standard: "good", label: "Good" },
  { standard: "acceptable", label: "Acceptable" },
  { standard: "poor", label: "Poor" },
  { standard: "not_assessed", label: "Not Assessed" },
];

export const CHOICE_LEVELS: { level: ChoiceLevel; label: string }[] = [
  { level: "full_choice", label: "Full Choice" },
  { level: "some_choice", label: "Some Choice" },
  { level: "limited_choice", label: "Limited Choice" },
  { level: "no_choice", label: "No Choice" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeLaundryClothingMetrics(
  records: LaundryClothingRecord[],
): {
  total_records: number;
  clothing_purchase_count: number;
  clothing_inventory_count: number;
  laundry_check_count: number;
  child_chose_own_rate: number | null;
  adequate_wardrobe_rate: number | null;
  school_uniform_adequate_rate: number | null;
  seasonal_clothing_rate: number | null;
  laundry_done_regularly_rate: number | null;
  clothes_returned_promptly_rate: number | null;
  dignity_maintained_rate: number | null;
  cultural_needs_met_rate: number | null;
  poor_laundry_count: number;
  needs_replacing_count: number;
  no_choice_count: number;
  full_choice_rate: number | null;
  total_budget: number;
  total_spent: number;
  review_overdue_count: number;
  by_event_type: Record<string, number>;
  by_clothing_condition: Record<string, number>;
  by_laundry_standard: Record<string, number>;
  by_choice_level: Record<string, number>;
} {
  const purchase = records.filter((r) => r.event_type === "clothing_purchase").length;
  const inventory = records.filter((r) => r.event_type === "clothing_inventory").length;
  const laundryCheck = records.filter((r) => r.event_type === "laundry_check").length;

  const boolRate = (field: keyof LaundryClothingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const poorLaundry = records.filter((r) => r.laundry_standard === "poor").length;
  const needsReplacing = records.filter((r) => r.clothing_condition === "needs_replacing").length;
  const noChoice = records.filter((r) => r.choice_level === "no_choice").length;

  const fullChoice = records.filter((r) => r.choice_level === "full_choice").length;
  const fullChoiceRate =
    records.length > 0
      ? Math.round((fullChoice / records.length) * 1000) / 10
      : null;

  const totalBudget = Math.round(
    records.filter((r) => r.budget_amount !== null).reduce((sum, r) => sum + r.budget_amount!, 0) * 100,
  ) / 100;

  const totalSpent = Math.round(
    records.filter((r) => r.amount_spent !== null).reduce((sum, r) => sum + r.amount_spent!, 0) * 100,
  ) / 100;

  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.next_review_date) return false;
    return new Date(r.next_review_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.clothing_condition] = (byCondition[r.clothing_condition] ?? 0) + 1;

  const byLaundry: Record<string, number> = {};
  for (const r of records) byLaundry[r.laundry_standard] = (byLaundry[r.laundry_standard] ?? 0) + 1;

  const byChoice: Record<string, number> = {};
  for (const r of records) byChoice[r.choice_level] = (byChoice[r.choice_level] ?? 0) + 1;

  return {
    total_records: records.length,
    clothing_purchase_count: purchase,
    clothing_inventory_count: inventory,
    laundry_check_count: laundryCheck,
    child_chose_own_rate: boolRate("child_chose_own_clothes"),
    adequate_wardrobe_rate: boolRate("adequate_wardrobe"),
    school_uniform_adequate_rate: boolRate("school_uniform_adequate"),
    seasonal_clothing_rate: boolRate("seasonal_clothing_adequate"),
    laundry_done_regularly_rate: boolRate("laundry_done_regularly"),
    clothes_returned_promptly_rate: boolRate("clothes_returned_promptly"),
    dignity_maintained_rate: boolRate("dignity_maintained"),
    cultural_needs_met_rate: boolRate("cultural_needs_met"),
    poor_laundry_count: poorLaundry,
    needs_replacing_count: needsReplacing,
    no_choice_count: noChoice,
    full_choice_rate: fullChoiceRate,
    total_budget: totalBudget,
    total_spent: totalSpent,
    review_overdue_count: reviewOverdue,
    by_event_type: byType,
    by_clothing_condition: byCondition,
    by_laundry_standard: byLaundry,
    by_choice_level: byChoice,
  };
}

export function identifyLaundryClothingAlerts(
  records: LaundryClothingRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Dignity not maintained
  for (const r of records) {
    if (!r.dignity_maintained) {
      alerts.push({
        type: "dignity_not_maintained",
        severity: "critical",
        message: `Dignity not maintained for ${r.child_name} on ${r.event_date} — address immediately`,
        id: r.id,
      });
    }
  }

  // Inadequate wardrobe
  const inadequate = records.filter((r) => !r.adequate_wardrobe).length;
  if (inadequate >= 1) {
    alerts.push({
      type: "inadequate_wardrobe",
      severity: "high",
      message: `${inadequate} ${inadequate === 1 ? "child has" : "children have"} inadequate wardrobe — arrange clothing provision`,
      id: "inadequate_wardrobe",
    });
  }

  // No choice in clothing
  const noChoice = records.filter((r) => r.choice_level === "no_choice").length;
  if (noChoice >= 1) {
    alerts.push({
      type: "no_clothing_choice",
      severity: "high",
      message: `${noChoice} ${noChoice === 1 ? "record shows" : "records show"} no clothing choice given — children must choose their own clothes`,
      id: "no_clothing_choice",
    });
  }

  // Poor laundry standard
  const poorLaundry = records.filter((r) => r.laundry_standard === "poor").length;
  if (poorLaundry >= 2) {
    alerts.push({
      type: "poor_laundry",
      severity: "medium",
      message: `${poorLaundry} poor laundry standards recorded — review laundry procedures`,
      id: "poor_laundry",
    });
  }

  // Review overdue
  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.next_review_date) return false;
    return new Date(r.next_review_date) < now;
  }).length;
  if (reviewOverdue >= 1) {
    alerts.push({
      type: "review_overdue",
      severity: "medium",
      message: `${reviewOverdue} clothing ${reviewOverdue === 1 ? "review is" : "reviews are"} overdue — schedule promptly`,
      id: "review_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: ClothingEventType;
    clothingCondition?: ClothingCondition;
    laundryStandard?: LaundryStandard;
    limit?: number;
  },
): Promise<ServiceResult<LaundryClothingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_laundry_clothing") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.clothingCondition) q = q.eq("clothing_condition", filters.clothingCondition);
  if (filters?.laundryStandard) q = q.eq("laundry_standard", filters.laundryStandard);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: ClothingEventType;
    eventDate: string;
    childName: string;
    clothingCondition: ClothingCondition;
    laundryStandard: LaundryStandard;
    choiceLevel: ChoiceLevel;
    childChoseOwnClothes: boolean;
    adequateWardrobe: boolean;
    schoolUniformAdequate: boolean;
    seasonalClothingAdequate: boolean;
    laundryDoneRegularly: boolean;
    clothesReturnedPromptly: boolean;
    personalItemsLabelled: boolean;
    budgetAmount?: number;
    amountSpent?: number;
    dignityMaintained: boolean;
    culturalNeedsMet: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    nextReviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<LaundryClothingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_laundry_clothing") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      child_name: input.childName,
      clothing_condition: input.clothingCondition,
      laundry_standard: input.laundryStandard,
      choice_level: input.choiceLevel,
      child_chose_own_clothes: input.childChoseOwnClothes,
      adequate_wardrobe: input.adequateWardrobe,
      school_uniform_adequate: input.schoolUniformAdequate,
      seasonal_clothing_adequate: input.seasonalClothingAdequate,
      laundry_done_regularly: input.laundryDoneRegularly,
      clothes_returned_promptly: input.clothesReturnedPromptly,
      personal_items_labelled: input.personalItemsLabelled,
      budget_amount: input.budgetAmount ?? null,
      amount_spent: input.amountSpent ?? null,
      dignity_maintained: input.dignityMaintained,
      cultural_needs_met: input.culturalNeedsMet,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      assessed_by: input.assessedBy,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<LaundryClothingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_laundry_clothing") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLaundryClothingMetrics,
  identifyLaundryClothingAlerts,
};
