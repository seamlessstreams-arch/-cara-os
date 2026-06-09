// ══════════════════════════════════════════════════════════════════════════════
// Sensory & Therapeutic Environment Intelligence API Route
//
// GET  — Returns Chamberlain House demo data intelligence
// POST — Accepts custom data with validation
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSensoryEnvironmentIntelligence,
} from "@/lib/sensory-environment";
import type {
  ChildSensoryProfile,
  SpaceAssessment,
  EnvironmentalAdaptation,
  TherapeuticSpaceUsage,
} from "@/lib/sensory-environment";

// ── Demo Data ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES = ["Alex", "Jordan", "Morgan"];

const DEMO_PROFILES: ChildSensoryProfile[] = [
  {
    id: "sp-01",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2025-11-15",
    assessedBy: "Sarah Johnson",
    sensoryNeeds: ["noise_sensitivity", "calming_input"],
    preferences: ["Weighted blanket", "Low background music", "Dim lighting in bedroom"],
    triggers: ["Loud sudden noises", "Crowded spaces", "Multiple conversations at once"],
    calmingStrategies: ["Weighted blanket", "Noise-cancelling headphones", "Deep breathing exercises", "Quiet room access"],
    sensoryDiet: ["Morning sensory circuit", "Afternoon proprioceptive break", "Evening wind-down routine"],
    reviewDate: "2026-05-15",
  },
  {
    id: "sp-02",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2025-12-01",
    assessedBy: "Lisa Williams",
    sensoryNeeds: ["tactile_sensitivity"],
    preferences: ["Soft cotton clothing only", "Smooth textures on furniture", "No tags on clothing"],
    triggers: ["Unexpected touch", "Rough fabric textures", "Sticky or wet textures"],
    calmingStrategies: ["Fidget toys", "Tactile comfort items", "Personal space reminders to peers"],
    sensoryDiet: ["Fidget breaks during study", "Tactile play in sensory room"],
    reviewDate: "2026-06-01",
  },
  {
    id: "sp-03",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2025-10-20",
    assessedBy: "Tom Richards",
    sensoryNeeds: ["light_sensitivity", "visual_stimulation"],
    preferences: ["Adjustable lighting", "Natural daylight when possible", "Coloured LED options in bedroom"],
    triggers: ["Harsh fluorescent lighting", "Flickering lights", "Bright screens in dark rooms"],
    calmingStrategies: ["Blue-light filtering glasses", "Adjustable desk lamp", "Nature projection lamp"],
    reviewDate: "2026-04-20",
  },
];

const DEMO_ASSESSMENTS: SpaceAssessment[] = [
  {
    id: "sa-01",
    spaceType: "bedroom",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "highly_personalised",
    childFriendly: true,
    sensoryConsiderations: ["Blackout curtains fitted", "Noise-reducing carpet"],
    improvementsNeeded: [],
  },
  {
    id: "sa-02",
    spaceType: "living_room",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "moderate",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "moderate",
    childFriendly: true,
    sensoryConsiderations: ["Soft furnishings to reduce echo"],
    improvementsNeeded: ["Install additional soft furnishings to reduce noise further"],
  },
  {
    id: "sa-03",
    spaceType: "kitchen",
    assessmentDate: "2025-12-10",
    assessedBy: "Darren Laville",
    noiseLevel: "high",
    lightingQuality: "fixed",
    temperature: "variable",
    personalisationLevel: "basic",
    childFriendly: true,
    sensoryConsiderations: ["Extractor fan noise can be triggering"],
    improvementsNeeded: ["Fit quieter extractor fan", "Add adjustable lighting"],
  },
  {
    id: "sa-04",
    spaceType: "quiet_room",
    assessmentDate: "2025-12-10",
    assessedBy: "Lisa Williams",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "highly_personalised",
    childFriendly: true,
    sensoryConsiderations: ["Sound-proofing installed", "Dimmable lights", "Soft textures throughout"],
    improvementsNeeded: [],
  },
  {
    id: "sa-05",
    spaceType: "sensory_room",
    assessmentDate: "2025-12-10",
    assessedBy: "Tom Richards",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "highly_personalised",
    childFriendly: true,
    sensoryConsiderations: ["Bubble tube", "Fibre optics", "Weighted blankets", "Tactile wall panels"],
    improvementsNeeded: [],
  },
  {
    id: "sa-06",
    spaceType: "garden",
    assessmentDate: "2025-12-10",
    assessedBy: "Darren Laville",
    noiseLevel: "moderate",
    lightingQuality: "natural",
    temperature: "variable",
    personalisationLevel: "moderate",
    childFriendly: true,
    sensoryConsiderations: ["Outdoor sensory path", "Trampoline for vestibular input"],
    improvementsNeeded: ["Add sheltered sensory area for adverse weather"],
  },
  {
    id: "sa-07",
    spaceType: "study_space",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "moderate",
    childFriendly: true,
    sensoryConsiderations: ["Individual study booths with adjustable lighting"],
    improvementsNeeded: [],
  },
  {
    id: "sa-08",
    spaceType: "bathroom",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "low",
    lightingQuality: "fixed",
    temperature: "comfortable",
    personalisationLevel: "basic",
    childFriendly: true,
    sensoryConsiderations: ["Non-slip surfaces"],
    improvementsNeeded: ["Install adjustable lighting to replace harsh fixed lighting"],
  },
];

const DEMO_ADAPTATIONS: EnvironmentalAdaptation[] = [
  {
    id: "ea-01",
    childId: "child-alex",
    childName: "Alex",
    spaceType: "bedroom",
    adaptationType: "noise_reduction",
    description: "Noise-cancelling headphones provided and sound-dampening panels installed",
    implementedDate: "2025-11-20",
    reviewDate: "2026-05-20",
    status: "active",
    effectiveness: "effective",
    childFeedback: "Really helps when it gets noisy",
  },
  {
    id: "ea-02",
    childId: "child-alex",
    childName: "Alex",
    spaceType: "quiet_room",
    adaptationType: "safe_space_creation",
    description: "Dedicated calm corner with weighted blanket and soft lighting",
    implementedDate: "2025-11-25",
    reviewDate: "2026-05-25",
    status: "active",
    effectiveness: "effective",
    childFeedback: "My favourite place when I need to chill out",
  },
  {
    id: "ea-03",
    childId: "child-jordan",
    childName: "Jordan",
    spaceType: "bedroom",
    adaptationType: "texture_choice",
    description: "All bedding replaced with smooth cotton, no tags, soft-touch surfaces",
    implementedDate: "2025-12-05",
    reviewDate: "2026-06-05",
    status: "active",
    effectiveness: "effective",
    childFeedback: "Much better now",
  },
  {
    id: "ea-04",
    childId: "child-jordan",
    childName: "Jordan",
    spaceType: "living_room",
    adaptationType: "equipment_provision",
    description: "Fidget toy basket available in communal area",
    implementedDate: "2025-12-10",
    reviewDate: "2026-06-10",
    status: "active",
    effectiveness: "partially_effective",
    childFeedback: "I like the fidget spinner but the others are boring",
  },
  {
    id: "ea-05",
    childId: "child-morgan",
    childName: "Morgan",
    spaceType: "bedroom",
    adaptationType: "lighting_adjustment",
    description: "Dimmable LED strip lights with colour options installed",
    implementedDate: "2025-10-25",
    reviewDate: "2026-04-25",
    status: "active",
    effectiveness: "effective",
    childFeedback: "Love the blue light setting",
  },
  {
    id: "ea-06",
    childId: "child-morgan",
    childName: "Morgan",
    spaceType: "study_space",
    adaptationType: "lighting_adjustment",
    description: "Blue-light filter fitted on study screen and adjustable desk lamp provided",
    implementedDate: "2025-10-30",
    reviewDate: "2026-04-30",
    status: "active",
    effectiveness: "effective",
    childFeedback: "No more headaches when doing homework",
  },
  {
    id: "ea-07",
    spaceType: "kitchen",
    adaptationType: "noise_reduction",
    description: "Plan to replace extractor fan with quieter model",
    implementedDate: "2026-01-15",
    reviewDate: "2026-07-15",
    status: "planned",
    effectiveness: "not_yet_assessed",
  },
  {
    id: "ea-08",
    spaceType: "living_room",
    adaptationType: "visual_timetable",
    description: "Daily visual timetable displayed in living room for all children",
    implementedDate: "2025-09-01",
    reviewDate: "2026-03-01",
    status: "active",
    effectiveness: "effective",
  },
  {
    id: "ea-09",
    childId: "child-alex",
    childName: "Alex",
    spaceType: "sensory_room",
    adaptationType: "equipment_provision",
    description: "Weighted lap pad for sensory room use",
    implementedDate: "2025-12-15",
    reviewDate: "2026-06-15",
    status: "active",
    effectiveness: "effective",
    childFeedback: "I take it in when I need to calm down",
  },
  {
    id: "ea-10",
    childId: "child-morgan",
    childName: "Morgan",
    spaceType: "bathroom",
    adaptationType: "lighting_adjustment",
    description: "Motion-activated gentle night light for bathroom visits",
    implementedDate: "2025-11-10",
    reviewDate: "2026-02-10",
    status: "needs_review",
    effectiveness: "partially_effective",
    childFeedback: "It helps but sometimes the motion sensor is too sensitive",
  },
];

const DEMO_USAGE: TherapeuticSpaceUsage[] = [
  { id: "tu-01", spaceType: "sensory_room", date: "2026-01-03", childId: "child-alex", childName: "Alex", durationMinutes: 30, purpose: "Calming after school", staffSupported: true, childResponse: "positive" },
  { id: "tu-02", spaceType: "quiet_room", date: "2026-01-05", childId: "child-alex", childName: "Alex", durationMinutes: 20, purpose: "Self-regulation", staffSupported: false, childResponse: "positive" },
  { id: "tu-03", spaceType: "sensory_room", date: "2026-01-10", childId: "child-alex", childName: "Alex", durationMinutes: 45, purpose: "Anxiety management", staffSupported: true, childResponse: "positive" },
  { id: "tu-04", spaceType: "quiet_room", date: "2026-01-14", childId: "child-alex", childName: "Alex", durationMinutes: 15, purpose: "Break from group activity", staffSupported: false, childResponse: "positive" },
  { id: "tu-05", spaceType: "sensory_room", date: "2026-01-18", childId: "child-alex", childName: "Alex", durationMinutes: 30, purpose: "Sensory diet session", staffSupported: true, childResponse: "positive" },
  { id: "tu-06", spaceType: "garden", date: "2026-01-20", childId: "child-alex", childName: "Alex", durationMinutes: 40, purpose: "Outdoor sensory path and trampoline", staffSupported: true, childResponse: "positive" },
  { id: "tu-07", spaceType: "sensory_room", date: "2026-01-25", childId: "child-alex", childName: "Alex", durationMinutes: 25, purpose: "Wind-down before bed", staffSupported: true, childResponse: "positive" },
  { id: "tu-08", spaceType: "quiet_room", date: "2026-01-28", childId: "child-alex", childName: "Alex", durationMinutes: 20, purpose: "Self-regulation after conflict", staffSupported: true, childResponse: "neutral" },
  { id: "tu-09", spaceType: "sensory_room", date: "2026-01-04", childId: "child-jordan", childName: "Jordan", durationMinutes: 20, purpose: "Tactile exploration", staffSupported: true, childResponse: "positive" },
  { id: "tu-10", spaceType: "activity_room", date: "2026-01-08", childId: "child-jordan", childName: "Jordan", durationMinutes: 35, purpose: "Proprioceptive play", staffSupported: true, childResponse: "positive" },
  { id: "tu-11", spaceType: "sensory_room", date: "2026-01-12", childId: "child-jordan", childName: "Jordan", durationMinutes: 25, purpose: "Calming session", staffSupported: false, childResponse: "neutral" },
  { id: "tu-12", spaceType: "garden", date: "2026-01-16", childId: "child-jordan", childName: "Jordan", durationMinutes: 30, purpose: "Outdoor play", staffSupported: true, childResponse: "positive" },
  { id: "tu-13", spaceType: "sensory_room", date: "2026-01-22", childId: "child-jordan", childName: "Jordan", durationMinutes: 20, purpose: "Pre-bedtime calming", staffSupported: true, childResponse: "positive" },
  { id: "tu-14", spaceType: "activity_room", date: "2026-01-27", childId: "child-jordan", childName: "Jordan", durationMinutes: 40, purpose: "Movement and gross motor activity", staffSupported: true, childResponse: "positive" },
  { id: "tu-15", spaceType: "quiet_room", date: "2026-01-02", childId: "child-morgan", childName: "Morgan", durationMinutes: 25, purpose: "Reading in gentle lighting", staffSupported: false, childResponse: "positive" },
  { id: "tu-16", spaceType: "sensory_room", date: "2026-01-07", childId: "child-morgan", childName: "Morgan", durationMinutes: 30, purpose: "Light therapy session", staffSupported: true, childResponse: "positive" },
  { id: "tu-17", spaceType: "quiet_room", date: "2026-01-11", childId: "child-morgan", childName: "Morgan", durationMinutes: 15, purpose: "Headache recovery", staffSupported: false, childResponse: "neutral" },
  { id: "tu-18", spaceType: "sensory_room", date: "2026-01-15", childId: "child-morgan", childName: "Morgan", durationMinutes: 35, purpose: "Fibre optic and bubble tube relaxation", staffSupported: true, childResponse: "positive" },
  { id: "tu-19", spaceType: "garden", date: "2026-01-19", childId: "child-morgan", childName: "Morgan", durationMinutes: 45, purpose: "Natural light exposure and outdoor activity", staffSupported: true, childResponse: "positive" },
  { id: "tu-20", spaceType: "sensory_room", date: "2026-01-24", childId: "child-morgan", childName: "Morgan", durationMinutes: 20, purpose: "Evening wind-down", staffSupported: true, childResponse: "positive" },
  { id: "tu-21", spaceType: "quiet_room", date: "2026-01-30", childId: "child-morgan", childName: "Morgan", durationMinutes: 20, purpose: "Self-regulation", staffSupported: false, childResponse: "positive" },
];

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const periodStart = "2026-01-01";
  const periodEnd = "2026-01-31";
  const referenceDate = new Date().toISOString().slice(0, 10);

  const result = generateSensoryEnvironmentIntelligence(
    DEMO_PROFILES,
    DEMO_ASSESSMENTS,
    DEMO_ADAPTATIONS,
    DEMO_USAGE,
    CHILD_IDS,
    CHILD_NAMES,
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
      profiles,
      assessments,
      adaptations,
      usage,
      childIds,
      childNames,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    // Validation
    if (!Array.isArray(profiles)) {
      return NextResponse.json({ error: "profiles must be an array" }, { status: 400 });
    }
    if (!Array.isArray(assessments)) {
      return NextResponse.json({ error: "assessments must be an array" }, { status: 400 });
    }
    if (!Array.isArray(adaptations)) {
      return NextResponse.json({ error: "adaptations must be an array" }, { status: 400 });
    }
    if (!Array.isArray(usage)) {
      return NextResponse.json({ error: "usage must be an array" }, { status: 400 });
    }
    if (!Array.isArray(childIds) || childIds.length === 0) {
      return NextResponse.json({ error: "childIds must be a non-empty array" }, { status: 400 });
    }
    if (!Array.isArray(childNames) || childNames.length !== childIds.length) {
      return NextResponse.json({ error: "childNames must be an array matching childIds length" }, { status: 400 });
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

    const result = generateSensoryEnvironmentIntelligence(
      profiles as ChildSensoryProfile[],
      assessments as SpaceAssessment[],
      adaptations as EnvironmentalAdaptation[],
      usage as TherapeuticSpaceUsage[],
      childIds as string[],
      childNames as string[],
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
