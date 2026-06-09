// ══════════════════════════════════════════════════════════════════════════════
// API: /api/outcomes-measurement — Outcomes Measurement Intelligence
//
// GET  → returns Chamberlain House demo intelligence
// POST → accepts custom data for any home
//
// "Is Chamberlain House making a measurable positive difference for children?"
//
// SCCIF — Overall effectiveness: children making progress from starting points
// CHR 2015 Reg 6  — Quality of care standard
// CHR 2015 Reg 9  — Individualised care
// CHR 2015 Reg 14 — Care planning standard
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateOutcomesMeasurementIntelligence,
} from "@/lib/outcomes-measurement/outcomes-measurement-engine";
import type {
  OutcomeBaseline,
  OutcomeMeasurement,
  OutcomeTarget,
  ChildOutcomePlan,
  OutcomeDomain,
} from "@/lib/outcomes-measurement/outcomes-measurement-engine";

// ── GET: Demo Data ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";

    const { baselines, measurements, targets, plans, childIds } = getDemoData(homeId);

    const result = generateOutcomesMeasurementIntelligence(
      baselines,
      measurements,
      targets,
      plans,
      childIds,
      homeId,
      "2025-01-01",
      "2026-06-30",
      new Date().toISOString().slice(0, 10),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── POST: Custom Data ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      baselines,
      measurements,
      targets,
      plans,
      childIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    if (!baselines || !measurements || !childIds || !homeId) {
      return NextResponse.json(
        { error: "Required: baselines, measurements, childIds, homeId" },
        { status: 400 },
      );
    }

    const result = generateOutcomesMeasurementIntelligence(
      baselines ?? [],
      measurements ?? [],
      targets ?? [],
      plans ?? [],
      childIds,
      homeId,
      periodStart ?? "2025-01-01",
      periodEnd ?? "2026-06-30",
      referenceDate ?? new Date().toISOString().slice(0, 10),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function getDemoData(homeId: string): {
  baselines: OutcomeBaseline[];
  measurements: OutcomeMeasurement[];
  targets: OutcomeTarget[];
  plans: ChildOutcomePlan[];
  childIds: string[];
} {
  const childIds = ["child-alex", "child-jordan", "child-morgan"];

  const baselines: OutcomeBaseline[] = [
    // Alex — baseline at admission
    { id: "bl-a1", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "education", baselineDate: "2025-06-15", baselineScore: 3, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Excluded from mainstream, minimal engagement" },
    { id: "bl-a2", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", baselineDate: "2025-06-15", baselineScore: 2, method: "standardised_tool", assessedBy: "CAMHS", context: "SDQ score 28, significant difficulties" },
    { id: "bl-a3", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", baselineDate: "2025-06-15", baselineScore: 5, method: "observation", assessedBy: "Tom Richards", context: "Generally compliant, occasional verbal aggression" },
    { id: "bl-a4", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "relationships", baselineDate: "2025-06-15", baselineScore: 3, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Struggles with trust" },
    { id: "bl-a5", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "safety", baselineDate: "2025-06-15", baselineScore: 4, method: "professional_assessment", assessedBy: "Tom Richards", context: "Exploitation risk, missing episodes" },
    { id: "bl-a6", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "health", baselineDate: "2025-06-15", baselineScore: 5, method: "professional_assessment", assessedBy: "GP", context: "Registered, dental overdue" },
    { id: "bl-a7", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "identity", baselineDate: "2025-06-15", baselineScore: 4, method: "self_report", assessedBy: "Alex", context: "Exploring identity" },

    // Jordan — baseline at admission (longer placement)
    { id: "bl-j1", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "education", baselineDate: "2024-09-01", baselineScore: 4, method: "professional_assessment", assessedBy: "Virtual School Head", context: "Below expected, poor attendance" },
    { id: "bl-j2", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", baselineDate: "2024-09-01", baselineScore: 4, method: "standardised_tool", assessedBy: "CAMHS", context: "SDQ score 22" },
    { id: "bl-j3", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", baselineDate: "2024-09-01", baselineScore: 5, method: "observation", assessedBy: "Lisa Park", context: "Some impulsivity" },
    { id: "bl-j4", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "relationships", baselineDate: "2024-09-01", baselineScore: 4, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Cautious with adults" },
    { id: "bl-j5", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", baselineDate: "2024-09-01", baselineScore: 3, method: "milestone_tracking", assessedBy: "Lisa Park", context: "Limited life skills" },
    { id: "bl-j6", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "health", baselineDate: "2024-09-01", baselineScore: 5, method: "professional_assessment", assessedBy: "GP", context: "Generally healthy, overweight" },
    { id: "bl-j7", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "safety", baselineDate: "2024-09-01", baselineScore: 6, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Low risk profile" },
    { id: "bl-j8", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "identity", baselineDate: "2024-09-01", baselineScore: 5, method: "self_report", assessedBy: "Jordan", context: "Positive sense of self" },

    // Morgan — baseline mid-period
    { id: "bl-m1", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "education", baselineDate: "2025-03-01", baselineScore: 5, method: "professional_assessment", assessedBy: "Virtual School Head", context: "Alternative provision, average engagement" },
    { id: "bl-m2", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "emotional_wellbeing", baselineDate: "2025-03-01", baselineScore: 4, method: "standardised_tool", assessedBy: "CAMHS", context: "SDQ score 20" },
    { id: "bl-m3", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "behaviour", baselineDate: "2025-03-01", baselineScore: 6, method: "observation", assessedBy: "Tom Richards", context: "Mostly positive" },
    { id: "bl-m4", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", baselineDate: "2025-03-01", baselineScore: 4, method: "milestone_tracking", assessedBy: "Lisa Park", context: "Some cooking skills, needs budgeting support" },
    { id: "bl-m5", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "relationships", baselineDate: "2025-03-01", baselineScore: 5, method: "professional_assessment", assessedBy: "Sarah Mitchell", context: "Good peers, guarded with adults" },
    { id: "bl-m6", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "health", baselineDate: "2025-03-01", baselineScore: 6, method: "professional_assessment", assessedBy: "GP", context: "Good physical health" },
  ];

  const measurements: OutcomeMeasurement[] = [
    // Alex — education improving (3→6), emotional wellbeing improving (2→5), behaviour regression (5→3)
    { id: "m-a1", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "education", measurementDate: "2025-10-01", score: 4, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 3, targetScore: 7, childView: "School is alright now", evidenceBase: ["PEP review", "Attendance 75%"] },
    { id: "m-a2", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "education", measurementDate: "2026-03-15", score: 6, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 4, targetScore: 7, childView: "I like my new teacher", evidenceBase: ["PEP review", "Attendance 88%"] },
    { id: "m-a3", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", measurementDate: "2025-10-01", score: 3, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 2, childView: "I feel a bit better", evidenceBase: ["SDQ score 24"] },
    { id: "m-a4", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", measurementDate: "2026-03-15", score: 5, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 3, targetScore: 6, childView: "I can talk to Tom about stuff now", evidenceBase: ["SDQ score 18"] },
    { id: "m-a5", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", measurementDate: "2025-10-01", score: 4, method: "observation", assessedBy: "Tom Richards", previousScore: 5, evidenceBase: ["3 physical incidents"] },
    { id: "m-a6", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", measurementDate: "2026-03-15", score: 3, method: "observation", assessedBy: "Tom Richards", previousScore: 4, childView: "Everyone winds me up", evidenceBase: ["5 physical incidents", "2 police callouts"] },
    { id: "m-a7", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "relationships", measurementDate: "2026-03-15", score: 5, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 3, childView: "Tom is alright, he gets me", evidenceBase: ["Improved engagement"] },
    { id: "m-a8", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "safety", measurementDate: "2026-03-15", score: 5, method: "professional_assessment", assessedBy: "Tom Richards", previousScore: 4, evidenceBase: ["Reduced missing episodes"] },
    { id: "m-a9", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "health", measurementDate: "2026-03-15", score: 6, method: "professional_assessment", assessedBy: "GP", previousScore: 5, evidenceBase: ["Dental complete"] },
    { id: "m-a10", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "identity", measurementDate: "2026-03-15", score: 5, method: "self_report", assessedBy: "Alex", previousScore: 4, childView: "I know who I am more now", evidenceBase: ["Life story work started"] },

    // Jordan — good progress across all
    { id: "m-j1", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "education", measurementDate: "2025-03-01", score: 5, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 4, childView: "I want to do well", evidenceBase: ["Attendance 90%"] },
    { id: "m-j2", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "education", measurementDate: "2025-09-01", score: 6, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 5, childView: "I got a merit!", evidenceBase: ["Attendance 94%"] },
    { id: "m-j3", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "education", measurementDate: "2026-03-01", score: 7, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 6, targetScore: 7, childView: "School is good", evidenceBase: ["Attendance 96%"] },
    { id: "m-j4", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", measurementDate: "2025-06-01", score: 5, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 4, childView: "I feel happier here", evidenceBase: ["SDQ score 16"] },
    { id: "m-j5", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", measurementDate: "2026-01-15", score: 7, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 5, targetScore: 7, childView: "I feel really good most days", evidenceBase: ["SDQ score 10"] },
    { id: "m-j6", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", measurementDate: "2025-06-01", score: 6, method: "observation", assessedBy: "Lisa Park", previousScore: 5, evidenceBase: ["No significant incidents"] },
    { id: "m-j7", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", measurementDate: "2026-01-15", score: 8, method: "observation", assessedBy: "Lisa Park", previousScore: 6, childView: "I handle things better now", evidenceBase: ["Zero incidents 6 months"] },
    { id: "m-j8", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "relationships", measurementDate: "2026-01-15", score: 7, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 4, childView: "I trust people here", evidenceBase: ["Strong keyworker bond"] },
    { id: "m-j9", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", measurementDate: "2025-06-01", score: 4, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 3, evidenceBase: ["Basic meals"] },
    { id: "m-j10", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", measurementDate: "2026-01-15", score: 6, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 4, targetScore: 6, childView: "I can cook and do laundry", evidenceBase: ["Independent meal prep", "Laundry skills"] },
    { id: "m-j11", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "health", measurementDate: "2026-01-15", score: 7, method: "professional_assessment", assessedBy: "GP", previousScore: 5, evidenceBase: ["BMI improved", "Active in football"] },
    { id: "m-j12", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "safety", measurementDate: "2026-01-15", score: 8, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 6, evidenceBase: ["Consistently safe"] },
    { id: "m-j13", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "identity", measurementDate: "2026-01-15", score: 7, method: "self_report", assessedBy: "Jordan", previousScore: 5, childView: "I feel proud of where I come from", evidenceBase: ["Life story work complete"] },

    // Morgan — some progress, limited
    { id: "m-m1", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "education", measurementDate: "2025-09-01", score: 6, method: "professional_assessment", assessedBy: "Virtual School Head", previousScore: 5, childView: "Alternative provision is okay", evidenceBase: ["Attendance 80%"] },
    { id: "m-m2", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "emotional_wellbeing", measurementDate: "2025-09-01", score: 5, method: "standardised_tool", assessedBy: "CAMHS", previousScore: 4, childView: "Good days and bad days", evidenceBase: ["SDQ score 17"] },
    { id: "m-m3", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "behaviour", measurementDate: "2025-09-01", score: 6, method: "observation", assessedBy: "Tom Richards", previousScore: 6, evidenceBase: ["Stable behaviour"] },
    { id: "m-m4", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", measurementDate: "2025-09-01", score: 4, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 4, evidenceBase: ["Some cooking improvement"] },
    { id: "m-m5", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", measurementDate: "2026-03-01", score: 5, method: "milestone_tracking", assessedBy: "Lisa Park", previousScore: 4, childView: "I want to do more for myself", evidenceBase: ["Cooking improving", "Budgeting course started"] },
    { id: "m-m6", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "relationships", measurementDate: "2026-03-01", score: 6, method: "professional_assessment", assessedBy: "Sarah Mitchell", previousScore: 5, childView: "Staff are alright here", evidenceBase: ["Improved trust"] },
    { id: "m-m7", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "health", measurementDate: "2026-03-01", score: 7, method: "professional_assessment", assessedBy: "GP", previousScore: 6, evidenceBase: ["Dental work done"] },
  ];

  const targets: OutcomeTarget[] = [
    // Alex
    { id: "tgt-a1", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "education", targetDescription: "Achieve consistent school attendance above 85%", targetScore: 7, targetDate: "2026-09-01", currentScore: 6, createdDate: "2025-06-15", status: "on_track", reviewDate: "2026-03-15" },
    { id: "tgt-a2", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "emotional_wellbeing", targetDescription: "Reduce SDQ score to normal range", targetScore: 6, targetDate: "2026-06-30", currentScore: 5, createdDate: "2025-06-15", status: "on_track", reviewDate: "2026-03-15" },
    { id: "tgt-a3", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "behaviour", targetDescription: "Reduce physical incidents to zero per month", targetScore: 7, targetDate: "2026-06-30", currentScore: 3, createdDate: "2025-06-15", status: "at_risk", reviewDate: "2026-03-15" },
    { id: "tgt-a4", homeId, childId: "child-alex", childName: "Alex Reeves", domain: "safety", targetDescription: "No missing episodes for 3 consecutive months", targetScore: 7, targetDate: "2026-09-01", currentScore: 5, createdDate: "2025-06-15", status: "on_track", reviewDate: "2026-03-15" },
    // Jordan
    { id: "tgt-j1", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "education", targetDescription: "Achieve expected grades", targetScore: 7, targetDate: "2026-07-31", currentScore: 7, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-03-01" },
    { id: "tgt-j2", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "emotional_wellbeing", targetDescription: "SDQ normal range, CAMHS discharge", targetScore: 7, targetDate: "2026-06-30", currentScore: 7, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-01-15" },
    { id: "tgt-j3", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "independence", targetDescription: "Age-appropriate independence milestones", targetScore: 6, targetDate: "2026-06-30", currentScore: 6, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-01-15" },
    { id: "tgt-j4", homeId, childId: "child-jordan", childName: "Jordan Williams", domain: "behaviour", targetDescription: "Sustained positive behaviour 6+ months", targetScore: 8, targetDate: "2026-06-30", currentScore: 8, createdDate: "2024-09-01", status: "achieved", reviewDate: "2026-01-15" },
    // Morgan
    { id: "tgt-m1", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "education", targetDescription: "Improve attendance to 90%+", targetScore: 7, targetDate: "2026-06-30", currentScore: 6, createdDate: "2025-03-01", status: "on_track", reviewDate: "2026-03-01" },
    { id: "tgt-m2", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "independence", targetDescription: "Complete 5 independence milestones", targetScore: 7, targetDate: "2026-06-30", currentScore: 5, createdDate: "2025-03-01", status: "at_risk", reviewDate: "2026-03-01" },
    { id: "tgt-m3", homeId, childId: "child-morgan", childName: "Morgan Taylor", domain: "emotional_wellbeing", targetDescription: "Consistent SDQ improvement", targetScore: 6, targetDate: "2026-09-01", currentScore: 5, createdDate: "2025-03-01", status: "on_track", reviewDate: "2026-03-01" },
  ];

  const plans: ChildOutcomePlan[] = [
    {
      id: "plan-a1", homeId, childId: "child-alex", childName: "Alex Reeves",
      planDate: "2025-06-20", reviewDate: "2026-03-15", nextReviewDate: "2026-06-15",
      primaryGoals: ["Sustained school engagement", "Emotional regulation improvement"],
      secondaryGoals: ["Reduce exploitation risk", "Build positive peer relationships"],
      childInvolved: true, familyInvolved: false, professionalInvolved: true,
      measurableIndicators: ["School attendance %", "SDQ score", "Incident count", "Missing episodes"],
    },
    {
      id: "plan-j1", homeId, childId: "child-jordan", childName: "Jordan Williams",
      planDate: "2024-09-15", reviewDate: "2026-01-15", nextReviewDate: "2026-07-15",
      primaryGoals: ["Academic achievement at expected level", "Emotional stability"],
      secondaryGoals: ["Independence skills", "Positive identity development"],
      childInvolved: true, familyInvolved: true, professionalInvolved: true,
      measurableIndicators: ["Exam results", "SDQ score", "Independence checklist", "Life story completion"],
    },
    {
      id: "plan-m1", homeId, childId: "child-morgan", childName: "Morgan Taylor",
      planDate: "2025-03-10", reviewDate: "2025-09-01", nextReviewDate: "2026-03-10",
      primaryGoals: ["Independence skill development", "Education engagement"],
      secondaryGoals: ["Emotional wellbeing improvement"],
      childInvolved: true, familyInvolved: false, professionalInvolved: true,
      measurableIndicators: ["Independence milestones achieved", "Attendance %", "SDQ score"],
    },
  ];

  return { baselines, measurements, targets, plans, childIds };
}
