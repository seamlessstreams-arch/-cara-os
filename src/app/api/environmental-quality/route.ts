// ══════════════════════════════════════════════════════════════════════════════
// Environmental Quality Intelligence API Route
//
// GET  — Returns Oak House demo data intelligence
// POST — Accepts custom data with validation
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateEnvironmentalQualityIntelligence,
} from "@/lib/environmental-quality";
import type {
  EnvironmentalInspection,
  MaintenanceRequest,
  PersonalisationRecord,
  ChildEnvironmentView,
} from "@/lib/environmental-quality";

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_INSPECTIONS: EnvironmentalInspection[] = [
  { id: "insp-01", homeId: "oak-house", date: "2026-01-05", inspectedBy: "Darren Laville", area: "cleanliness", roomType: "kitchen", score: 8, issues: [], photographic: true },
  { id: "insp-02", homeId: "oak-house", date: "2026-01-05", inspectedBy: "Darren Laville", area: "safety", roomType: "kitchen", score: 9, issues: [], photographic: true },
  { id: "insp-03", homeId: "oak-house", date: "2026-01-05", inspectedBy: "Darren Laville", area: "maintenance", roomType: "kitchen", score: 7, issues: ["Extractor fan rattling"], photographic: true },
  { id: "insp-04", homeId: "oak-house", date: "2026-01-06", inspectedBy: "Sarah Johnson", area: "cleanliness", roomType: "bedroom", score: 9, issues: [], photographic: true },
  { id: "insp-05", homeId: "oak-house", date: "2026-01-06", inspectedBy: "Sarah Johnson", area: "personalisation", roomType: "bedroom", score: 9, issues: [], photographic: true },
  { id: "insp-06", homeId: "oak-house", date: "2026-01-06", inspectedBy: "Sarah Johnson", area: "furniture_condition", roomType: "bedroom", score: 8, issues: [], photographic: true },
  { id: "insp-07", homeId: "oak-house", date: "2026-01-07", inspectedBy: "Lisa Williams", area: "lighting", roomType: "lounge", score: 8, issues: [], photographic: false },
  { id: "insp-08", homeId: "oak-house", date: "2026-01-07", inspectedBy: "Lisa Williams", area: "temperature", roomType: "lounge", score: 7, issues: ["Radiator thermostat not responding in corner area"], photographic: false },
  { id: "insp-09", homeId: "oak-house", date: "2026-01-08", inspectedBy: "Tom Richards", area: "outdoor_space", roomType: "garden", score: 7, issues: ["Fence panel needs replacing on west boundary"], photographic: true },
  { id: "insp-10", homeId: "oak-house", date: "2026-01-08", inspectedBy: "Tom Richards", area: "safety", roomType: "garden", score: 8, issues: [], photographic: true },
  { id: "insp-11", homeId: "oak-house", date: "2026-01-10", inspectedBy: "Darren Laville", area: "cleanliness", roomType: "bathroom", score: 9, issues: [], photographic: true },
  { id: "insp-12", homeId: "oak-house", date: "2026-01-10", inspectedBy: "Darren Laville", area: "ventilation", roomType: "bathroom", score: 8, issues: [], photographic: true },
  { id: "insp-13", homeId: "oak-house", date: "2026-01-12", inspectedBy: "Sarah Johnson", area: "decoration", roomType: "lounge", score: 8, issues: [], photographic: true },
  { id: "insp-14", homeId: "oak-house", date: "2026-01-12", inspectedBy: "Sarah Johnson", area: "storage", roomType: "bedroom", score: 7, issues: ["Additional shelving needed in Room 2"], photographic: false },
  { id: "insp-15", homeId: "oak-house", date: "2026-01-14", inspectedBy: "Lisa Williams", area: "accessibility", roomType: "hallway", score: 9, issues: [], photographic: true },
  { id: "insp-16", homeId: "oak-house", date: "2026-01-15", inspectedBy: "Tom Richards", area: "maintenance", roomType: "utility", score: 7, issues: ["Washing machine door seal degraded"], photographic: true },
  { id: "insp-17", homeId: "oak-house", date: "2026-01-18", inspectedBy: "Darren Laville", area: "cleanliness", roomType: "dining_room", score: 9, issues: [], photographic: true },
  { id: "insp-18", homeId: "oak-house", date: "2026-01-18", inspectedBy: "Darren Laville", area: "furniture_condition", roomType: "dining_room", score: 8, issues: [], photographic: true },
  { id: "insp-19", homeId: "oak-house", date: "2026-01-20", inspectedBy: "Sarah Johnson", area: "personalisation", roomType: "quiet_room", score: 9, issues: [], photographic: true },
  { id: "insp-20", homeId: "oak-house", date: "2026-01-22", inspectedBy: "Lisa Williams", area: "safety", roomType: "activity_room", score: 8, issues: [], photographic: true },
  { id: "insp-21", homeId: "oak-house", date: "2026-01-25", inspectedBy: "Tom Richards", area: "lighting", roomType: "bedroom", score: 8, issues: [], photographic: false },
  { id: "insp-22", homeId: "oak-house", date: "2026-01-27", inspectedBy: "Darren Laville", area: "temperature", roomType: "bedroom", score: 8, issues: [], photographic: false },
  { id: "insp-23", homeId: "oak-house", date: "2026-01-28", inspectedBy: "Sarah Johnson", area: "decoration", roomType: "hallway", score: 7, issues: ["Noticeboard needs updating with current photos"], photographic: true },
  { id: "insp-24", homeId: "oak-house", date: "2026-01-30", inspectedBy: "Lisa Williams", area: "ventilation", roomType: "kitchen", score: 7, issues: [], photographic: true },
];

const DEMO_MAINTENANCE: MaintenanceRequest[] = [
  { id: "maint-01", homeId: "oak-house", reportedDate: "2026-01-03", reportedBy: "Sarah Johnson", roomType: "kitchen", description: "Extractor fan rattling and not venting properly", priority: "routine", status: "completed", completedDate: "2026-01-06", daysToResolve: 3 },
  { id: "maint-02", homeId: "oak-house", reportedDate: "2026-01-05", reportedBy: "Lisa Williams", roomType: "bathroom", description: "Shower head leaking when turned off", priority: "routine", status: "completed", completedDate: "2026-01-07", daysToResolve: 2 },
  { id: "maint-03", homeId: "oak-house", reportedDate: "2026-01-08", reportedBy: "Tom Richards", roomType: "garden", description: "Fence panel damaged on west boundary — security risk", priority: "urgent", status: "completed", completedDate: "2026-01-10", daysToResolve: 2 },
  { id: "maint-04", homeId: "oak-house", reportedDate: "2026-01-10", reportedBy: "Darren Laville", roomType: "lounge", description: "Radiator thermostat in corner not responding", priority: "routine", status: "completed", completedDate: "2026-01-14", daysToResolve: 4 },
  { id: "maint-05", homeId: "oak-house", reportedDate: "2026-01-12", reportedBy: "Sarah Johnson", roomType: "bedroom", description: "Wardrobe door hinge loose in Room 2", priority: "routine", status: "completed", completedDate: "2026-01-13", daysToResolve: 1 },
  { id: "maint-06", homeId: "oak-house", reportedDate: "2026-01-15", reportedBy: "Tom Richards", roomType: "utility", description: "Washing machine door seal degraded — water pooling on floor", priority: "urgent", status: "completed", completedDate: "2026-01-17", daysToResolve: 2 },
  { id: "maint-07", homeId: "oak-house", reportedDate: "2026-01-18", reportedBy: "Lisa Williams", roomType: "hallway", description: "Light bulb blown in upstairs hallway", priority: "routine", status: "completed", completedDate: "2026-01-18", daysToResolve: 0 },
  { id: "maint-08", homeId: "oak-house", reportedDate: "2026-01-20", reportedBy: "Darren Laville", roomType: "bedroom", description: "Shelving unit requested for Room 2", priority: "planned_improvement", status: "scheduled" },
  { id: "maint-09", homeId: "oak-house", reportedDate: "2026-01-22", reportedBy: "Sarah Johnson", roomType: "dining_room", description: "Chair leg wobbly at dining table", priority: "routine", status: "completed", completedDate: "2026-01-23", daysToResolve: 1 },
  { id: "maint-10", homeId: "oak-house", reportedDate: "2026-01-25", reportedBy: "Tom Richards", roomType: "garden", description: "Gate latch stiff and difficult for children to open", priority: "routine", status: "overdue" },
  { id: "maint-11", homeId: "oak-house", reportedDate: "2026-01-28", reportedBy: "Lisa Williams", roomType: "hallway", description: "Noticeboard frame cracked — needs replacement", priority: "planned_improvement", status: "scheduled" },
];

const DEMO_PERSONALISATION: PersonalisationRecord[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    bedroomPersonalised: true,
    choiceInDecor: true,
    personalItems: true,
    culturalConsiderations: true,
    lastReviewDate: "2026-01-10",
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    bedroomPersonalised: true,
    choiceInDecor: true,
    personalItems: true,
    culturalConsiderations: true,
    lastReviewDate: "2026-01-12",
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    bedroomPersonalised: true,
    choiceInDecor: true,
    personalItems: true,
    culturalConsiderations: true,
    lastReviewDate: "2025-12-20",
  },
];

const DEMO_CHILD_VIEWS: ChildEnvironmentView[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    date: "2026-01-15",
    overallSatisfaction: 8,
    feelsHomely: true,
    feelsPrivate: true,
    feelsSafe: true,
    suggestionsForImprovement: ["Would like a bigger desk for homework"],
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-01-15",
    overallSatisfaction: 9,
    feelsHomely: true,
    feelsPrivate: true,
    feelsSafe: true,
    suggestionsForImprovement: [],
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-01-15",
    overallSatisfaction: 8,
    feelsHomely: true,
    feelsPrivate: true,
    feelsSafe: true,
    suggestionsForImprovement: ["More fairy lights in the lounge would be nice"],
  },
];

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const periodStart = "2026-01-01";
  const periodEnd = "2026-01-31";
  const referenceDate = new Date().toISOString().slice(0, 10);

  const result = generateEnvironmentalQualityIntelligence(
    DEMO_INSPECTIONS,
    DEMO_MAINTENANCE,
    DEMO_PERSONALISATION,
    DEMO_CHILD_VIEWS,
    "oak-house",
    periodStart,
    periodEnd,
    referenceDate,
  );

  return NextResponse.json(result);
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      inspections,
      maintenanceRequests,
      personalisationRecords,
      childViews,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    // Validation
    if (!Array.isArray(inspections)) {
      return NextResponse.json({ error: "inspections must be an array" }, { status: 400 });
    }
    if (!Array.isArray(maintenanceRequests)) {
      return NextResponse.json({ error: "maintenanceRequests must be an array" }, { status: 400 });
    }
    if (!Array.isArray(personalisationRecords)) {
      return NextResponse.json({ error: "personalisationRecords must be an array" }, { status: 400 });
    }
    if (!Array.isArray(childViews)) {
      return NextResponse.json({ error: "childViews must be an array" }, { status: 400 });
    }
    if (typeof homeId !== "string" || !homeId) {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }
    if (typeof periodStart !== "string" || !periodStart) {
      return NextResponse.json({ error: "periodStart is required" }, { status: 400 });
    }
    if (typeof periodEnd !== "string" || !periodEnd) {
      return NextResponse.json({ error: "periodEnd is required" }, { status: 400 });
    }
    if (typeof referenceDate !== "string" || !referenceDate) {
      return NextResponse.json({ error: "referenceDate is required" }, { status: 400 });
    }

    const result = generateEnvironmentalQualityIntelligence(
      inspections as EnvironmentalInspection[],
      maintenanceRequests as MaintenanceRequest[],
      personalisationRecords as PersonalisationRecord[],
      childViews as ChildEnvironmentView[],
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 },
    );
  }
}
