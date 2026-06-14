// ══════════════════════════════════════════════════════════════════════════════
// Cara — GOLDEN THREAD ANALYSER
//
// The "Golden Thread" is the regulatory concept that a child's voice (wishes,
// feelings, views) should run through every aspect of their care:
//   Voice → Assessment → Care Plan → Daily Practice → Review → Outcome
//
// This service analyses whether a child's records demonstrate this thread:
//   - Is the child's voice captured across record types?
//   - Do care plans reference the child's expressed wishes?
//   - Does daily practice align with care plan objectives?
//   - Are reviews informed by the child's ongoing views?
//   - Can outcomes be traced back to the child's goals?
//
// CHR 2015 Reg 7 (Children's Wishes and Feelings)
// SCCIF: Experience & Progress / Overall Experiences
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface GoldenThreadInput {
  childId: string;
  childName: string;

  // Records across the system
  dailyLogs: ThreadRecord[];
  keyWorkSessions: ThreadRecord[];
  carePlanObjectives: CarePlanObjective[];
  reviewRecords: ThreadRecord[];
  incidentRecords: ThreadRecord[];

  // Child's expressed views
  childViews: ChildView[];

  // Metadata
  analysisWindowDays: number;
}

export interface ThreadRecord {
  id: string;
  date: string;
  content: string;
  hasChildVoice: boolean;
  linksToCarePlan: boolean;
  linkedObjectiveIds?: string[];
}

export interface CarePlanObjective {
  id: string;
  title: string;
  category: string;
  basedOnChildView: boolean;
  sourceViewId?: string;
  status: "active" | "achieved" | "under_review";
  evidenceCount: number;
}

export interface ChildView {
  id: string;
  date: string;
  content: string;
  category: string;
  capturedIn: string;
  linkedToCarePlan: boolean;
  linkedObjectiveId?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface GoldenThreadAnalysis {
  childId: string;
  childName: string;
  analysedAt: string;
  windowDays: number;
  overallScore: number;
  grade: "outstanding" | "good" | "requires_improvement" | "inadequate";
  dimensions: ThreadDimension[];
  threadConnections: ThreadConnection[];
  gaps: ThreadGap[];
  strengths: string[];
  recommendations: string[];
  stats: {
    totalRecords: number;
    recordsWithChildVoice: number;
    childVoicePercent: number;
    carePlanCoverage: number;
    viewsLinkedToPlans: number;
    uniqueViewsCaptured: number;
  };
}

export interface ThreadDimension {
  name: string;
  score: number;
  weight: number;
  description: string;
  evidence: string;
}

export interface ThreadConnection {
  fromType: string;
  fromId: string;
  fromSummary: string;
  toType: string;
  toId: string;
  toSummary: string;
  strength: "strong" | "moderate" | "weak";
}

export interface ThreadGap {
  type: "voice_missing" | "plan_unlinked" | "practice_drift" | "review_gap" | "outcome_disconnected";
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseGoldenThread(input: GoldenThreadInput): GoldenThreadAnalysis {
  const dimensions: ThreadDimension[] = [];
  const connections: ThreadConnection[] = [];
  const gaps: ThreadGap[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];

  const allRecords = [
    ...input.dailyLogs,
    ...input.keyWorkSessions,
    ...input.reviewRecords,
    ...input.incidentRecords,
  ];

  const totalRecords = allRecords.length;
  const recordsWithVoice = allRecords.filter((r) => r.hasChildVoice).length;
  const childVoicePercent = totalRecords > 0 ? Math.round((recordsWithVoice / totalRecords) * 100) : 0;

  // ─── 1. Child Voice Capture (weight: 30) ──────────────────────────────────
  let voiceScore = 0;

  if (childVoicePercent >= 60) voiceScore = 100;
  else if (childVoicePercent >= 40) voiceScore = 75;
  else if (childVoicePercent >= 25) voiceScore = 55;
  else if (childVoicePercent >= 10) voiceScore = 35;
  else voiceScore = 15;

  const kwWithVoice = input.keyWorkSessions.filter((r) => r.hasChildVoice).length;
  const kwVoicePercent = input.keyWorkSessions.length > 0
    ? (kwWithVoice / input.keyWorkSessions.length) * 100 : 0;
  if (kwVoicePercent >= 80) {
    voiceScore = Math.min(100, voiceScore + 10);
    strengths.push("Child's voice consistently captured in key work sessions");
  }

  if (childVoicePercent < 25) {
    gaps.push({
      type: "voice_missing",
      severity: "high",
      description: `Only ${childVoicePercent}% of records include the child's direct voice.`,
      recommendation: "Staff should actively include direct quotes from the young person in daily logs and key work records.",
    });
    recommendations.push("Increase child voice capture — aim for direct quotes in at least 40% of records");
  }

  dimensions.push({
    name: "Child Voice Capture",
    score: voiceScore,
    weight: 30,
    description: "How consistently the child's own words and views are recorded",
    evidence: `${childVoicePercent}% of records contain child voice (${recordsWithVoice}/${totalRecords})`,
  });

  // ─── 2. Voice → Care Plan Link (weight: 25) ──────────────────────────────
  let voiceToPlanScore = 0;
  const viewsLinked = input.childViews.filter((v) => v.linkedToCarePlan).length;
  const viewsLinkedPercent = input.childViews.length > 0
    ? Math.round((viewsLinked / input.childViews.length) * 100) : 0;

  const objectivesFromViews = input.carePlanObjectives.filter((o) => o.basedOnChildView).length;
  const objectivesFromViewsPercent = input.carePlanObjectives.length > 0
    ? Math.round((objectivesFromViews / input.carePlanObjectives.length) * 100) : 0;

  voiceToPlanScore = Math.round((viewsLinkedPercent + objectivesFromViewsPercent) / 2);

  if (voiceToPlanScore >= 70) {
    strengths.push("Strong link between child's expressed wishes and care plan objectives");
  }

  if (objectivesFromViewsPercent < 50 && input.carePlanObjectives.length > 0) {
    gaps.push({
      type: "plan_unlinked",
      severity: "medium",
      description: `Only ${objectivesFromViewsPercent}% of care plan objectives are explicitly based on the child's views.`,
      recommendation: "Review care plan — ensure each objective can be traced to something the young person has said they want.",
    });
    recommendations.push("Link care plan objectives to the child's expressed wishes and feelings");
  }

  for (const view of input.childViews.filter((v) => v.linkedToCarePlan && v.linkedObjectiveId)) {
    const objective = input.carePlanObjectives.find((o) => o.id === view.linkedObjectiveId);
    if (objective) {
      connections.push({
        fromType: "child_view",
        fromId: view.id,
        fromSummary: view.content.slice(0, 60),
        toType: "care_plan_objective",
        toId: objective.id,
        toSummary: objective.title,
        strength: "strong",
      });
    }
  }

  dimensions.push({
    name: "Voice → Care Plan",
    score: voiceToPlanScore,
    weight: 25,
    description: "Whether the child's views directly inform their care plan",
    evidence: `${viewsLinkedPercent}% of views linked to plan; ${objectivesFromViewsPercent}% of objectives from views`,
  });

  // ─── 3. Care Plan → Daily Practice (weight: 25) ──────────────────────────
  let practiceLinkScore = 0;
  const recordsLinked = allRecords.filter((r) => r.linksToCarePlan).length;
  const practicePercent = totalRecords > 0 ? Math.round((recordsLinked / totalRecords) * 100) : 0;

  const objectivesWithEvidence = input.carePlanObjectives.filter((o) => o.evidenceCount > 0).length;
  const carePlanCoverage = input.carePlanObjectives.length > 0
    ? Math.round((objectivesWithEvidence / input.carePlanObjectives.length) * 100) : 0;

  practiceLinkScore = Math.round((practicePercent * 0.4 + carePlanCoverage * 0.6));

  if (carePlanCoverage >= 80) {
    strengths.push("Daily practice well-evidenced against care plan objectives");
  }

  if (carePlanCoverage < 50 && input.carePlanObjectives.length > 0) {
    gaps.push({
      type: "practice_drift",
      severity: "high",
      description: `${input.carePlanObjectives.filter((o) => o.evidenceCount === 0).length} care plan objectives have no supporting evidence in daily records.`,
      recommendation: "Ensure daily logs and key work actively reference which care plan objective is being worked on.",
    });
    recommendations.push("Link daily records to specific care plan objectives — show the plan being actioned");
  }

  dimensions.push({
    name: "Care Plan → Practice",
    score: practiceLinkScore,
    weight: 25,
    description: "Whether daily practice demonstrably works towards care plan objectives",
    evidence: `${practicePercent}% records linked to plan; ${carePlanCoverage}% objectives evidenced`,
  });

  // ─── 4. Review Integration (weight: 20) ──────────────────────────────────
  let reviewScore = 0;

  if (input.reviewRecords.length === 0) {
    reviewScore = 30;
    gaps.push({
      type: "review_gap",
      severity: "medium",
      description: "No formal review records found in the analysis window.",
      recommendation: "Ensure reviews happen at planned intervals and are recorded with the young person's views.",
    });
  } else {
    const reviewsWithVoice = input.reviewRecords.filter((r) => r.hasChildVoice).length;
    const reviewVoicePercent = (reviewsWithVoice / input.reviewRecords.length) * 100;
    const reviewsLinked = input.reviewRecords.filter((r) => r.linksToCarePlan).length;
    const reviewLinkedPercent = (reviewsLinked / input.reviewRecords.length) * 100;

    reviewScore = Math.round((reviewVoicePercent * 0.5 + reviewLinkedPercent * 0.5));

    if (reviewVoicePercent >= 80 && reviewLinkedPercent >= 80) {
      strengths.push("Reviews effectively capture the child's voice and link to care planning");
    }
  }

  dimensions.push({
    name: "Review Integration",
    score: reviewScore,
    weight: 20,
    description: "Whether reviews incorporate the child's voice and connect to the care plan",
    evidence: `${input.reviewRecords.length} reviews in window`,
  });

  // ─── Calculate Overall ────────────────────────────────────────────────────
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
  );

  let grade: GoldenThreadAnalysis["grade"];
  if (overallScore >= 80) grade = "outstanding";
  else if (overallScore >= 60) grade = "good";
  else if (overallScore >= 40) grade = "requires_improvement";
  else grade = "inadequate";

  return {
    childId: input.childId,
    childName: input.childName,
    analysedAt: new Date().toISOString().slice(0, 10),
    windowDays: input.analysisWindowDays,
    overallScore,
    grade,
    dimensions,
    threadConnections: connections,
    gaps: gaps.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    strengths: strengths.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    stats: {
      totalRecords,
      recordsWithChildVoice: recordsWithVoice,
      childVoicePercent,
      carePlanCoverage,
      viewsLinkedToPlans: viewsLinkedPercent,
      uniqueViewsCaptured: input.childViews.length,
    },
  };
}

function severityOrder(s: "high" | "medium" | "low"): number {
  switch (s) {
    case "high": return 0;
    case "medium": return 1;
    case "low": return 2;
  }
}
