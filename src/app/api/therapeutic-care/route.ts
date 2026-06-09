// ══════════════════════════════════════════════════════════════════════════════
// API: /api/therapeutic-care
//
// Therapeutic Care Intelligence
//
// GET  — Returns therapeutic care assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateTherapeuticCareIntelligence,
  getTherapyTypeLabel,
  getTherapyProviderLabel,
  getSessionOutcomeLabel,
  getTherapistRoleLabel,
  getReferralStatusLabel,
} from "@/lib/therapeutic-care";
import type {
  TherapySession,
  TherapyReferral,
  TherapyPlan,
  TherapeuticEnvironment,
} from "@/lib/therapeutic-care";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

// Alex: weekly CBT sessions (mostly positive)
const DEMO_SESSIONS: TherapySession[] = [
  { id: "s-alex-01", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-03-01", durationMinutes: 50, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: true },
  { id: "s-alex-02", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-03-08", durationMinutes: 50, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-alex-03", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-03-15", durationMinutes: 50, outcome: "good_progress", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-alex-04", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-03-22", durationMinutes: 50, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-alex-05", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-03-29", durationMinutes: 50, outcome: "maintaining", childEngaged: true, childConsented: true, goalsAddressed: false, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-alex-06", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-04-05", durationMinutes: 50, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-alex-07", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-04-12", durationMinutes: 50, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: false, riskAssessmentUpdated: false },
  { id: "s-alex-08", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", therapistRole: "clinical_psychologist", sessionDate: "2026-04-19", durationMinutes: 50, outcome: "good_progress", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  // Morgan: completed play therapy sessions
  { id: "s-morgan-01", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-01", durationMinutes: 45, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: true },
  { id: "s-morgan-02", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-08", durationMinutes: 45, outcome: "good_progress", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-morgan-03", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-15", durationMinutes: 45, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
  { id: "s-morgan-04", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", therapistRole: "play_therapist", sessionDate: "2026-02-22", durationMinutes: 45, outcome: "positive", childEngaged: true, childConsented: true, goalsAddressed: true, keyWorkerBriefed: true, riskAssessmentUpdated: false },
];

const DEMO_REFERRALS: TherapyReferral[] = [
  { id: "ref-alex", childId: "child-alex", childName: "Alex", therapyType: "cbt", provider: "camhs", referralDate: "2026-01-15", status: "active", waitTimeDays: 14, assessmentDate: "2026-01-22", startDate: "2026-02-01", reasonForReferral: "Anxiety and low mood following placement move" },
  { id: "ref-jordan", childId: "child-jordan", childName: "Jordan", therapyType: "emdr", provider: "private", referralDate: "2026-02-01", status: "waitlisted", waitTimeDays: 42, reasonForReferral: "Complex trauma — EMDR recommended by CAMHS assessment" },
  { id: "ref-morgan", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", provider: "in_house", referralDate: "2026-01-10", status: "completed", waitTimeDays: 7, assessmentDate: "2026-01-12", startDate: "2026-01-17", reasonForReferral: "Difficulty expressing emotions — age-appropriate play therapy recommended" },
];

const DEMO_PLANS: TherapyPlan[] = [
  { id: "plan-alex", childId: "child-alex", childName: "Alex", therapyType: "cbt", goals: ["Reduce anxiety symptoms", "Develop coping strategies", "Improve sleep hygiene"], goalsAchieved: 2, planReviewDate: "2026-06-01", planIsCoProduced: true, childViewsIncluded: true, lastUpdated: "2026-04-01", updatedBy: "Dr Sarah Mitchell" },
  { id: "plan-morgan", childId: "child-morgan", childName: "Morgan", therapyType: "play_therapy", goals: ["Process feelings about family changes", "Build self-esteem through creative expression"], goalsAchieved: 2, planReviewDate: "2026-06-01", planIsCoProduced: true, childViewsIncluded: true, lastUpdated: "2026-03-15", updatedBy: "Emma Thompson (Play Therapist)" },
];

const DEMO_ENVIRONMENTS: TherapeuticEnvironment[] = [
  { id: "env-oak-house", quietSpaceAvailable: true, sensoryRoomAvailable: true, outdoorTherapeuticSpace: false, staffTrainedInTherapeuticApproaches: true, therapyRoomPrivate: true, childCanRequestTherapy: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateTherapeuticCareIntelligence(
    DEMO_SESSIONS,
    DEMO_REFERRALS,
    DEMO_PLANS,
    DEMO_ENVIRONMENTS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        therapyTypeLabels: Object.fromEntries(
          ([
            "cbt", "dbt", "play_therapy", "art_therapy", "emdr",
            "family_therapy", "group_therapy", "life_story", "psychodynamic",
            "trauma_focused_cbt", "sensory_integration", "other",
          ] as const).map((t) => [t, getTherapyTypeLabel(t)]),
        ),
        therapyProviderLabels: Object.fromEntries(
          ([
            "in_house", "camhs", "private", "nhs", "voluntary_sector",
          ] as const).map((p) => [p, getTherapyProviderLabel(p)]),
        ),
        sessionOutcomeLabels: Object.fromEntries(
          ([
            "positive", "good_progress", "maintaining", "no_change", "deteriorated", "did_not_attend",
          ] as const).map((o) => [o, getSessionOutcomeLabel(o)]),
        ),
        therapistRoleLabels: Object.fromEntries(
          ([
            "clinical_psychologist", "counsellor", "psychotherapist",
            "art_therapist", "play_therapist", "occupational_therapist", "social_worker",
          ] as const).map((r) => [r, getTherapistRoleLabel(r)]),
        ),
        referralStatusLabels: Object.fromEntries(
          ([
            "pending", "accepted", "active", "completed", "discharged", "waitlisted", "refused",
          ] as const).map((s) => [s, getReferralStatusLabel(s)]),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessions, referrals, plans, environments, homeId, periodStart, periodEnd } = body as {
    sessions?: TherapySession[];
    referrals?: TherapyReferral[];
    plans?: TherapyPlan[];
    environments?: TherapeuticEnvironment[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateTherapeuticCareIntelligence(
    sessions ?? [],
    referrals ?? [],
    plans ?? [],
    environments ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
