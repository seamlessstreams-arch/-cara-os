// ══════════════════════════════════════════════════════════════════════════════
// API: /api/transport-safety-compliance
//
// Transport Safety Compliance Intelligence
//
// GET  — Returns transport safety metrics with Chamberlain House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateTransportSafetyComplianceIntelligence } from "@/lib/transport-safety-compliance";
import type {
  VehicleRecord,
  JourneyRecord,
  DriverRecord,
  TransportIncident,
} from "@/lib/transport-safety-compliance";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData() {
  const vehicles: VehicleRecord[] = [
    {
      id: "veh-001",
      vehicleType: "minibus",
      registration: "OAK 001",
      lastServiceDate: "2026-03-10",
      nextServiceDue: "2026-09-10",
      motExpiryDate: "2027-03-10",
      insuranceExpiryDate: "2027-01-15",
      lastCheckDate: "2026-05-01",
      checkStatus: "passed",
      seatingCapacity: 8,
    },
    {
      id: "veh-002",
      vehicleType: "staff_vehicle",
      registration: "OAK 002",
      lastServiceDate: "2026-02-01",
      nextServiceDue: "2026-08-01",
      motExpiryDate: "2026-12-01",
      insuranceExpiryDate: "2026-11-01",
      lastCheckDate: "2026-04-15",
      checkStatus: "minor_issues",
      seatingCapacity: 5,
    },
  ];

  const journeys: JourneyRecord[] = [
    {
      id: "j-001",
      date: "2026-01-15",
      vehicleId: "veh-001",
      driverId: "driver-001",
      driverName: "Sarah Johnson",
      childIds: ["child-alex", "child-jordan"],
      journeyPurpose: "school_run",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 20,
    },
    {
      id: "j-002",
      date: "2026-02-03",
      vehicleId: "veh-002",
      driverId: "driver-002",
      driverName: "Tom Richards",
      childIds: ["child-morgan"],
      journeyPurpose: "medical_appointment",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 35,
    },
    {
      id: "j-003",
      date: "2026-02-20",
      vehicleId: "veh-001",
      driverId: "driver-001",
      driverName: "Sarah Johnson",
      childIds: ["child-alex"],
      journeyPurpose: "family_contact",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 45,
    },
    {
      id: "j-004",
      date: "2026-03-10",
      vehicleId: "veh-001",
      driverId: "driver-003",
      driverName: "Darren Laville",
      childIds: ["child-jordan", "child-morgan"],
      journeyPurpose: "activity",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 60,
    },
    {
      id: "j-005",
      date: "2026-03-25",
      vehicleId: "veh-001",
      driverId: "driver-002",
      driverName: "Tom Richards",
      childIds: ["child-alex", "child-jordan", "child-morgan"],
      journeyPurpose: "activity",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 90,
    },
    {
      id: "j-006",
      date: "2026-04-05",
      vehicleId: "veh-002",
      driverId: "driver-001",
      driverName: "Sarah Johnson",
      childIds: ["child-alex"],
      journeyPurpose: "school_run",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 20,
    },
    {
      id: "j-007",
      date: "2026-04-18",
      vehicleId: "veh-001",
      driverId: "driver-003",
      driverName: "Darren Laville",
      childIds: ["child-morgan"],
      journeyPurpose: "social_worker_visit",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 30,
    },
    {
      id: "j-008",
      date: "2026-05-02",
      vehicleId: "veh-002",
      driverId: "driver-002",
      driverName: "Tom Richards",
      childIds: ["child-jordan"],
      journeyPurpose: "court_hearing",
      riskAssessmentCompleted: true,
      seatbeltChecked: true,
      journeyLogCompleted: true,
      incidentOccurred: false,
      duration: 55,
    },
  ];

  const drivers: DriverRecord[] = [
    {
      id: "driver-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      licenceValid: true,
      dbsChecked: true,
      driverTrainingCompleted: true,
      firstAidTrained: true,
      licenceExpiryDate: "2028-06-01",
      lastAssessmentDate: "2026-02-15",
    },
    {
      id: "driver-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      licenceValid: true,
      dbsChecked: true,
      driverTrainingCompleted: true,
      firstAidTrained: true,
      licenceExpiryDate: "2029-01-01",
      lastAssessmentDate: "2026-01-20",
    },
    {
      id: "driver-003",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      licenceValid: true,
      dbsChecked: true,
      driverTrainingCompleted: true,
      firstAidTrained: true,
      licenceExpiryDate: "2028-09-01",
      lastAssessmentDate: "2026-03-01",
    },
  ];

  const incidents: TransportIncident[] = [];

  const childIds = ["child-alex", "child-jordan", "child-morgan"];

  return { vehicles, journeys, drivers, incidents, childIds };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { vehicles, journeys, drivers, incidents, childIds } = generateDemoData();

  const result = generateTransportSafetyComplianceIntelligence(
    vehicles,
    journeys,
    drivers,
    incidents,
    childIds,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
    "2026-05-18",
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
    vehicles,
    journeys,
    drivers,
    incidents,
    childIds,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    vehicles?: VehicleRecord[];
    journeys?: JourneyRecord[];
    drivers?: DriverRecord[];
    incidents?: TransportIncident[];
    childIds?: string[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateTransportSafetyComplianceIntelligence(
    vehicles ?? [],
    journeys ?? [],
    drivers ?? [],
    incidents ?? [],
    childIds ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString(),
  );

  return NextResponse.json({ data: result });
}
