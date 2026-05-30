// ==============================================================================
// CORNERSTONE -- HOME CLOTHING LABELLING & STORAGE INTELLIGENCE API ROUTE
// GET /api/v1/home-clothing-labelling-storage-intelligence
// Cross-domain composite: clothingLabellingRecords + clothingStorageRecords +
// clothingRotationRecords + clothingOwnershipRecords + clothingConditionRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeClothingLabellingStorage,
  type ClothingLabellingRecordInput,
  type ClothingStorageRecordInput,
  type ClothingRotationRecordInput,
  type ClothingOwnershipRecordInput,
  type ClothingConditionRecordInput,
} from "@/lib/engines/home-clothing-labelling-storage-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawLabelling = (store.clothingLabellingRecords ?? []) as any[];
    const labelling_records: ClothingLabellingRecordInput[] = rawLabelling.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      total_items_audited: r.total_items_audited ?? 0,
      items_labelled: r.items_labelled ?? 0,
      labelling_method: r.labelling_method ?? "other",
      child_consulted_on_method: !!r.child_consulted_on_method,
      labels_discreet: !!r.labels_discreet,
      labels_durable: !!r.labels_durable,
      labels_checked_after_wash: !!r.labels_checked_after_wash,
      items_lost_since_last_audit: r.items_lost_since_last_audit ?? 0,
      items_returned_via_label: r.items_returned_via_label ?? 0,
      staff_id: r.staff_id ?? "",
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawStorage = (store.clothingStorageRecords ?? []) as any[];
    const storage_records: ClothingStorageRecordInput[] = rawStorage.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      wardrobe_available: !!r.wardrobe_available,
      wardrobe_adequate_size: !!r.wardrobe_adequate_size,
      drawers_available: !!r.drawers_available,
      drawers_adequate_size: !!r.drawers_adequate_size,
      shoe_storage_available: !!r.shoe_storage_available,
      storage_lockable: !!r.storage_lockable,
      child_has_key: !!r.child_has_key,
      storage_clean: !!r.storage_clean,
      storage_personalised: !!r.storage_personalised,
      child_satisfied_with_storage: !!r.child_satisfied_with_storage,
      overflow_items_count: r.overflow_items_count ?? 0,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawRotation = (store.clothingRotationRecords ?? []) as any[];
    const rotation_records: ClothingRotationRecordInput[] = rawRotation.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      season: r.season ?? "spring",
      rotation_completed: !!r.rotation_completed,
      outgrown_items_identified: r.outgrown_items_identified ?? 0,
      outgrown_items_replaced: r.outgrown_items_replaced ?? 0,
      seasonal_items_available: !!r.seasonal_items_available,
      weather_appropriate_clothing: !!r.weather_appropriate_clothing,
      child_involved_in_choices: !!r.child_involved_in_choices,
      budget_allocated: !!r.budget_allocated,
      shopping_trip_offered: !!r.shopping_trip_offered,
      child_satisfaction: r.child_satisfaction ?? 3,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawOwnership = (store.clothingOwnershipRecords ?? []) as any[];
    const ownership_records: ClothingOwnershipRecordInput[] = rawOwnership.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      clothing_belongs_to_child: !!r.clothing_belongs_to_child,
      child_takes_clothing_on_moves: !!r.child_takes_clothing_on_moves,
      shared_clothing_policy_explained: !!r.shared_clothing_policy_explained,
      child_chooses_own_clothing: !!r.child_chooses_own_clothing,
      clothing_reflects_identity: !!r.clothing_reflects_identity,
      cultural_clothing_provided: !!r.cultural_clothing_provided,
      religious_clothing_provided: !!r.religious_clothing_provided,
      child_has_occasion_wear: !!r.child_has_occasion_wear,
      child_satisfied_with_wardrobe: !!r.child_satisfied_with_wardrobe,
      pocket_money_for_clothing: !!r.pocket_money_for_clothing,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCondition = (store.clothingConditionRecords ?? []) as any[];
    const condition_records: ClothingConditionRecordInput[] = rawCondition.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      total_items_checked: r.total_items_checked ?? 0,
      items_good_condition: r.items_good_condition ?? 0,
      items_fair_condition: r.items_fair_condition ?? 0,
      items_poor_condition: r.items_poor_condition ?? 0,
      items_needing_replacement: r.items_needing_replacement ?? 0,
      items_replaced: r.items_replaced ?? 0,
      stains_or_damage_noted: !!r.stains_or_damage_noted,
      repair_completed: !!r.repair_completed,
      underwear_adequate: !!r.underwear_adequate,
      footwear_adequate: !!r.footwear_adequate,
      child_embarrassed_by_clothing: !!r.child_embarrassed_by_clothing,
      school_uniform_adequate: !!r.school_uniform_adequate,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeClothingLabellingStorage({
      today,
      total_children,
      labelling_records,
      storage_records,
      rotation_records,
      ownership_records,
      condition_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
