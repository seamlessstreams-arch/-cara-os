// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRST AID KIT & MEDICAL SUPPLIES INTELLIGENCE API ROUTE
// GET /api/v1/home-first-aid-kit-medical-supplies-intelligence
// Cross-domain composite: kitCheckRecords + stockRecords + expiryRecords +
// accessibilityRecords + trainingRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFirstAidKitMedicalSupplies,
  type KitCheckInput,
  type StockInput,
  type ExpiryInput,
  type AccessibilityInput,
  type TrainingInput,
} from "@/lib/engines/home-first-aid-kit-medical-supplies-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.status === "current" || s.status === "active").length || staff.length;

    const rawKitChecks = (store.kitCheckRecords ?? []) as any[];
    const kit_check_records: KitCheckInput[] = rawKitChecks.map((k: any) => ({
      id: k.id ?? "",
      kit_id: k.kit_id ?? "",
      kit_name: k.kit_name ?? "",
      kit_location: k.kit_location ?? "",
      check_date: (k.check_date ?? today).toString(),
      checked_by: k.checked_by ?? "",
      check_type: k.check_type ?? "routine",
      all_items_present: !!k.all_items_present,
      items_missing: k.items_missing ?? 0,
      items_damaged: k.items_damaged ?? 0,
      items_replaced: k.items_replaced ?? 0,
      seal_intact: !!k.seal_intact,
      cleanliness_acceptable: k.cleanliness_acceptable !== false,
      signage_visible: k.signage_visible !== false,
      check_documented: !!k.check_documented,
      issues_found: k.issues_found ?? 0,
      issues_resolved: k.issues_resolved ?? 0,
      next_check_due: k.next_check_due ?? null,
      check_overdue: !!k.check_overdue,
      created_at: (k.created_at ?? today).toString(),
    }));

    const rawStock = (store.stockRecords ?? []) as any[];
    const stock_records: StockInput[] = rawStock.map((s: any) => ({
      id: s.id ?? "",
      item_name: s.item_name ?? "",
      item_category: s.item_category ?? "other",
      kit_id: s.kit_id ?? "",
      required_quantity: s.required_quantity ?? 0,
      current_quantity: s.current_quantity ?? 0,
      minimum_threshold: s.minimum_threshold ?? 1,
      reorder_placed: !!s.reorder_placed,
      reorder_date: s.reorder_date ?? null,
      supplier_name: s.supplier_name ?? "",
      unit_cost: s.unit_cost ?? 0,
      last_audit_date: (s.last_audit_date ?? today).toString(),
      audit_matched_records: !!s.audit_matched_records,
      is_critical_item: !!s.is_critical_item,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawExpiry = (store.expiryRecords ?? []) as any[];
    const expiry_records: ExpiryInput[] = rawExpiry.map((e: any) => ({
      id: e.id ?? "",
      item_name: e.item_name ?? "",
      item_category: e.item_category ?? "",
      kit_id: e.kit_id ?? "",
      batch_number: e.batch_number ?? "",
      expiry_date: (e.expiry_date ?? today).toString(),
      is_expired: !!e.is_expired,
      days_until_expiry: e.days_until_expiry ?? 0,
      replacement_ordered: !!e.replacement_ordered,
      replacement_received: !!e.replacement_received,
      disposed_correctly: !!e.disposed_correctly,
      flagged_in_check: !!e.flagged_in_check,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawAccessibility = (store.accessibilityRecords ?? []) as any[];
    const accessibility_records: AccessibilityInput[] = rawAccessibility.map((a: any) => ({
      id: a.id ?? "",
      kit_id: a.kit_id ?? "",
      kit_name: a.kit_name ?? "",
      location: a.location ?? "",
      floor_level: a.floor_level ?? "",
      is_accessible_24hr: !!a.is_accessible_24hr,
      is_clearly_signed: !!a.is_clearly_signed,
      is_wall_mounted: !!a.is_wall_mounted,
      is_unlocked: a.is_unlocked !== false,
      distance_from_main_area_metres: a.distance_from_main_area_metres ?? 0,
      last_location_audit_date: (a.last_location_audit_date ?? today).toString(),
      location_compliant: !!a.location_compliant,
      children_know_location: !!a.children_know_location,
      staff_know_location: a.staff_know_location !== false,
      visitors_informed: !!a.visitors_informed,
      meets_hse_guidance: !!a.meets_hse_guidance,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawTraining = (store.trainingRecords ?? []) as any[];
    const training_records: TrainingInput[] = rawTraining.map((t: any) => ({
      id: t.id ?? "",
      staff_id: t.staff_id ?? "",
      staff_name: t.staff_name ?? "",
      training_type: t.training_type ?? "first_aid_at_work",
      provider: t.provider ?? "",
      certification_date: (t.certification_date ?? today).toString(),
      expiry_date: (t.expiry_date ?? today).toString(),
      is_expired: !!t.is_expired,
      days_until_expiry: t.days_until_expiry ?? 0,
      is_current: t.is_current !== false,
      is_paediatric_qualified: !!t.is_paediatric_qualified,
      refresher_completed: !!t.refresher_completed,
      practical_assessment_passed: !!t.practical_assessment_passed,
      created_at: (t.created_at ?? today).toString(),
    }));

    const result = computeFirstAidKitMedicalSupplies({
      today,
      total_children,
      total_staff,
      kit_check_records,
      stock_records,
      expiry_records,
      accessibility_records,
      training_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
