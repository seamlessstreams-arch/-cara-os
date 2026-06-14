// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — OFSTED READINESS ENGINE
//
// Generates a snapshot of inspection readiness by analysing golden thread
// events, intelligence signals, child voice segments, and AI runs from
// the last 90 days.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

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

  const [goldenThread, signals, childVoice, aiRuns] = await Promise.all([
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
  ]);

  const gt = goldenThread.data ?? [];
  const openSignals = signals.data ?? [];
  const voice = childVoice.data ?? [];
  const runs = aiRuns.data ?? [];

  const oversightEvents = gt.filter((e: Record<string, unknown>) => e.management_oversight_present).length;
  const childVoiceEvents = voice.length;
  const highRiskOpen = openSignals.filter((s: Record<string, unknown>) => ["high", "critical"].includes(s.risk_level as string)).length;
  const approvedAi = runs.filter((r: Record<string, unknown>) => r.status === "approved").length;

  const careScore = scoreFromCount(gt.length, 50);
  const leadershipScore = scoreFromCount(oversightEvents, 15);
  const safeguardingScore = Math.max(0, 100 - highRiskOpen * 12);
  const childVoiceScore = scoreFromCount(childVoiceEvents, 20);
  const workforceScore = 70; // TODO: Replace with supervision/training calculations from existing HR module.

  const overall = Math.round(
    careScore * 0.2 +
      leadershipScore * 0.25 +
      safeguardingScore * 0.25 +
      childVoiceScore * 0.15 +
      workforceScore * 0.15
  );

  const missingEvidence: string[] = [];
  if (leadershipScore < 65) missingEvidence.push("Management oversight evidence is weaker than expected.");
  if (childVoiceScore < 65) missingEvidence.push("Child voice evidence is weaker than expected.");
  if (highRiskOpen > 0) missingEvidence.push("High or critical risk signals remain open.");
  if (approvedAi < runs.length * 0.5 && runs.length > 5) missingEvidence.push("AI drafts require stronger approval discipline.");

  const priorityActions = missingEvidence.map((item) => ({
    title: item,
    ownerRole: "Registered Manager",
    duePriority: "this_week",
    rationale: "This affects inspection readiness and leadership oversight.",
  }));

  const qualityStandardMap = QUALITY_STANDARDS.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = {
      evidenceCount: gt.filter((e: Record<string, unknown>) => (e.linked_quality_standard_refs as string[] ?? []).includes(key)).length,
      status: "review",
    };
    return acc;
  }, {});

  const { data, error } = await (sb.from("ofsted_readiness_snapshots") as SB)
    .insert({
      home_id: input.homeId,
      generated_by: input.generatedBy,
      overall_score: overall,
      leadership_score: leadershipScore,
      care_score: careScore,
      safeguarding_score: safeguardingScore,
      workforce_score: workforceScore,
      child_voice_score: childVoiceScore,
      evidence_strength: {
        goldenThreadEvents: gt.length,
        oversightEvents,
        childVoiceEvents,
        openSignals: openSignals.length,
      },
      missing_evidence: missingEvidence,
      priority_actions: priorityActions,
      quality_standard_map: qualityStandardMap,
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
