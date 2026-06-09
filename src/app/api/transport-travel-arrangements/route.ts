// ══════════════════════════════════════════════════════════════════════════════
// API: /api/transport-travel-arrangements
//
// Transport & Travel Arrangements Intelligence
//
// GET  — Returns transport/travel metrics with Chamberlain House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateTransportTravelArrangementsIntelligence } from "@/lib/transport-travel-arrangements";
import type {
  TravelRecord,
  VehicleCheck,
  TravelPolicy,
  StaffTravelTraining,
} from "@/lib/transport-travel-arrangements";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData() {
  const records: TravelRecord[] = [
    {
      id: "tr-001",
      childId: "child-alex",
      childName: "Alex",
      travelDate: "2026-01-15",
      travelType: "school_run",
      transportMode: "staff_car",
      driverStaffId: "staff-sarah",
      driverStaffName: "Sarah Johnson",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-002",
      childId: "child-jordan",
      childName: "Jordan",
      travelDate: "2026-01-20",
      travelType: "contact_visit",
      transportMode: "minibus",
      driverStaffId: "staff-tom",
      driverStaffName: "Tom Richards",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-003",
      childId: "child-morgan",
      childName: "Morgan",
      travelDate: "2026-02-05",
      travelType: "medical_appointment",
      transportMode: "staff_car",
      driverStaffId: "staff-lisa",
      driverStaffName: "Lisa Williams",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-004",
      childId: "child-alex",
      childName: "Alex",
      travelDate: "2026-02-18",
      travelType: "therapy_session",
      transportMode: "taxi",
      driverStaffId: "staff-darren",
      driverStaffName: "Darren Laville",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-005",
      childId: "child-jordan",
      childName: "Jordan",
      travelDate: "2026-03-01",
      travelType: "social_activity",
      transportMode: "minibus",
      driverStaffId: "staff-sarah",
      driverStaffName: "Sarah Johnson",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-006",
      childId: "child-morgan",
      childName: "Morgan",
      travelDate: "2026-03-15",
      travelType: "education_placement",
      transportMode: "staff_car",
      driverStaffId: "staff-tom",
      driverStaffName: "Tom Richards",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-007",
      childId: "child-alex",
      childName: "Alex",
      travelDate: "2026-04-02",
      travelType: "court_hearing",
      transportMode: "staff_car",
      driverStaffId: "staff-darren",
      driverStaffName: "Darren Laville",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-008",
      childId: "child-jordan",
      childName: "Jordan",
      travelDate: "2026-04-20",
      travelType: "school_run",
      transportMode: "staff_car",
      driverStaffId: "staff-lisa",
      driverStaffName: "Lisa Williams",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-009",
      childId: "child-morgan",
      childName: "Morgan",
      travelDate: "2026-05-05",
      travelType: "therapy_session",
      transportMode: "staff_car",
      driverStaffId: "staff-sarah",
      driverStaffName: "Sarah Johnson",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
    {
      id: "tr-010",
      childId: "child-alex",
      childName: "Alex",
      travelDate: "2026-05-12",
      travelType: "social_activity",
      transportMode: "minibus",
      driverStaffId: "staff-tom",
      driverStaffName: "Tom Richards",
      riskAssessmentCompleted: true,
      seatbeltUsed: true,
      journeyOnTime: true,
      childComfortable: true,
      insuranceVerified: true,
    },
  ];

  const vehicleChecks: VehicleCheck[] = [
    {
      id: "vc-001",
      vehicleId: "veh-001",
      vehicleName: "Chamberlain House Minibus",
      checkDate: "2026-04-01",
      checkedBy: "Sarah Johnson",
      motCurrent: true,
      insuranceCurrent: true,
      roadworthyCondition: true,
      firstAidKitPresent: true,
      childLockEnabled: true,
      cleanAndTidy: true,
    },
    {
      id: "vc-002",
      vehicleId: "veh-002",
      vehicleName: "Staff Car — Sarah",
      checkDate: "2026-04-01",
      checkedBy: "Tom Richards",
      motCurrent: true,
      insuranceCurrent: true,
      roadworthyCondition: true,
      firstAidKitPresent: true,
      childLockEnabled: true,
      cleanAndTidy: true,
    },
    {
      id: "vc-003",
      vehicleId: "veh-003",
      vehicleName: "Staff Car — Tom",
      checkDate: "2026-04-15",
      checkedBy: "Lisa Williams",
      motCurrent: true,
      insuranceCurrent: true,
      roadworthyCondition: true,
      firstAidKitPresent: true,
      childLockEnabled: true,
      cleanAndTidy: true,
    },
  ];

  const policies: TravelPolicy[] = [
    {
      id: "tp-001",
      driverChecksCompleted: true,
      insuranceVerified: true,
      riskAssessmentProtocol: true,
      loneDrivingPolicy: true,
      breakdownProcedure: true,
      childConsentObtained: true,
      routePlanningRequired: true,
    },
  ];

  const staffTraining: StaffTravelTraining[] = [
    {
      id: "st-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      drivingAssessment: true,
      childTransportSafety: true,
      firstAidTraining: true,
      riskAssessment: true,
      breakdownProcedure: true,
      childComfortAwareness: true,
    },
    {
      id: "st-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      drivingAssessment: true,
      childTransportSafety: true,
      firstAidTraining: true,
      riskAssessment: true,
      breakdownProcedure: true,
      childComfortAwareness: true,
    },
    {
      id: "st-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      drivingAssessment: true,
      childTransportSafety: true,
      firstAidTraining: true,
      riskAssessment: true,
      breakdownProcedure: true,
      childComfortAwareness: true,
    },
    {
      id: "st-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      drivingAssessment: true,
      childTransportSafety: true,
      firstAidTraining: true,
      riskAssessment: true,
      breakdownProcedure: true,
      childComfortAwareness: true,
    },
  ];

  return { records, vehicleChecks, policies, staffTraining };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, vehicleChecks, policies, staffTraining } = generateDemoData();

  const result = generateTransportTravelArrangementsIntelligence(
    records,
    vehicleChecks,
    policies,
    staffTraining,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({ data: result });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    records,
    vehicleChecks,
    policies,
    staffTraining,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    records?: TravelRecord[];
    vehicleChecks?: VehicleCheck[];
    policies?: TravelPolicy[];
    staffTraining?: StaffTravelTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateTransportTravelArrangementsIntelligence(
    records ?? [],
    vehicleChecks ?? [],
    policies ?? [],
    staffTraining ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
