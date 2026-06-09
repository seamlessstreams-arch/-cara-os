// ==============================================================================
// API: /api/night-care
//
// Night Care Intelligence
//
// GET  — Returns night care assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateNightCareIntelligence,
  getCategoryLabel,
  getOutcomeLabel,
  getRatingLabel,
} from "@/lib/night-care";
import type {
  NightCareRecord,
  NightCarePolicy,
  NightCareStaffTraining,
} from "@/lib/night-care";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_RECORDS: NightCareRecord[] = [
  // Alex — 4 records across categories
  {
    id: "nc-alex-1", homeId: "oak-house", date: "2026-05-10",
    childId: "child-alex", childName: "Alex",
    category: "night_check", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-alex-2", homeId: "oak-house", date: "2026-05-10",
    childId: "child-alex", childName: "Alex",
    category: "sleep_monitoring", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-alex-3", homeId: "oak-house", date: "2026-05-11",
    childId: "child-alex", childName: "Alex",
    category: "bedtime_routine", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-alex-4", homeId: "oak-house", date: "2026-05-12",
    childId: "child-alex", childName: "Alex",
    category: "night_medication", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  // Jordan — 4 records including a disturbance response
  {
    id: "nc-jordan-1", homeId: "oak-house", date: "2026-05-10",
    childId: "child-jordan", childName: "Jordan",
    category: "night_check", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-jordan-2", homeId: "oak-house", date: "2026-05-10",
    childId: "child-jordan", childName: "Jordan",
    category: "disturbance_response", outcome: "minor_disturbance",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-jordan-3", homeId: "oak-house", date: "2026-05-11",
    childId: "child-jordan", childName: "Jordan",
    category: "waking_night_support", outcome: "support_provided",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-jordan-4", homeId: "oak-house", date: "2026-05-12",
    childId: "child-jordan", childName: "Jordan",
    category: "night_incident", outcome: "minor_disturbance",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  // Morgan — 4 records including handover
  {
    id: "nc-morgan-1", homeId: "oak-house", date: "2026-05-10",
    childId: "child-morgan", childName: "Morgan",
    category: "night_check", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-morgan-2", homeId: "oak-house", date: "2026-05-10",
    childId: "child-morgan", childName: "Morgan",
    category: "night_handover", outcome: "not_applicable",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-morgan-3", homeId: "oak-house", date: "2026-05-11",
    childId: "child-morgan", childName: "Morgan",
    category: "sleep_monitoring", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
  {
    id: "nc-morgan-4", homeId: "oak-house", date: "2026-05-12",
    childId: "child-morgan", childName: "Morgan",
    category: "bedtime_routine", outcome: "settled_night",
    nightCheckCompleted: true, sleepPatternRecorded: true,
    incidentHandledAppropriately: true, childComfortChecked: true,
    documentationComplete: true, timelyRecording: true,
  },
];

const DEMO_POLICY: NightCarePolicy = {
  nightCarePolicy: true,
  sleepMonitoringGuidance: true,
  nightIncidentProcedure: true,
  wakingNightPolicy: true,
  nightMedicationProtocol: true,
  bedtimeRoutineGuidance: true,
  nightHandoverProcedure: true,
};

const DEMO_TRAINING: NightCareStaffTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", nightCareCompetency: true, sleepMonitoringSkills: true, nightIncidentResponse: true, nightMedicationHandling: true, childComfortTechniques: true, nightHandoverProcedure: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", nightCareCompetency: true, sleepMonitoringSkills: true, nightIncidentResponse: true, nightMedicationHandling: true, childComfortTechniques: true, nightHandoverProcedure: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", nightCareCompetency: true, sleepMonitoringSkills: true, nightIncidentResponse: true, nightMedicationHandling: true, childComfortTechniques: true, nightHandoverProcedure: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", nightCareCompetency: true, sleepMonitoringSkills: true, nightIncidentResponse: true, nightMedicationHandling: true, childComfortTechniques: true, nightHandoverProcedure: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateNightCareIntelligence(
    DEMO_RECORDS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "night-care",
        version: "2.0.0",
        categoryLabels: Object.fromEntries(
          (["night_check", "sleep_monitoring", "night_incident", "waking_night_support", "night_medication", "bedtime_routine", "night_handover", "disturbance_response"] as const).map(
            (v) => [v, getCategoryLabel(v)],
          ),
        ),
        outcomeLabels: Object.fromEntries(
          (["settled_night", "minor_disturbance", "significant_incident", "support_provided", "not_applicable"] as const).map(
            (v) => [v, getOutcomeLabel(v)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { records, policy, training, homeId, periodStart, periodEnd } = body as {
    records?: NightCareRecord[];
    policy?: NightCarePolicy | null;
    training?: NightCareStaffTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateNightCareIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "night-care",
        version: "2.0.0",
      },
    },
  });
}
