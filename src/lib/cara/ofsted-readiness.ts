// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — OFSTED READINESS ENGINE
//
// Generates a snapshot of inspection readiness by analysing golden thread
// events, intelligence signals, child voice segments, AI runs, and workforce
// evidence (supervision cadence + training validity) from the last 90 days.
//
// The scoring is a PURE function (scoreReadiness) over already-fetched rows, so
// it is unit-tested directly — matching every other practice engine. Absence of
// evidence is scored honestly: a home with no workforce records does NOT get a
// flattering constant, and a home with no evidence at all does NOT score a
// perfect safeguarding mark (the fabricate-on-empty rule).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { todayStr } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;
type Row = Record<string, unknown>;

const QUALITY_STANDARDS = [
  "quality_and_purpose",
  "children_views_wishes_feelings",
  "education",
  "enjoyment_and_achievement",
  "health_and_wellbeing",
  "positive_relationships",
  "protection_of_children",
  "leadership_and_management",
  "care_planning",
];

function scoreFromCount(count: number, expected: number): number {
  if (expected === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((count / expected) * 100)));
}

export interface ReadinessInputs {
  goldenThread: Row[];
  openSignals: Row[];
  childVoice: Row[];
  aiRuns: Row[];
  supervisions: Row[];
  training: Row[];
  todayIso: string;
}

export interface ReadinessResult {
  overall: number;
  careScore: number;
  leadershipScore: number;
  safeguardingScore: number;
  childVoiceScore: number;
  workforceScore: number;
  missingEvidence: string[];
  priorityActions: Array<{ title: string; ownerRole: string; duePriority: string; rationale: string }>;
  qualityStandardMap: Record<string, unknown>;
  evidenceStrength: Record<string, number>;
}

/**
 * Pure inspection-readiness scoring over already-fetched rows. Every dimension
 * is evidence-based: absence scores low, never a fabricated middle or a
 * flattering perfect mark.
 */
export function scoreReadiness(input: ReadinessInputs): ReadinessResult {
  const gt = input.goldenThread;
  const openSignals = input.openSignals;
  const voice = input.childVoice;
  const runs = input.aiRuns;

  const oversightEvents = gt.filter((e) => e.management_oversight_present).length;
  const childVoiceEvents = voice.length;
  const highRiskOpen = openSignals.filter((s) => ["high", "critical"].includes(s.risk_level as string)).length;
  const approvedAi = runs.filter((r) => r.status === "approved").length;

  const careScore = scoreFromCount(gt.length, 50);
  const leadershipScore = scoreFromCount(oversightEvents, 15);
  const childVoiceScore = scoreFromCount(childVoiceEvents, 20);

  // Safeguarding: start high and subtract for unresolved high/critical risks —
  // but ONLY when the home is demonstrably recording. With no golden-thread
  // events AND no signals at all there is no evidence of monitoring, so a
  // perfect 100 would be fabricated (the "empty register = compliant" trap).
  const hasSafeguardingEvidence = gt.length > 0 || openSignals.length > 0;
  const safeguardingScore = hasSafeguardingEvidence ? Math.max(0, 100 - highRiskOpen * 12) : 0;

  // Workforce: real evidence — completed supervisions in-window (cadence) and
  // the share of training still valid. No workforce records at all → 0, never
  // the old hardcoded 70.
  const completedSupervisions = input.supervisions.filter(
    (s) => s.status === "completed" || s.status === "signed_off",
  ).length;
  const validTraining = input.training.filter(
    (t) => t.status !== "expired" && (!t.expiry_date || String(t.expiry_date) >= input.todayIso),
  ).length;
  const supervisionScore = scoreFromCount(completedSupervisions, 12); // ~monthly cadence across a small team over 90d
  const trainingScore = input.training.length === 0 ? 0 : scoreFromCount(validTraining, input.training.length);
  const hasWorkforceEvidence = input.supervisions.length > 0 || input.training.length > 0;
  const workforceScore = hasWorkforceEvidence ? Math.round((supervisionScore + trainingScore) / 2) : 0;

  const overall = Math.round(
    careScore * 0.2 +
      leadershipScore * 0.25 +
      safeguardingScore * 0.25 +
      childVoiceScore * 0.15 +
      workforceScore * 0.15,
  );

  const missingEvidence: string[] = [];
  if (leadershipScore < 65) missingEvidence.push("Management oversight evidence is weaker than expected.");
  if (childVoiceScore < 65) missingEvidence.push("Child voice evidence is weaker than expected.");
  if (highRiskOpen > 0) missingEvidence.push("High or critical risk signals remain open.");
  if (workforceScore < 65) missingEvidence.push("Workforce evidence (supervision and training) is weaker than expected.");
  if (approvedAi < runs.length * 0.5 && runs.length > 5) missingEvidence.push("AI drafts require stronger approval discipline.");

  const priorityActions = missingEvidence.map((item) => ({
    title: item,
    ownerRole: "Registered Manager",
    duePriority: "this_week",
    rationale: "This affects inspection readiness and leadership oversight.",
  }));

  const qualityStandardMap = QUALITY_STANDARDS.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = {
      evidenceCount: gt.filter((e) => ((e.linked_quality_standard_refs as string[]) ?? []).includes(key)).length,
      status: "review",
    };
    return acc;
  }, {});

  return {
    overall,
    careScore,
    leadershipScore,
    safeguardingScore,
    childVoiceScore,
    workforceScore,
    missingEvidence,
    priorityActions,
    qualityStandardMap,
    evidenceStrength: {
      goldenThreadEvents: gt.length,
      oversightEvents,
      childVoiceEvents,
      openSignals: openSignals.length,
      completedSupervisions,
      validTraining,
    },
  };
}

export async function generateOfstedReadinessSnapshot(input: {
  homeId: string;
  generatedBy: string;
}) {
  if (!isSupabaseEnabled()) {
    return getDemoSnapshot(input.homeId);
  }

  const sb = createServerClient();
  if (!sb) return getDemoSnapshot(input.homeId);

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const todayIso = todayStr();

  const [goldenThread, signals, childVoice, aiRuns, supervisions, training] = await Promise.all([
    (sb.from("golden_thread_events") as SB)
      .select("*")
      .eq("home_id", input.homeId)
      .gte("event_date", since.toISOString()),
    (sb.from("cara_intelligence_signals") as SB)
      .select("*")
      .eq("home_id", input.homeId)
      .in("status", ["open", "acknowledged", "in_progress"]),
    (sb.from("child_voice_segments") as SB)
      .select("*")
      .eq("home_id", input.homeId)
      .gte("created_at", since.toISOString()),
    (sb.from("cara_ai_runs") as SB)
      .select("*")
      .eq("home_id", input.homeId)
      .gte("created_at", since.toISOString()),
    (sb.from("supervisions") as SB)
      .select("*")
      .eq("home_id", input.homeId)
      .gte("scheduled_date", since.toISOString().slice(0, 10)),
    (sb.from("training_records") as SB).select("*").eq("home_id", input.homeId),
  ]);

  const scores = scoreReadiness({
    goldenThread: goldenThread.data ?? [],
    openSignals: signals.data ?? [],
    childVoice: childVoice.data ?? [],
    aiRuns: aiRuns.data ?? [],
    supervisions: supervisions.data ?? [],
    training: training.data ?? [],
    todayIso,
  });

  const { data, error } = await (sb.from("ofsted_readiness_snapshots") as SB)
    .insert({
      home_id: input.homeId,
      generated_by: input.generatedBy,
      overall_score: scores.overall,
      leadership_score: scores.leadershipScore,
      care_score: scores.careScore,
      safeguarding_score: scores.safeguardingScore,
      workforce_score: scores.workforceScore,
      child_voice_score: scores.childVoiceScore,
      evidence_strength: scores.evidenceStrength,
      missing_evidence: scores.missingEvidence,
      priority_actions: scores.priorityActions,
      quality_standard_map: scores.qualityStandardMap,
      regulation_map: {},
      status: "draft",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

function getDemoSnapshot(homeId: string) {
  return {
    id: "demo-snapshot-id",
    home_id: homeId,
    overall_score: 68,
    leadership_score: 55,
    care_score: 72,
    safeguarding_score: 76,
    workforce_score: 70,
    child_voice_score: 48,
    missing_evidence: [
      "Management oversight evidence is weaker than expected.",
      "Child voice evidence is weaker than expected.",
    ],
    priority_actions: [
      {
        title: "Management oversight evidence is weaker than expected.",
        ownerRole: "Registered Manager",
        duePriority: "this_week",
        rationale: "This affects inspection readiness and leadership oversight.",
      },
      {
        title: "Child voice evidence is weaker than expected.",
        ownerRole: "Registered Manager",
        duePriority: "this_week",
        rationale: "This affects inspection readiness and leadership oversight.",
      },
    ],
    status: "draft",
  };
}
