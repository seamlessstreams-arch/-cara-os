// ==============================================================================
// API: /api/outdoor-activity-enrichment
//
// Outdoor Activity & Enrichment Intelligence
//
// GET  — Returns outdoor activity enrichment assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateOutdoorActivityEnrichmentIntelligence,
  getActivityCategoryLabel,
  getRiskBenefitOutcomeLabel,
  getChildEngagementLabel,
  getActivityFrequencyLabel,
  getWeatherConditionLabel,
} from "@/lib/outdoor-activity-enrichment";
import type {
  ActivityRecord,
  EnrichmentPlan,
  RiskBenefitAssessment,
  StaffActivityTraining,
} from "@/lib/outdoor-activity-enrichment";

// -- Demo Data: Chamberlain House -------------------------------------------------------

// Alex (14) — adventure-loving, high participation, enthusiastic
// Jordan (13) — more reluctant, some refusals, limited engagement
// Morgan (15) — creative/cultural focus, willing and engaged

const DEMO_ACTIVITIES: ActivityRecord[] = [
  // Alex — high participation, adventure-focused
  { id: "act-a1", childId: "child-alex", childName: "Alex", category: "outdoor_adventure", date: "2026-01-20", description: "Forest trail hike with map reading", duration: 180, location: "Delamere Forest", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "excellent", childEngagement: "enthusiastic", outdoors: true, communityBased: true, newExperience: true, peersInvolved: true },
  { id: "act-a2", childId: "child-alex", childName: "Alex", category: "sports", date: "2026-02-05", description: "Climbing wall session at local centre", duration: 90, location: "Oakwood Climbing Centre", staffLed: false, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: false, communityBased: true, newExperience: false, peersInvolved: true },
  { id: "act-a3", childId: "child-alex", childName: "Alex", category: "outdoor_adventure", date: "2026-02-15", description: "Kayaking on the canal", duration: 120, location: "Bridgewater Canal", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "excellent", childEngagement: "enthusiastic", outdoors: true, communityBased: true, newExperience: true, peersInvolved: true },
  { id: "act-a4", childId: "child-alex", childName: "Alex", category: "nature_environment", date: "2026-03-10", description: "Bird watching and nature journaling", duration: 90, location: "Mere Sands Wood", staffLed: true, childChose: false, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "willing", outdoors: true, communityBased: true, newExperience: true, peersInvolved: false },
  { id: "act-a5", childId: "child-alex", childName: "Alex", category: "sports", date: "2026-03-22", description: "Saturday football league match", duration: 90, location: "Community Playing Fields", staffLed: false, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: true, communityBased: true, newExperience: false, peersInvolved: true },
  { id: "act-a6", childId: "child-alex", childName: "Alex", category: "life_skill_practice", date: "2026-04-05", description: "Cooking a meal for the house", duration: 60, location: "Chamberlain House Kitchen", staffLed: true, childChose: true, riskBenefitAssessed: false, riskBenefitOutcome: null, childEngagement: "willing", outdoors: false, communityBased: false, newExperience: false, peersInvolved: true },
  { id: "act-a7", childId: "child-alex", childName: "Alex", category: "educational_trip", date: "2026-04-18", description: "Science museum trip", duration: 240, location: "Museum of Science & Industry", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: false, communityBased: true, newExperience: true, peersInvolved: true },

  // Jordan — more reluctant, some refusals
  { id: "act-j1", childId: "child-jordan", childName: "Jordan", category: "sports", date: "2026-01-25", description: "Swimming at the leisure centre", duration: 60, location: "Oakwood Leisure Centre", staffLed: true, childChose: false, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "reluctant", outdoors: false, communityBased: true, newExperience: false, peersInvolved: false },
  { id: "act-j2", childId: "child-jordan", childName: "Jordan", category: "social_event", date: "2026-02-14", description: "Youth club games night", duration: 120, location: "Community Youth Centre", staffLed: false, childChose: false, riskBenefitAssessed: false, riskBenefitOutcome: null, childEngagement: "willing", outdoors: false, communityBased: true, newExperience: false, peersInvolved: true },
  { id: "act-j3", childId: "child-jordan", childName: "Jordan", category: "outdoor_adventure", date: "2026-03-01", description: "Nature walk in the park", duration: 45, location: "Town Park", staffLed: true, childChose: false, riskBenefitAssessed: true, riskBenefitOutcome: "adequate", childEngagement: "reluctant", outdoors: true, communityBased: true, newExperience: false, peersInvolved: false },
  { id: "act-j4", childId: "child-jordan", childName: "Jordan", category: "creative_arts", date: "2026-03-20", description: "Pottery workshop", duration: 90, location: "Community Arts Centre", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: false, communityBased: true, newExperience: true, peersInvolved: true },
  { id: "act-j5", childId: "child-jordan", childName: "Jordan", category: "sports", date: "2026-04-10", description: "Football in the garden", duration: 30, location: "Chamberlain House Garden", staffLed: false, childChose: false, riskBenefitAssessed: false, riskBenefitOutcome: null, childEngagement: "refused", outdoors: true, communityBased: false, newExperience: false, peersInvolved: true },

  // Morgan — creative/cultural focus
  { id: "act-m1", childId: "child-morgan", childName: "Morgan", category: "creative_arts", date: "2026-01-18", description: "Drama club rehearsal and performance", duration: 150, location: "Town Theatre", staffLed: false, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "excellent", childEngagement: "enthusiastic", outdoors: false, communityBased: true, newExperience: false, peersInvolved: true },
  { id: "act-m2", childId: "child-morgan", childName: "Morgan", category: "cultural_visit", date: "2026-02-08", description: "Art gallery visit and sketch workshop", duration: 180, location: "Tate Liverpool", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: false, communityBased: true, newExperience: true, peersInvolved: true },
  { id: "act-m3", childId: "child-morgan", childName: "Morgan", category: "community_service", date: "2026-02-22", description: "Volunteering at the food bank", duration: 120, location: "Town Food Bank", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "willing", outdoors: false, communityBased: true, newExperience: true, peersInvolved: false },
  { id: "act-m4", childId: "child-morgan", childName: "Morgan", category: "therapeutic_activity", date: "2026-03-12", description: "Art therapy session", duration: 60, location: "Chamberlain House Therapy Room", staffLed: true, childChose: false, riskBenefitAssessed: false, riskBenefitOutcome: null, childEngagement: "willing", outdoors: false, communityBased: false, newExperience: false, peersInvolved: false },
  { id: "act-m5", childId: "child-morgan", childName: "Morgan", category: "nature_environment", date: "2026-04-05", description: "Community garden planting day", duration: 90, location: "Oakwood Community Garden", staffLed: false, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: true, communityBased: true, newExperience: true, peersInvolved: true },
  { id: "act-m6", childId: "child-morgan", childName: "Morgan", category: "creative_arts", date: "2026-04-20", description: "Photography walk along the canal", duration: 120, location: "Canal Towpath", staffLed: true, childChose: true, riskBenefitAssessed: true, riskBenefitOutcome: "good", childEngagement: "enthusiastic", outdoors: true, communityBased: true, newExperience: false, peersInvolved: true },
];

const DEMO_PLANS: EnrichmentPlan[] = [
  { id: "plan-a1", childId: "child-alex", childName: "Alex", planDate: "2026-01-10", reviewDate: "2026-04-10", interestsIdentified: ["hiking", "climbing", "kayaking", "football"], activitiesPlanned: 10, activitiesCompleted: 7, childContributed: true, diverseRange: true, barrierIdentified: null, barrierAddressed: null },
  { id: "plan-j1", childId: "child-jordan", childName: "Jordan", planDate: "2026-01-10", reviewDate: "2026-04-10", interestsIdentified: ["gaming", "pottery", "art"], activitiesPlanned: 8, activitiesCompleted: 4, childContributed: true, diverseRange: false, barrierIdentified: "Anxiety about new settings", barrierAddressed: true },
  { id: "plan-m1", childId: "child-morgan", childName: "Morgan", planDate: "2026-01-10", reviewDate: "2026-04-10", interestsIdentified: ["drama", "art", "photography", "gardening", "volunteering"], activitiesPlanned: 10, activitiesCompleted: 6, childContributed: true, diverseRange: true, barrierIdentified: "Transport to evening events", barrierAddressed: false },
];

const DEMO_RISK_ASSESSMENTS: RiskBenefitAssessment[] = [
  { id: "ra-a1", activityId: "act-a1", assessedBy: "Sarah Johnson", assessDate: "2026-01-19", hazardsIdentified: 4, controlMeasures: 6, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "excellent" },
  { id: "ra-a2", activityId: "act-a2", assessedBy: "Tom Richards", assessDate: "2026-02-04", hazardsIdentified: 3, controlMeasures: 4, benefitsArticulated: true, childViewSought: true, dynamicAssessment: false, outcome: "good" },
  { id: "ra-a3", activityId: "act-a3", assessedBy: "Sarah Johnson", assessDate: "2026-02-14", hazardsIdentified: 5, controlMeasures: 7, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "excellent" },
  { id: "ra-a4", activityId: "act-a4", assessedBy: "Lisa Williams", assessDate: "2026-03-09", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: true, childViewSought: false, dynamicAssessment: true, outcome: "good" },
  { id: "ra-a5", activityId: "act-a5", assessedBy: "Tom Richards", assessDate: "2026-03-21", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: false, childViewSought: false, dynamicAssessment: false, outcome: "good" },
  { id: "ra-a7", activityId: "act-a7", assessedBy: "Sarah Johnson", assessDate: "2026-04-17", hazardsIdentified: 3, controlMeasures: 5, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "good" },
  { id: "ra-j1", activityId: "act-j1", assessedBy: "Tom Richards", assessDate: "2026-01-24", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: true, childViewSought: false, dynamicAssessment: false, outcome: "good" },
  { id: "ra-j3", activityId: "act-j3", assessedBy: "Lisa Williams", assessDate: "2026-02-28", hazardsIdentified: 1, controlMeasures: 2, benefitsArticulated: false, childViewSought: false, dynamicAssessment: false, outcome: "adequate" },
  { id: "ra-j4", activityId: "act-j4", assessedBy: "Tom Richards", assessDate: "2026-03-19", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: true, childViewSought: true, dynamicAssessment: false, outcome: "good" },
  { id: "ra-m1", activityId: "act-m1", assessedBy: "Lisa Williams", assessDate: "2026-01-17", hazardsIdentified: 2, controlMeasures: 4, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "excellent" },
  { id: "ra-m2", activityId: "act-m2", assessedBy: "Sarah Johnson", assessDate: "2026-02-07", hazardsIdentified: 3, controlMeasures: 5, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "good" },
  { id: "ra-m3", activityId: "act-m3", assessedBy: "Lisa Williams", assessDate: "2026-02-21", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: true, childViewSought: false, dynamicAssessment: false, outcome: "good" },
  { id: "ra-m5", activityId: "act-m5", assessedBy: "Tom Richards", assessDate: "2026-04-04", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "good" },
  { id: "ra-m6", activityId: "act-m6", assessedBy: "Sarah Johnson", assessDate: "2026-04-19", hazardsIdentified: 2, controlMeasures: 3, benefitsArticulated: true, childViewSought: true, dynamicAssessment: true, outcome: "good" },
];

const DEMO_STAFF: StaffActivityTraining[] = [
  { id: "st-1", staffId: "s-sarah", staffName: "Sarah Johnson", firstAidCurrent: true, outdoorQualifications: ["Mountain Leader", "Forest School L3"], activityLeaderTrained: true, riskAssessmentTrained: true, safeguardingCurrent: true },
  { id: "st-2", staffId: "s-tom", staffName: "Tom Richards", firstAidCurrent: true, outdoorQualifications: ["Climbing Wall Instructor"], activityLeaderTrained: true, riskAssessmentTrained: false, safeguardingCurrent: true },
  { id: "st-3", staffId: "s-lisa", staffName: "Lisa Williams", firstAidCurrent: false, outdoorQualifications: [], activityLeaderTrained: false, riskAssessmentTrained: true, safeguardingCurrent: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateOutdoorActivityEnrichmentIntelligence(
    DEMO_ACTIVITIES,
    DEMO_PLANS,
    DEMO_RISK_ASSESSMENTS,
    DEMO_STAFF,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        activityCategoryLabels: Object.fromEntries(
          (["outdoor_adventure", "sports", "creative_arts", "cultural_visit", "nature_environment", "community_service", "educational_trip", "social_event", "therapeutic_activity", "life_skill_practice"] as const).map(
            (c) => [c, getActivityCategoryLabel(c)],
          ),
        ),
        riskBenefitOutcomeLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor"] as const).map(
            (o) => [o, getRiskBenefitOutcomeLabel(o)],
          ),
        ),
        childEngagementLabels: Object.fromEntries(
          (["enthusiastic", "willing", "reluctant", "refused", "not_offered"] as const).map(
            (e) => [e, getChildEngagementLabel(e)],
          ),
        ),
        activityFrequencyLabels: Object.fromEntries(
          (["daily", "weekly", "fortnightly", "monthly", "termly", "one_off"] as const).map(
            (f) => [f, getActivityFrequencyLabel(f)],
          ),
        ),
        weatherConditionLabels: Object.fromEntries(
          (["good", "mixed", "poor", "extreme"] as const).map(
            (w) => [w, getWeatherConditionLabel(w)],
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

  const { activities, plans, riskAssessments, staff, homeId, periodStart, periodEnd } = body as {
    activities?: ActivityRecord[];
    plans?: EnrichmentPlan[];
    riskAssessments?: RiskBenefitAssessment[];
    staff?: StaffActivityTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateOutdoorActivityEnrichmentIntelligence(
    activities ?? [],
    plans ?? [],
    riskAssessments ?? [],
    staff ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
