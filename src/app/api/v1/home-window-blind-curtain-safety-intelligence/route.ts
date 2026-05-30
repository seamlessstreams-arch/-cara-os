export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeWindowBlindCurtainSafety,
  type WindowRestrictorRecordInput,
  type BlindCordRecordInput,
  type CurtainConditionRecordInput,
  type BlackoutRecordInput,
  type WindowSafetyInspectionRecordInput,
} from "@/lib/engines/home-window-blind-curtain-safety-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawRestrictors = (store.windowRestrictorRecords ?? []) as any[];
    const window_restrictor_records: WindowRestrictorRecordInput[] = rawRestrictors.map((r: any) => ({
      id: r.id ?? "",
      room_id: r.room_id ?? "",
      room_name: r.room_name ?? "",
      floor_level: r.floor_level ?? 0,
      check_date: (r.check_date ?? today).toString(),
      restrictor_fitted: r.restrictor_fitted ?? false,
      restrictor_functional: r.restrictor_functional ?? false,
      restrictor_type: r.restrictor_type ?? "none",
      opening_within_100mm: r.opening_within_100mm ?? false,
      key_accessible_to_staff_only: r.key_accessible_to_staff_only ?? false,
      checked_by: r.checked_by ?? "",
      issue_identified: r.issue_identified ?? false,
      issue_description: r.issue_description ?? null,
      issue_resolved: r.issue_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBlinds = (store.blindCordRecords ?? []) as any[];
    const blind_cord_records: BlindCordRecordInput[] = rawBlinds.map((r: any) => ({
      id: r.id ?? "",
      room_id: r.room_id ?? "",
      room_name: r.room_name ?? "",
      check_date: (r.check_date ?? today).toString(),
      blind_type: r.blind_type ?? "none",
      cord_present: r.cord_present ?? false,
      cord_secured: r.cord_secured ?? false,
      cord_free_alternative: r.cord_free_alternative ?? false,
      child_accessible: r.child_accessible ?? false,
      safety_device_fitted: r.safety_device_fitted ?? false,
      compliant: r.compliant ?? false,
      checked_by: r.checked_by ?? "",
      issue_identified: r.issue_identified ?? false,
      issue_description: r.issue_description ?? null,
      issue_resolved: r.issue_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCurtains = (store.curtainConditionRecords ?? []) as any[];
    const curtain_condition_records: CurtainConditionRecordInput[] = rawCurtains.map((r: any) => ({
      id: r.id ?? "",
      room_id: r.room_id ?? "",
      room_name: r.room_name ?? "",
      check_date: (r.check_date ?? today).toString(),
      curtain_present: r.curtain_present ?? false,
      curtain_clean: r.curtain_clean ?? false,
      curtain_intact: r.curtain_intact ?? false,
      rail_secure: r.rail_secure ?? false,
      hooks_safe: r.hooks_safe ?? false,
      fire_retardant: r.fire_retardant ?? false,
      appropriate_length: r.appropriate_length ?? false,
      child_safe_rail: r.child_safe_rail ?? false,
      overall_condition: r.overall_condition ?? "fair",
      checked_by: r.checked_by ?? "",
      issue_identified: r.issue_identified ?? false,
      issue_description: r.issue_description ?? null,
      issue_resolved: r.issue_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBlackout = (store.blackoutRecords ?? []) as any[];
    const blackout_records: BlackoutRecordInput[] = rawBlackout.map((r: any) => ({
      id: r.id ?? "",
      room_id: r.room_id ?? "",
      room_name: r.room_name ?? "",
      child_id: r.child_id ?? null,
      check_date: (r.check_date ?? today).toString(),
      blackout_provided: r.blackout_provided ?? false,
      blackout_type: r.blackout_type ?? "none",
      blackout_effective: r.blackout_effective ?? false,
      child_specific_need: r.child_specific_need ?? false,
      need_met: r.need_met ?? false,
      seasonal_review_completed: r.seasonal_review_completed ?? false,
      checked_by: r.checked_by ?? "",
      issue_identified: r.issue_identified ?? false,
      issue_description: r.issue_description ?? null,
      issue_resolved: r.issue_resolved ?? false,
      resolution_date: r.resolution_date ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawInspections = (store.windowSafetyInspectionRecords ?? []) as any[];
    const inspection_records: WindowSafetyInspectionRecordInput[] = rawInspections.map((r: any) => ({
      id: r.id ?? "",
      inspection_date: (r.inspection_date ?? today).toString(),
      inspector: r.inspector ?? "",
      inspection_type: r.inspection_type ?? "routine",
      total_windows_checked: r.total_windows_checked ?? 0,
      total_windows_compliant: r.total_windows_compliant ?? 0,
      total_blinds_checked: r.total_blinds_checked ?? 0,
      total_blinds_compliant: r.total_blinds_compliant ?? 0,
      total_curtains_checked: r.total_curtains_checked ?? 0,
      total_curtains_compliant: r.total_curtains_compliant ?? 0,
      actions_required: r.actions_required ?? 0,
      actions_completed: r.actions_completed ?? 0,
      overall_pass: r.overall_pass ?? false,
      next_inspection_due: r.next_inspection_due ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeWindowBlindCurtainSafety({
      today,
      total_children,
      window_restrictor_records,
      blind_cord_records,
      curtain_condition_records,
      blackout_records,
      inspection_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
