// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CLOTHING & PERSONAL POSSESSIONS INTELLIGENCE API ROUTE
// GET /api/v1/home-clothing-personal-possessions-intelligence
// Cross-domain composite: clothingAllowanceRecords + wardrobeReviewRecords +
// personalInventoryRecords + clothingRequestRecords + possessionSafeguardingRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeClothingPersonalPossessions,
  type ClothingAllowanceRecordInput,
  type WardrobeReviewRecordInput,
  type PersonalInventoryRecordInput,
  type ClothingRequestRecordInput,
  type PossessionSafeguardingRecordInput,
} from "@/lib/engines/home-clothing-personal-possessions-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAllowance = ((store as any).clothingAllowanceRecords ?? []) as any[];
    const clothing_allowance_records: ClothingAllowanceRecordInput[] = rawAllowance.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      period_start: (r.period_start ?? today).toString(),
      period_end: (r.period_end ?? today).toString(),
      allowance_amount_gbp: r.allowance_amount_gbp ?? r.quarterly_allowance ?? 0,
      amount_spent_gbp: r.amount_spent_gbp ?? r.quarter_spend ?? 0,
      child_involved_in_shopping: !!r.child_involved_in_shopping,
      child_chose_own_items: !!r.child_chose_own_items,
      age_appropriate: !!r.age_appropriate,
      seasonal_needs_met: !!r.seasonal_needs_met,
      receipts_retained: !!r.receipts_retained,
      budget_category: r.budget_category ?? "clothing",
      quality_rating: r.quality_rating ?? 3,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawWardrobe = ((store as any).wardrobeReviewRecords ?? []) as any[];
    const wardrobe_review_records: WardrobeReviewRecordInput[] = rawWardrobe.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      review_date: (r.review_date ?? today).toString(),
      reviewer: r.reviewer ?? "",
      season: r.season ?? "spring",
      adequate_clothing: !!r.adequate_clothing,
      adequate_footwear: !!r.adequate_footwear,
      adequate_outerwear: !!r.adequate_outerwear,
      adequate_school_uniform: !!r.adequate_school_uniform,
      adequate_nightwear: !!r.adequate_nightwear,
      adequate_underwear: !!r.adequate_underwear,
      items_needing_replacement: r.items_needing_replacement ?? 0,
      items_replaced: r.items_replaced ?? 0,
      child_consulted: !!r.child_consulted,
      child_satisfied: !!r.child_satisfied,
      cultural_religious_needs_met: !!r.cultural_religious_needs_met,
      dignity_maintained: !!r.dignity_maintained,
      overall_adequate: !!r.overall_adequate,
      action_plan_created: !!r.action_plan_created,
      action_plan_completed: !!r.action_plan_completed,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawInventory = ((store as any).personalInventoryRecords ?? []) as any[];
    const personal_inventory_records: PersonalInventoryRecordInput[] = rawInventory.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      inventory_date: (r.inventory_date ?? today).toString(),
      total_items_recorded: r.total_items_recorded ?? 0,
      items_accounted_for: r.items_accounted_for ?? 0,
      items_missing: r.items_missing ?? 0,
      items_damaged: r.items_damaged ?? 0,
      items_replaced: r.items_replaced ?? 0,
      sentimental_items_safeguarded: !!r.sentimental_items_safeguarded,
      electronics_recorded: !!r.electronics_recorded,
      child_involved_in_inventory: !!r.child_involved_in_inventory,
      storage_adequate: !!r.storage_adequate,
      privacy_respected: !!r.privacy_respected,
      photographic_record: !!r.photographic_record,
      inventory_complete: !!r.inventory_complete,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawRequests = ((store as any).clothingRequestRecords ?? []) as any[];
    const clothing_request_records: ClothingRequestRecordInput[] = rawRequests.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      request_date: (r.request_date ?? today).toString(),
      item_requested: r.item_requested ?? "",
      request_type: r.request_type ?? "replacement",
      urgency: r.urgency ?? "standard",
      fulfilled: !!r.fulfilled,
      fulfilment_date: r.fulfilment_date ?? null,
      days_to_fulfil: r.days_to_fulfil ?? 0,
      child_satisfied_with_outcome: !!r.child_satisfied_with_outcome,
      child_choice_respected: !!r.child_choice_respected,
      reason_if_unfulfilled: r.reason_if_unfulfilled ?? "",
      cost_gbp: r.cost_gbp ?? 0,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSafeguarding = ((store as any).possessionSafeguardingRecords ?? []) as any[];
    const possession_safeguarding_records: PossessionSafeguardingRecordInput[] = rawSafeguarding.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      event_type: r.event_type ?? "audit",
      item_description: r.item_description ?? "",
      item_value_gbp: r.item_value_gbp ?? 0,
      sentimental_value: !!r.sentimental_value,
      resolved: !!r.resolved,
      resolution_date: r.resolution_date ?? null,
      days_to_resolve: r.days_to_resolve ?? 0,
      child_informed: !!r.child_informed,
      child_satisfied: !!r.child_satisfied,
      replacement_provided: !!r.replacement_provided,
      compensation_offered: !!r.compensation_offered,
      incident_documented: !!r.incident_documented,
      staff_involved: r.staff_involved ?? "",
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeClothingPersonalPossessions({
      today,
      total_children,
      clothing_allowance_records,
      wardrobe_review_records,
      personal_inventory_records,
      clothing_request_records,
      possession_safeguarding_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
