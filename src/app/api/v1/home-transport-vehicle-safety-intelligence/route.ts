// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSPORT & VEHICLE SAFETY INTELLIGENCE API ROUTE
// GET /api/v1/home-transport-vehicle-safety-intelligence
// Cross-domain composite: transportLogRecords + vehicleChecks +
// vehiclePreUseChecks + drivingRecords + transportRAs
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTransportVehicleSafety,
  type TransportLogInput,
  type VehicleCheckInput,
  type VehiclePreUseCheckInput,
  type DrivingRecordInput,
  type TransportRAInput,
} from "@/lib/engines/home-transport-vehicle-safety-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawTransportLogs = (store.transportLogRecords ?? []) as any[];
    const transport_logs: TransportLogInput[] = rawTransportLogs.map((l: any) => ({
      id: l.id ?? "",
      date: (l.date ?? today).toString(),
      driver_id: l.driver_id ?? "",
      vehicle_id: l.vehicle_id ?? "",
      child_ids: Array.isArray(l.child_ids) ? l.child_ids : [],
      journey_purpose: l.journey_purpose ?? "",
      start_mileage: l.start_mileage ?? 0,
      end_mileage: l.end_mileage ?? 0,
      seatbelts_checked: !!l.seatbelts_checked,
      incidents_recorded: !!l.incidents_recorded,
      created_at: (l.created_at ?? today).toString(),
    }));

    const rawVehicleChecks = (store.vehicleChecks ?? []) as any[];
    const vehicle_checks: VehicleCheckInput[] = rawVehicleChecks.map((c: any) => ({
      id: c.id ?? "",
      vehicle_id: c.vehicle_id ?? "",
      check_date: (c.check_date ?? today).toString(),
      check_type: c.check_type ?? "weekly",
      passed: !!c.passed,
      defects_found: c.defects_found ?? 0,
      defects_resolved: c.defects_resolved ?? 0,
      mot_current: !!c.mot_current,
      insurance_current: !!c.insurance_current,
      service_due_date: (c.service_due_date ?? today).toString(),
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawPreUseChecks = (store.vehiclePreUseChecks ?? []) as any[];
    const vehicle_pre_use_checks: VehiclePreUseCheckInput[] = rawPreUseChecks.map((c: any) => ({
      id: c.id ?? "",
      vehicle_id: c.vehicle_id ?? "",
      check_date: (c.check_date ?? today).toString(),
      staff_id: c.staff_id ?? "",
      lights_ok: !!c.lights_ok,
      tyres_ok: !!c.tyres_ok,
      brakes_ok: !!c.brakes_ok,
      fluids_ok: !!c.fluids_ok,
      overall_pass: !!c.overall_pass,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawDrivingRecords = (store.drivingRecords ?? []) as any[];
    const driving_records: DrivingRecordInput[] = rawDrivingRecords.map((d: any) => ({
      id: d.id ?? "",
      staff_id: d.staff_id ?? "",
      licence_verified: !!d.licence_verified,
      licence_expiry: (d.licence_expiry ?? today).toString(),
      business_insurance: !!d.business_insurance,
      advanced_training: !!d.advanced_training,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawTransportRAs = (store.transportRAs ?? []) as any[];
    const transport_ras: TransportRAInput[] = rawTransportRAs.map((r: any) => ({
      id: r.id ?? "",
      journey_type: r.journey_type ?? "",
      date: (r.date ?? today).toString(),
      risk_level: r.risk_level ?? "low",
      controls_identified: !!r.controls_identified,
      approved_by: r.approved_by ?? "",
      review_date: (r.review_date ?? today).toString(),
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeTransportVehicleSafety({
      today,
      total_children,
      transport_logs,
      vehicle_checks,
      vehicle_pre_use_checks,
      driving_records,
      transport_ras,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
