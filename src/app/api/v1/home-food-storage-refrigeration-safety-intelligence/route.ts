export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFoodStorageRefrigerationSafety,
  type TemperatureLogRecordInput,
  type StorageComplianceRecordInput,
  type DateCheckRecordInput,
  type HygieneRatingRecordInput,
  type CrossContaminationRecordInput,
} from "@/lib/engines/home-food-storage-refrigeration-safety-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawTempLogs = (store.temperatureLogRecords ?? []) as any[];
    const temperature_log_records: TemperatureLogRecordInput[] = rawTempLogs.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      appliance_id: r.appliance_id ?? "",
      appliance_type: r.appliance_type ?? "fridge",
      appliance_name: r.appliance_name ?? "",
      recorded_temperature_celsius: r.recorded_temperature_celsius ?? 0,
      target_min_celsius: r.target_min_celsius ?? 0,
      target_max_celsius: r.target_max_celsius ?? 5,
      in_range: r.in_range ?? false,
      corrective_action_taken: r.corrective_action_taken ?? false,
      corrective_action_details: r.corrective_action_details ?? null,
      recorded_by: r.recorded_by ?? "",
      time_of_check: r.time_of_check ?? "",
      thermometer_calibrated: r.thermometer_calibrated ?? false,
      second_check_done: r.second_check_done ?? false,
      second_check_temperature: r.second_check_temperature ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawStorageCompliance = (store.storageComplianceRecords ?? []) as any[];
    const storage_compliance_records: StorageComplianceRecordInput[] = rawStorageCompliance.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      area_checked: r.area_checked ?? "fridge",
      area_name: r.area_name ?? "",
      items_correctly_stored: r.items_correctly_stored ?? false,
      raw_separated_from_cooked: r.raw_separated_from_cooked ?? false,
      items_covered_wrapped: r.items_covered_wrapped ?? false,
      items_labelled: r.items_labelled ?? false,
      items_dated: r.items_dated ?? false,
      no_floor_storage: r.no_floor_storage ?? false,
      correct_shelf_positioning: r.correct_shelf_positioning ?? false,
      no_overcrowding: r.no_overcrowding ?? false,
      allergen_items_segregated: r.allergen_items_segregated ?? false,
      checked_by: r.checked_by ?? "",
      issues_found: r.issues_found ?? [],
      issues_resolved: r.issues_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawDateChecks = (store.dateCheckRecords ?? []) as any[];
    const date_check_records: DateCheckRecordInput[] = rawDateChecks.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      area_checked: r.area_checked ?? "",
      total_items_checked: r.total_items_checked ?? 0,
      items_in_date: r.items_in_date ?? 0,
      items_out_of_date: r.items_out_of_date ?? 0,
      items_removed: r.items_removed ?? 0,
      items_approaching_expiry: r.items_approaching_expiry ?? 0,
      use_by_dates_visible: r.use_by_dates_visible ?? false,
      open_dates_marked: r.open_dates_marked ?? false,
      fifo_rotation_followed: r.fifo_rotation_followed ?? false,
      checked_by: r.checked_by ?? "",
      corrective_actions: r.corrective_actions ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawHygieneRatings = (store.hygieneRatingRecords ?? []) as any[];
    const hygiene_rating_records: HygieneRatingRecordInput[] = rawHygieneRatings.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      assessment_type: r.assessment_type ?? "internal_audit",
      assessor: r.assessor ?? "",
      fridge_cleanliness: r.fridge_cleanliness ?? 3,
      freezer_cleanliness: r.freezer_cleanliness ?? 3,
      storage_area_cleanliness: r.storage_area_cleanliness ?? 3,
      food_handling_practice: r.food_handling_practice ?? 3,
      hand_washing_compliance: r.hand_washing_compliance ?? false,
      cleaning_schedule_followed: r.cleaning_schedule_followed ?? false,
      pest_control_satisfactory: r.pest_control_satisfactory ?? false,
      waste_disposal_correct: r.waste_disposal_correct ?? false,
      overall_hygiene_score: r.overall_hygiene_score ?? 3,
      issues_identified: r.issues_identified ?? [],
      issues_resolved: r.issues_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      eho_rating: r.eho_rating ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCrossContam = (store.crossContaminationRecords ?? []) as any[];
    const cross_contamination_records: CrossContaminationRecordInput[] = rawCrossContam.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      check_type: r.check_type ?? "routine",
      colour_coded_boards_used: r.colour_coded_boards_used ?? false,
      separate_utensils_raw_cooked: r.separate_utensils_raw_cooked ?? false,
      allergen_separation_maintained: r.allergen_separation_maintained ?? false,
      hand_washing_between_tasks: r.hand_washing_between_tasks ?? false,
      gloves_changed_appropriately: r.gloves_changed_appropriately ?? false,
      raw_food_stored_below_cooked: r.raw_food_stored_below_cooked ?? false,
      separate_prep_areas_used: r.separate_prep_areas_used ?? false,
      cleaning_between_tasks: r.cleaning_between_tasks ?? false,
      staff_member_observed: r.staff_member_observed ?? "",
      checked_by: r.checked_by ?? "",
      issues_found: r.issues_found ?? [],
      corrective_action_taken: r.corrective_action_taken ?? false,
      corrective_action_details: r.corrective_action_details ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeFoodStorageRefrigerationSafety({
      today,
      total_children,
      temperature_log_records,
      storage_compliance_records,
      date_check_records,
      hygiene_rating_records,
      cross_contamination_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
