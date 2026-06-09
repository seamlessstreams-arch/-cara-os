// ══════════════════════════════════════════════════════════════════════════════
// Home Atmosphere & Ethos Intelligence API Route
//
// GET  — Returns Chamberlain House demo data intelligence
// POST — Accepts custom data with validation
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateHomeAtmosphereEthosIntelligence,
} from "@/lib/home-atmosphere-ethos";
import type {
  AtmosphereObservation,
  ChildAtmosphereFeedback,
  EnvironmentAudit,
  StaffCultureRecord,
} from "@/lib/home-atmosphere-ethos";

// ── Demo Data — Atmosphere Observations ─────────────────────────────────────

const DEMO_OBSERVATIONS: AtmosphereObservation[] = [
  { id: "obs-01", observerRole: "reg44_visitor", observationDate: "2026-01-05", indicator: "warmth", rating: "excellent", area: "communal_lounge", narrative: "Children relaxed and chatting with staff in the lounge.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-02", observerRole: "reg44_visitor", observationDate: "2026-01-05", indicator: "homeliness", rating: "good", area: "kitchen_dining", narrative: "Kitchen felt welcoming, children's artwork displayed.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-03", observerRole: "reg44_visitor", observationDate: "2026-01-05", indicator: "calm", rating: "excellent", area: "communal_lounge", narrative: "Quiet, calm atmosphere with low background music.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-04", observerRole: "social_worker", observationDate: "2026-01-10", indicator: "safety", rating: "good", area: "entrance_hallway", narrative: "Secure entry, children aware of procedures.", childrenPresent: false, timeOfDay: "morning" },
  { id: "obs-05", observerRole: "social_worker", observationDate: "2026-01-10", indicator: "respect", rating: "excellent", area: "communal_lounge", narrative: "Staff addressed children by name, tone consistently warm.", childrenPresent: true, timeOfDay: "morning" },
  { id: "obs-06", observerRole: "manager", observationDate: "2026-01-12", indicator: "fun", rating: "good", area: "garden_outdoor", narrative: "Children playing football with staff after school.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-07", observerRole: "manager", observationDate: "2026-01-12", indicator: "inclusion", rating: "excellent", area: "kitchen_dining", narrative: "All children participated in meal prep regardless of ability.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-08", observerRole: "independent_visitor", observationDate: "2026-01-15", indicator: "privacy", rating: "good", area: "bedrooms", narrative: "Children have locks on bedroom doors, knock-before-entering policy observed.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-09", observerRole: "child", observationDate: "2026-01-18", indicator: "predictability", rating: "good", area: null, narrative: "Routines feel consistent and I know what to expect.", childrenPresent: true, timeOfDay: "morning" },
  { id: "obs-10", observerRole: "staff", observationDate: "2026-01-20", indicator: "nurture", rating: "excellent", area: "communal_lounge", narrative: "Staff read bedtime stories to younger children.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-11", observerRole: "manager", observationDate: "2026-01-22", indicator: "warmth", rating: "good", area: "kitchen_dining", narrative: "Staff and children baking together.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-12", observerRole: "ofsted_inspector", observationDate: "2026-01-25", indicator: "respect", rating: "good", area: "communal_lounge", narrative: "Mutual respect evident between children and staff.", childrenPresent: true, timeOfDay: "morning" },
  { id: "obs-13", observerRole: "reg44_visitor", observationDate: "2026-01-28", indicator: "nurture", rating: "good", area: "bedrooms", narrative: "Staff supported a child with bedtime routine patiently.", childrenPresent: true, timeOfDay: "night" },
  { id: "obs-14", observerRole: "staff", observationDate: "2026-01-30", indicator: "calm", rating: "good", area: "study_quiet_area", narrative: "Quiet study hour was peaceful and productive.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-15", observerRole: "manager", observationDate: "2026-01-15", indicator: "fun", rating: "excellent", area: "sensory_room", narrative: "Children laughing during sensory play session.", childrenPresent: true, timeOfDay: "afternoon" },
];

// ── Demo Data — Child Feedback from Alex, Jordan, Morgan ────────────────────

const DEMO_FEEDBACK: ChildAtmosphereFeedback[] = [
  { id: "fb-01", childId: "child-alex", childName: "Alex", date: "2026-01-08", overallSentiment: "very_positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
  { id: "fb-02", childId: "child-alex", childName: "Alex", date: "2026-01-22", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: "More games nights" },
  { id: "fb-03", childId: "child-jordan", childName: "Jordan", date: "2026-01-08", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
  { id: "fb-04", childId: "child-jordan", childName: "Jordan", date: "2026-01-22", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: false, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: "Sometimes I don't feel heard in house meetings" },
  { id: "fb-05", childId: "child-morgan", childName: "Morgan", date: "2026-01-08", overallSentiment: "neutral", feelsAtHome: false, feelsListenedTo: true, feelsSafe: true, hasPrivacy: false, enjoysLivingHere: false, canBeThemselves: true, suggestionsForImprovement: "I need more time alone" },
  { id: "fb-06", childId: "child-morgan", childName: "Morgan", date: "2026-01-22", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
];

// ── Demo Data — Environment Audits ──────────────────────────────────────────

const DEMO_AUDITS: EnvironmentAudit[] = [
  { id: "ea-01", auditDate: "2026-01-05", auditor: "Sarah Johnson", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-02", auditDate: "2026-01-05", auditor: "Sarah Johnson", area: "kitchen_dining", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: true, repairsActioned: true },
  { id: "ea-03", auditDate: "2026-01-05", auditor: "Tom Richards", area: "bedrooms", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-04", auditDate: "2026-01-05", auditor: "Tom Richards", area: "garden_outdoor", clean: true, personalised: false, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: false, repairsNeeded: true, repairsActioned: false },
  { id: "ea-05", auditDate: "2026-01-05", auditor: "Lisa Williams", area: "bathrooms", clean: true, personalised: false, welcoming: false, ageAppropriate: true, sensoryConsidered: false, childContributed: false, repairsNeeded: true, repairsActioned: true },
  { id: "ea-06", auditDate: "2026-01-05", auditor: "Lisa Williams", area: "entrance_hallway", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: false, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-07", auditDate: "2026-01-05", auditor: "Sarah Johnson", area: "study_quiet_area", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-08", auditDate: "2026-01-05", auditor: "Tom Richards", area: "sensory_room", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
];

// ── Demo Data — Staff Culture Records for Sarah, Tom, Lisa ──────────────────

const DEMO_STAFF: StaffCultureRecord[] = [
  { id: "sc-01", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-05", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-02", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-15", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-03", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-25", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-04", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-05", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-05", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-15", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: false },
  { id: "sc-06", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-25", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-07", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-05", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-08", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-15", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: false, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-09", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-25", therapeuticApproachUsed: false, childCentredLanguage: true, warmInteractionObserved: false, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
];

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const periodStart = "2026-01-01";
  const periodEnd = "2026-01-31";

  const result = generateHomeAtmosphereEthosIntelligence(
    DEMO_OBSERVATIONS,
    DEMO_FEEDBACK,
    DEMO_AUDITS,
    DEMO_STAFF,
    "oak-house",
    periodStart,
    periodEnd,
  );

  return NextResponse.json(result);
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      observations,
      feedback,
      audits,
      staffRecords,
      homeId,
      periodStart,
      periodEnd,
    } = body;

    // Validation
    if (typeof periodStart !== "string" || !periodStart) {
      return NextResponse.json({ error: "periodStart is required" }, { status: 400 });
    }
    if (typeof periodEnd !== "string" || !periodEnd) {
      return NextResponse.json({ error: "periodEnd is required" }, { status: 400 });
    }
    if (!Array.isArray(observations)) {
      return NextResponse.json({ error: "observations must be an array" }, { status: 400 });
    }
    if (!Array.isArray(feedback)) {
      return NextResponse.json({ error: "feedback must be an array" }, { status: 400 });
    }
    if (!Array.isArray(audits)) {
      return NextResponse.json({ error: "audits must be an array" }, { status: 400 });
    }
    if (!Array.isArray(staffRecords)) {
      return NextResponse.json({ error: "staffRecords must be an array" }, { status: 400 });
    }
    if (typeof homeId !== "string" || !homeId) {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }

    const result = generateHomeAtmosphereEthosIntelligence(
      observations as AtmosphereObservation[],
      feedback as ChildAtmosphereFeedback[],
      audits as EnvironmentAudit[],
      staffRecords as StaffCultureRecord[],
      homeId,
      periodStart,
      periodEnd,
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 },
    );
  }
}
