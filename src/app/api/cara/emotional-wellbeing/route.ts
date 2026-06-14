// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/emotional-wellbeing — Emotional Wellbeing Intelligence
//
// Analyses emotional/mental health: SDQ, therapy, self-harm, mood, support.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 6(2)(b)(i) alignment (Emotional & Mental Health).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseEmotionalWellbeing } from "@/lib/cara/emotional-wellbeing-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { EmotionalWellbeingInput, SDQScore, TherapeuticInput, SelfHarmIncident, MoodRecord } from "@/lib/cara/emotional-wellbeing-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: EmotionalWellbeingInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseEmotionalWellbeing(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/emotional-wellbeing] Error:", err);
    return NextResponse.json(
      { error: "Emotional wellbeing intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<EmotionalWellbeingInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // SDQ scores
  const { data: rawSDQ } = await (sb.from("sdq_scores") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("date", { ascending: true });

  const sdqScores: SDQScore[] = (rawSDQ ?? []).map((s: any) => ({
    date: s.date,
    totalDifficulties: s.total_difficulties ?? 0,
    band: s.band ?? "normal",
    emotionalSymptoms: s.emotional ?? 0,
    conductProblems: s.conduct ?? 0,
    hyperactivity: s.hyperactivity ?? 0,
    peerProblems: s.peer ?? 0,
    prosocial: s.prosocial ?? 0,
  }));

  // Therapeutic inputs
  const { data: rawTherapy } = await (sb.from("therapeutic_inputs") as SB)
    .select("*")
    .eq("child_id", childId);

  const therapeuticInputs: TherapeuticInput[] = (rawTherapy ?? []).map((t: any) => ({
    type: t.type ?? "counselling",
    provider: t.provider ?? "Unknown",
    frequency: t.frequency ?? "weekly",
    sessionsAttended: t.sessions_attended ?? 0,
    sessionsMissed: t.sessions_missed ?? 0,
    startDate: t.start_date ?? "",
    active: t.active ?? false,
    childEngaged: t.child_engaged ?? false,
  }));

  // Self-harm incidents (last 6 months)
  const cutoff = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const { data: rawSH } = await (sb.from("self_harm_incidents") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const selfHarmIncidents: SelfHarmIncident[] = (rawSH ?? []).map((i: any) => ({
    date: i.date,
    severity: i.severity ?? "minor",
    supportProvided: i.support_provided ?? true,
    safetyPlanUpdated: i.safety_plan_updated ?? false,
  }));

  // Mood records (last 30 days)
  const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data: rawMood } = await (sb.from("mood_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff30)
    .order("date", { ascending: true });

  const moodRecords: MoodRecord[] = (rawMood ?? []).map((m: any) => ({
    date: m.date,
    level: m.level ?? 3,
  }));

  // Config
  const { data: config } = await (sb.from("emotional_wellbeing_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    sdqScores,
    therapeuticInputs,
    selfHarmIncidents,
    moodRecords,
    mentalHealthReferralMade: config?.referral_made ?? false,
    mentalHealthReferralDate: config?.referral_date ?? undefined,
    waitingForService: config?.waiting ?? false,
    waitDays: config?.wait_days ?? undefined,
    hasSafetyPlan: config?.safety_plan ?? false,
    safetyPlanReviewed: config?.safety_plan_reviewed ?? false,
    regulatorySDQCompleted: config?.sdq_completed ?? (sdqScores.length > 0),
    emotionalHealthDiscussedInKeywork: config?.discussed_keywork ?? true,
    staffTrainedInMentalHealth: config?.staff_trained ?? true,
    childKnowsHowToGetHelp: config?.child_knows_help ?? true,
    positiveRelationshipsPresent: config?.positive_relationships ?? true,
    protectiveFactors: config?.protective_factors ?? [],
    riskFactors: config?.risk_factors ?? [],
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): EmotionalWellbeingInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — good emotional health
    return {
      childId,
      childName: "Sam",
      age: 14,
      sdqScores: [
        { date: "2025-11-01", totalDifficulties: 12, band: "normal", emotionalSymptoms: 3, conductProblems: 2, hyperactivity: 4, peerProblems: 3, prosocial: 8 },
        { date: "2026-05-01", totalDifficulties: 9, band: "normal", emotionalSymptoms: 2, conductProblems: 1, hyperactivity: 3, peerProblems: 3, prosocial: 9 },
      ],
      therapeuticInputs: [],
      selfHarmIncidents: [],
      moodRecords: [
        { date: "2026-05-01", level: 4 },
        { date: "2026-05-03", level: 4 },
        { date: "2026-05-05", level: 5 },
        { date: "2026-05-07", level: 4 },
        { date: "2026-05-09", level: 4 },
        { date: "2026-05-11", level: 5 },
        { date: "2026-05-13", level: 4 },
      ],
      mentalHealthReferralMade: false,
      waitingForService: false,
      hasSafetyPlan: false,
      safetyPlanReviewed: false,
      regulatorySDQCompleted: true,
      emotionalHealthDiscussedInKeywork: true,
      staffTrainedInMentalHealth: true,
      childKnowsHowToGetHelp: true,
      positiveRelationshipsPresent: true,
      protectiveFactors: ["stable placement", "good school attendance", "close sibling bond", "swimming club"],
      riskFactors: [],
    };
  }

  // Jordan — some complexity, receiving support
  return {
    childId,
    childName: "Jordan",
    age: 15,
    sdqScores: [
      { date: "2025-08-01", totalDifficulties: 19, band: "borderline", emotionalSymptoms: 5, conductProblems: 4, hyperactivity: 5, peerProblems: 5, prosocial: 6 },
      { date: "2026-02-01", totalDifficulties: 16, band: "borderline", emotionalSymptoms: 4, conductProblems: 3, hyperactivity: 5, peerProblems: 4, prosocial: 7 },
      { date: "2026-05-01", totalDifficulties: 13, band: "normal", emotionalSymptoms: 3, conductProblems: 3, hyperactivity: 4, peerProblems: 3, prosocial: 8 },
    ],
    therapeuticInputs: [
      {
        type: "counselling",
        provider: "Local Youth Counselling",
        frequency: "fortnightly",
        sessionsAttended: 10,
        sessionsMissed: 1,
        startDate: "2025-10-01",
        active: true,
        childEngaged: true,
      },
    ],
    selfHarmIncidents: [
      { date: "2025-09-15", severity: "ideation", supportProvided: true, safetyPlanUpdated: true },
    ],
    moodRecords: [
      { date: "2026-04-20", level: 3 },
      { date: "2026-04-23", level: 3 },
      { date: "2026-04-26", level: 4 },
      { date: "2026-04-29", level: 3 },
      { date: "2026-05-02", level: 4 },
      { date: "2026-05-05", level: 4 },
      { date: "2026-05-08", level: 4 },
      { date: "2026-05-11", level: 3 },
      { date: "2026-05-14", level: 4 },
    ],
    mentalHealthReferralMade: true,
    mentalHealthReferralDate: "2025-09-20",
    waitingForService: false,
    hasSafetyPlan: true,
    safetyPlanReviewed: true,
    regulatorySDQCompleted: true,
    emotionalHealthDiscussedInKeywork: true,
    staffTrainedInMentalHealth: true,
    childKnowsHowToGetHelp: true,
    positiveRelationshipsPresent: true,
    protectiveFactors: ["keyworker relationship", "football team", "engaged in counselling", "improving school attendance"],
    riskFactors: ["previous self-harm ideation", "family contact variable"],
  };
}
