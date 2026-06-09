// ══════════════════════════════════════════════════════════════════════════════
// API: /api/mental-health-wellbeing — Mental Health & Wellbeing Intelligence
//
// GET  — returns demo intelligence report for Chamberlain House
// POST — accepts custom data and returns computed intelligence
//
// CHR 2015 Reg 10 — Health and wellbeing
// NICE CG26/CG28 — PTSD / Depression in children
// SCCIF — Experiences and progress (emotional wellbeing)
// UNCRC Article 24 — Right to the highest attainable standard of health
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateMentalHealthIntelligence } from "@/lib/mental-health-wellbeing";
import type {
  WellbeingAssessment,
  TherapeuticIntervention,
  CriticalIncident,
  WellbeingSafetyPlan,
} from "@/lib/mental-health-wellbeing";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-oak";
  const now = new Date().toISOString();
  const periodStart = url.searchParams.get("periodStart") ?? "2026-01-01T00:00:00Z";
  const periodEnd = url.searchParams.get("periodEnd") ?? now;

  const assessments = getDemoAssessments(homeId);
  const interventions = getDemoInterventions(homeId);
  const incidents = getDemoIncidents(homeId);
  const plans = getDemoSafetyPlans(homeId);
  const childIds = ["child-alex", "child-jordan", "child-morgan"];

  const result = generateMentalHealthIntelligence(
    assessments,
    interventions,
    incidents,
    plans,
    childIds,
    homeId,
    periodStart,
    periodEnd,
    now,
  );

  return NextResponse.json(result);
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    assessments,
    interventions,
    incidents,
    plans,
    childIds,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body;

  if (!homeId) {
    return NextResponse.json({ error: "homeId required" }, { status: 400 });
  }
  if (!childIds || !Array.isArray(childIds)) {
    return NextResponse.json({ error: "childIds array required" }, { status: 400 });
  }

  const result = generateMentalHealthIntelligence(
    (assessments ?? []) as WellbeingAssessment[],
    (interventions ?? []) as TherapeuticIntervention[],
    (incidents ?? []) as CriticalIncident[],
    (plans ?? []) as WellbeingSafetyPlan[],
    childIds as string[],
    homeId as string,
    (periodStart ?? "2026-01-01T00:00:00Z") as string,
    (periodEnd ?? new Date().toISOString()) as string,
    (referenceDate ?? new Date().toISOString()) as string,
  );

  return NextResponse.json(result);
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoAssessments(homeId: string): WellbeingAssessment[] {
  return [
    {
      id: "assess-alex-01",
      homeId,
      childId: "child-alex",
      childName: "Alex (14)",
      assessmentDate: "2026-04-01T10:00:00Z",
      assessor: "Sarah Johnson",
      assessmentTool: "SDQ",
      domains: [
        { domain: "emotional_regulation", score: 4, riskLevel: "moderate", trend: "improving" },
        { domain: "anxiety", score: 6, riskLevel: "moderate", trend: "stable" },
        { domain: "depression", score: 5, riskLevel: "moderate", trend: "stable" },
        { domain: "self_harm", score: 4, riskLevel: "high", trend: "stable" },
        { domain: "attachment", score: 5, riskLevel: "moderate", trend: "improving" },
        { domain: "trauma_response", score: 3, riskLevel: "high", trend: "stable" },
        { domain: "social_functioning", score: 6, riskLevel: "moderate", trend: "improving" },
        { domain: "self_esteem", score: 5, riskLevel: "moderate", trend: "stable" },
        { domain: "sleep", score: 6, riskLevel: "moderate", trend: "stable" },
        { domain: "eating", score: 7, riskLevel: "low", trend: "stable" },
      ],
      overallScore: 5,
      overallRisk: "moderate",
      childSelfReport: true,
      staffContribution: true,
      clinicalInput: true,
      recommendations: ["Continue CAMHS sessions", "Monitor self-harm triggers", "Increase attachment-focused work"],
      nextAssessmentDate: "2026-10-01T00:00:00Z",
    },
    {
      id: "assess-jordan-01",
      homeId,
      childId: "child-jordan",
      childName: "Jordan (13)",
      assessmentDate: "2026-03-15T14:00:00Z",
      assessor: "Tom Richards",
      assessmentTool: "SDQ",
      domains: [
        { domain: "emotional_regulation", score: 8, riskLevel: "low", trend: "improving" },
        { domain: "anxiety", score: 8, riskLevel: "low", trend: "stable" },
        { domain: "depression", score: 9, riskLevel: "low", trend: "stable" },
        { domain: "self_harm", score: 10, riskLevel: "low", trend: "stable" },
        { domain: "attachment", score: 7, riskLevel: "low", trend: "improving" },
        { domain: "trauma_response", score: 7, riskLevel: "low", trend: "stable" },
        { domain: "social_functioning", score: 9, riskLevel: "low", trend: "improving" },
        { domain: "self_esteem", score: 8, riskLevel: "low", trend: "stable" },
        { domain: "sleep", score: 8, riskLevel: "low", trend: "stable" },
        { domain: "eating", score: 9, riskLevel: "low", trend: "stable" },
      ],
      overallScore: 8,
      overallRisk: "low",
      childSelfReport: true,
      staffContribution: true,
      clinicalInput: false,
      recommendations: ["Continue current support", "Maintain positive routines"],
      nextAssessmentDate: "2026-09-15T00:00:00Z",
    },
    {
      id: "assess-morgan-01",
      homeId,
      childId: "child-morgan",
      childName: "Morgan (15)",
      assessmentDate: "2026-04-10T09:00:00Z",
      assessor: "Lisa Williams",
      assessmentTool: "GAD7",
      domains: [
        { domain: "emotional_regulation", score: 5, riskLevel: "moderate", trend: "stable" },
        { domain: "anxiety", score: 2, riskLevel: "high", trend: "declining" },
        { domain: "depression", score: 4, riskLevel: "moderate", trend: "declining" },
        { domain: "self_harm", score: 7, riskLevel: "low", trend: "stable" },
        { domain: "attachment", score: 6, riskLevel: "moderate", trend: "stable" },
        { domain: "trauma_response", score: 5, riskLevel: "moderate", trend: "stable" },
        { domain: "social_functioning", score: 5, riskLevel: "moderate", trend: "declining" },
        { domain: "self_esteem", score: 3, riskLevel: "high", trend: "declining" },
        { domain: "sleep", score: 4, riskLevel: "moderate", trend: "declining" },
        { domain: "eating", score: 7, riskLevel: "low", trend: "stable" },
      ],
      overallScore: 4,
      overallRisk: "high",
      childSelfReport: true,
      staffContribution: true,
      clinicalInput: true,
      recommendations: ["Increase therapy frequency", "Review medication", "Self-esteem programme"],
      nextAssessmentDate: "2026-07-10T00:00:00Z",
    },
  ];
}

function getDemoInterventions(homeId: string): TherapeuticIntervention[] {
  return [
    {
      id: "int-alex-camhs",
      homeId,
      childId: "child-alex",
      childName: "Alex (14)",
      interventionType: "camhs",
      provider: "Local CAMHS Team",
      startDate: "2026-02-01T00:00:00Z",
      status: "active",
      sessionsPlanned: 12,
      sessionsAttended: 8,
      sessionsRescheduled: 1,
      sessionsCancelled: 0,
      childEngagement: 7,
      progressNotes: "Good progress with emotional regulation strategies. Using grounding techniques daily.",
      measurableOutcomes: ["Reduced self-harm frequency", "Improved mood diary scores", "Better sleep pattern"],
    },
    {
      id: "int-morgan-therapy",
      homeId,
      childId: "child-morgan",
      childName: "Morgan (15)",
      interventionType: "private_therapy",
      provider: "Dr Sarah Mitchell — CBT Specialist",
      startDate: "2026-03-01T00:00:00Z",
      status: "active",
      sessionsPlanned: 16,
      sessionsAttended: 10,
      sessionsRescheduled: 2,
      sessionsCancelled: 1,
      childEngagement: 8,
      progressNotes: "Strong engagement. Anxiety management tools being practised daily. Self-esteem work ongoing.",
      measurableOutcomes: ["GAD7 score reduced from 18 to 14", "Attending school more regularly"],
    },
  ];
}

function getDemoIncidents(homeId: string): CriticalIncident[] {
  return [
    {
      id: "ci-alex-01",
      homeId,
      childId: "child-alex",
      childName: "Alex (14)",
      date: "2026-04-15T22:30:00Z",
      type: "self_harm",
      severity: "moderate",
      responseTimeMins: 5,
      professionalsCalled: ["On-call CAMHS", "Darren Laville (RM)"],
      safetyPlanActivated: true,
      safetyPlanEffective: true,
      followUpWithin24h: true,
      followUpWithin72h: true,
      camhsNotified: true,
      planUpdated: true,
    },
  ];
}

function getDemoSafetyPlans(homeId: string): WellbeingSafetyPlan[] {
  return [
    {
      id: "sp-alex-01",
      homeId,
      childId: "child-alex",
      childName: "Alex (14)",
      createdDate: "2026-03-01T00:00:00Z",
      lastReviewDate: "2026-04-20T00:00:00Z",
      nextReviewDate: "2026-07-20T00:00:00Z",
      status: "current",
      childInvolved: true,
      parentInvolved: false,
      keyProfessionalInvolved: true,
      triggersIdentified: ["Family contact", "Evening time", "Peer rejection", "Exam pressure"],
      copingStrategies: ["Breathing exercises", "Art journaling", "Named adult check-in", "Sensory box"],
      supportContacts: ["Sarah Johnson", "Tom Richards"],
      professionalContacts: ["CAMHS duty team", "GP surgery", "Social worker"],
    },
    {
      id: "sp-morgan-01",
      homeId,
      childId: "child-morgan",
      childName: "Morgan (15)",
      createdDate: "2026-02-15T00:00:00Z",
      lastReviewDate: "2026-04-01T00:00:00Z",
      nextReviewDate: "2026-07-01T00:00:00Z",
      status: "under_review",
      childInvolved: true,
      parentInvolved: true,
      keyProfessionalInvolved: true,
      triggersIdentified: ["Exam pressure", "Social media comparison", "Peer conflict", "Sleep disruption"],
      copingStrategies: ["Progressive muscle relaxation", "Grounding techniques", "Talking to keyworker"],
      supportContacts: ["Lisa Williams", "Darren Laville"],
      professionalContacts: ["Dr Sarah Mitchell", "CAMHS", "School counsellor"],
    },
  ];
}
