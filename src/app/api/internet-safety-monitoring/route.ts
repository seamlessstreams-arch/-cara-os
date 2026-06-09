// ══════════════════════════════════════════════════════════════════════════════
// API: /api/internet-safety-monitoring
//
// Internet Safety Monitoring Intelligence
//
// GET  — Returns Chamberlain House demo with Alex, Jordan, Morgan
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateInternetSafetyMonitoringIntelligence,
} from "@/lib/internet-safety-monitoring";
import type {
  OnlineSafetyIncident,
  InternetSafetyPolicy,
  StaffInternetTraining,
} from "@/lib/internet-safety-monitoring";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_INCIDENTS: OnlineSafetyIncident[] = [
  {
    id: "inc-001",
    childId: "child-alex",
    childName: "Alex",
    incidentDate: "2026-03-15",
    riskCategory: "cyberbullying",
    severity: "medium",
    identifiedBy: "child_disclosure",
    actionTaken: true,
    childSupported: true,
    parentNotified: true,
    referralMade: false,
    recordedTimely: true,
    lessonsApplied: true,
  },
  {
    id: "inc-002",
    childId: "child-alex",
    childName: "Alex",
    incidentDate: "2026-04-10",
    riskCategory: "inappropriate_content",
    severity: "low",
    identifiedBy: "filter",
    actionTaken: true,
    childSupported: true,
    parentNotified: false,
    referralMade: false,
    recordedTimely: true,
    lessonsApplied: true,
  },
  {
    id: "inc-003",
    childId: "child-jordan",
    childName: "Jordan",
    incidentDate: "2026-02-20",
    riskCategory: "grooming",
    severity: "high",
    identifiedBy: "staff",
    actionTaken: true,
    childSupported: true,
    parentNotified: true,
    referralMade: true,
    recordedTimely: true,
    lessonsApplied: true,
  },
  {
    id: "inc-004",
    childId: "child-jordan",
    childName: "Jordan",
    incidentDate: "2026-04-05",
    riskCategory: "sexting",
    severity: "high",
    identifiedBy: "external_report",
    actionTaken: true,
    childSupported: true,
    parentNotified: true,
    referralMade: true,
    recordedTimely: true,
    lessonsApplied: false,
  },
];

const DEMO_POLICY: InternetSafetyPolicy = {
  id: "policy-001",
  contentFilteringActive: true,
  filteringLevel: "strict",
  regularFilterReview: true,
  onlineSafetyEducation: true,
  socialMediaGuidance: true,
  reportingMechanism: true,
  deviceManagement: true,
};

const DEMO_TRAINING: StaffInternetTraining[] = [
  {
    id: "train-001",
    staffId: "staff-001",
    staffName: "Sarah Johnson",
    onlineSafety: true,
    groomingAwareness: true,
    cyberbullying: true,
    socialMediaRisks: true,
    reportingProcedures: true,
    ageAppropriateAccess: true,
  },
  {
    id: "train-002",
    staffId: "staff-002",
    staffName: "Tom Davies",
    onlineSafety: true,
    groomingAwareness: true,
    cyberbullying: true,
    socialMediaRisks: true,
    reportingProcedures: true,
    ageAppropriateAccess: false,
  },
  {
    id: "train-003",
    staffId: "staff-003",
    staffName: "Lisa Williams",
    onlineSafety: true,
    groomingAwareness: true,
    cyberbullying: false,
    socialMediaRisks: true,
    reportingProcedures: true,
    ageAppropriateAccess: true,
  },
  {
    id: "train-004",
    staffId: "staff-004",
    staffName: "Darren Laville",
    onlineSafety: true,
    groomingAwareness: true,
    cyberbullying: true,
    socialMediaRisks: true,
    reportingProcedures: true,
    ageAppropriateAccess: true,
  },
];

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateInternetSafetyMonitoringIntelligence(
    DEMO_INCIDENTS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({ data: result });
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    incidents,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    incidents?: OnlineSafetyIncident[];
    policy?: InternetSafetyPolicy | null;
    training?: StaffInternetTraining[];
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

  const result = generateInternetSafetyMonitoringIntelligence(
    incidents ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
