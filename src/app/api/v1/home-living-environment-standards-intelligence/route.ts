// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LIVING ENVIRONMENT STANDARDS INTELLIGENCE API ROUTE
// GET /api/v1/home-living-environment-standards-intelligence
// Cross-domain composite: cleaningEntries + maintenance + kitchenHygieneChecks
// + bedroomProfiles + roomAllocationRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLivingEnvironmentStandards,
  type CleaningEntryInput,
  type MaintenanceItemInput,
  type KitchenHygieneCheckInput,
  type BedroomProfileInput,
  type RoomAllocationInput,
} from "@/lib/engines/home-living-environment-standards-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawCleaning = (store.cleaningEntries ?? []) as any[];
    const cleaning_entries: CleaningEntryInput[] = rawCleaning.map((c: any) => ({
      id: c.id ?? "",
      area: c.area ?? "communal",
      date: (c.date ?? today).toString(),
      completed: c.completed !== false,
      completed_by: c.completed_by ?? "",
      quality_rating: c.quality_rating ?? 3,
      issues_noted: c.issues_noted ?? null,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawMaintenance = (store.maintenance ?? []) as any[];
    const maintenance_items: MaintenanceItemInput[] = rawMaintenance.map((m: any) => ({
      id: m.id ?? "",
      title: m.title ?? "",
      category: m.category ?? "general",
      priority: m.priority ?? "medium",
      status: m.status ?? "open",
      reported_date: (m.reported_date ?? m.date ?? today).toString(),
      completed_date: m.completed_date ?? m.resolved_date ?? null,
      safety_risk: !!m.safety_risk,
      created_at: (m.created_at ?? today).toString(),
    }));

    const rawKitchen = (store.kitchenHygieneChecks ?? []) as any[];
    const kitchen_hygiene_checks: KitchenHygieneCheckInput[] = rawKitchen.map((k: any) => ({
      id: k.id ?? "",
      check_date: (k.check_date ?? k.date ?? today).toString(),
      fridge_temp_ok: k.fridge_temp_ok !== false,
      freezer_temp_ok: k.freezer_temp_ok !== false,
      surfaces_clean: k.surfaces_clean !== false,
      food_storage_compliant: k.food_storage_compliant !== false,
      pest_control_ok: k.pest_control_ok !== false,
      fire_blanket_accessible: k.fire_blanket_accessible !== false,
      overall_pass: k.overall_pass !== false,
      checked_by: k.checked_by ?? "",
      created_at: (k.created_at ?? today).toString(),
    }));

    const rawBedrooms = (store.bedroomProfiles ?? []) as any[];
    const bedroom_profiles: BedroomProfileInput[] = rawBedrooms.map((b: any) => ({
      id: b.id ?? "",
      child_id: b.child_id ?? "",
      personalised: b.personalised !== false,
      child_chose_decor: !!b.child_chose_decor,
      adequate_storage: b.adequate_storage !== false,
      privacy_lock: !!b.privacy_lock,
      condition: b.condition ?? "good",
      last_inspection_date: b.last_inspection_date ?? null,
      created_at: (b.created_at ?? today).toString(),
    }));

    const rawRooms = (store.roomAllocationRecords ?? []) as any[];
    const room_allocations: RoomAllocationInput[] = rawRooms.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      room_number: r.room_number ?? "",
      allocated_date: (r.allocated_date ?? r.date ?? today).toString(),
      suitable_for_needs: r.suitable_for_needs !== false,
      risk_assessed: !!r.risk_assessed,
      child_consulted: !!r.child_consulted,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeLivingEnvironmentStandards({
      today,
      total_children,
      cleaning_entries,
      maintenance_items,
      kitchen_hygiene_checks,
      bedroom_profiles,
      room_allocations,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
