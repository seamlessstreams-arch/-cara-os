// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & SAFETY INTELLIGENCE API ROUTE
// GET /api/v1/premises-safety-intelligence
// Returns building compliance, check completion, maintenance status, vehicle
// fleet readiness, and ARIA premises insights.
// Reg 25, Reg 24, Schedule 5, SCCIF environmental safety.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePremisesSafetyIntelligence,
  type BuildingInput,
  type BuildingCheckInput,
  type MaintenanceInput,
  type VehicleInput,
  type VehicleCheckInput,
} from "@/lib/engines/premises-safety-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map buildings ─────────────────────────────────────────────────────
  const buildings: BuildingInput[] = (store.buildings ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    status: b.status,
    gas_cert_expiry: b.gas_cert_expiry ?? null,
    electrical_cert_expiry: b.electrical_cert_expiry ?? null,
    fire_risk_assessment_date: b.fire_risk_assessment_date ?? null,
    epc_rating: b.epc_rating ?? null,
    last_full_inspection: b.last_full_inspection ?? null,
    next_inspection_due: b.next_inspection_due ?? null,
  }));

  // ── Map building checks ───────────────────────────────────────────────
  const building_checks: BuildingCheckInput[] = (store.buildingChecks ?? []).map((c: any) => ({
    id: c.id,
    building_id: c.building_id,
    area: c.area,
    check_type: c.check_type,
    check_date: c.check_date,
    due_date: c.due_date,
    responsible_person: c.responsible_person,
    status: c.status,
    result: c.result ?? null,
    risk_level: c.risk_level ?? null,
    notes: c.notes ?? null,
    action_required: c.action_required ?? null,
    action_due: c.action_due ?? null,
    manager_oversight: Boolean(c.manager_oversight),
  }));

  // ── Map maintenance ───────────────────────────────────────────────────
  const maintenance: MaintenanceInput[] = (store.maintenance ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    priority: m.priority,
    status: m.status,
    due_date: m.due_date,
    assigned_to: m.assigned_to ?? null,
    recurring: Boolean(m.recurring),
  }));

  // ── Map vehicles ──────────────────────────────────────────────────────
  const vehicles: VehicleInput[] = (store.vehicles ?? []).map((v: any) => ({
    id: v.id,
    registration: v.registration,
    make: v.make,
    model: v.model,
    status: v.status,
    mot_expiry: v.mot_expiry ?? null,
    insurance_expiry: v.insurance_expiry ?? null,
    tax_expiry: v.tax_expiry ?? null,
    next_service_due: v.next_service_due ?? null,
    mileage: v.mileage ?? 0,
  }));

  // ── Map vehicle checks ────────────────────────────────────────────────
  const vehicle_checks: VehicleCheckInput[] = (store.vehicleChecks ?? []).map((vc: any) => ({
    id: vc.id,
    vehicle_id: vc.vehicle_id,
    check_type: vc.check_type,
    check_date: vc.check_date,
    driver: vc.driver,
    overall_result: vc.overall_result,
    defects: vc.defects ?? null,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computePremisesSafetyIntelligence({
    buildings,
    building_checks,
    maintenance,
    vehicles,
    vehicle_checks,
  });

  return NextResponse.json({ data: result });
}
