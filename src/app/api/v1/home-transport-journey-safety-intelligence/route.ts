import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTransportJourneySafety,
  type TransportLogInput,
  type TransportRiskAssessmentInput,
  type VehicleCheckInput,
} from "@/lib/engines/home-transport-journey-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  // Transport log records → TransportLogInput[]
  const rawLogs = (store.transportLogRecords as any[] ?? []);
  const logs: TransportLogInput[] = rawLogs.map((l: any) => {
    // Derive has_risk_assessment: check if any RA covers passengers in this log
    const passengers = (l.passengers ?? []) as any[];
    const passengerIds = passengers.map((p: any) => p.young_person_id);
    const rawRAs = (store.transportRAs as any[] ?? []);
    const hasRA = rawRAs.some((ra: any) => {
      const raYP = (ra.youngPeople ?? []) as string[];
      return raYP.some((ypId: string) => passengerIds.includes(ypId)) && ra.inUseStatus;
    });

    return {
      id: l.id ?? "",
      driver_licence_checked: !!(l.driver_licence_checked),
      vehicle_checked: !!(l.vehicle_checked),
      incident_during_journey: !!(l.incident_during_journey),
      behaviour_during_journey: l.behaviour_during_journey ?? "calm",
      has_risk_assessment: hasRA,
    };
  });

  // Transport risk assessments → TransportRiskAssessmentInput[]
  const rawRAs = (store.transportRAs as any[] ?? []);
  const riskAssessments: TransportRiskAssessmentInput[] = rawRAs.map((ra: any) => ({
    id: ra.id ?? "",
    behaviour_risk_rating: ra.behaviourRiskRating ?? "Low",
    missing_risk_rating: ra.missingFromCareRisk ?? "Low",
    hazards_count: (ra.hazards ?? []).length,
    mitigations_count: (ra.behaviourMitigations ?? []).length + (ra.missingMitigations ?? []).length,
    signed_off_by_rm: !!(ra.signedOffByRM),
    in_use: !!(ra.inUseStatus),
    needs_review: !!(ra.nextReviewDate && ra.nextReviewDate < today),
  }));

  // Vehicle pre-use checks → VehicleCheckInput[]
  const rawChecks = (store.vehiclePreUseChecks as any[] ?? []);
  const vehicleChecks: VehicleCheckInput[] = rawChecks.map((v: any) => {
    // motValidUntil is a date string — check if still valid
    const motValid = !!(v.motValidUntil && v.motValidUntil >= today);
    return {
      id: v.id ?? "",
      defects_found_count: (v.defectsFound ?? []).length,
      tyres_checked: !!(v.tyresChecked),
      seatbelts_ok: !!(v.seatbeltsOk),
      first_aid_kit_present: !!(v.firstAidKitPresent),
      insurance_confirmed: !!(v.insuranceConfirmed),
      mot_valid: motValid,
    };
  });

  const result = computeTransportJourneySafety({
    today,
    total_children: totalChildren,
    logs,
    risk_assessments: riskAssessments,
    vehicle_checks: vehicleChecks,
  });

  return NextResponse.json({ data: result });
}
