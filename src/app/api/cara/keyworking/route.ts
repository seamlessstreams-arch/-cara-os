// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/keyworking — Key Working Intelligence
//
// Analyses keywork session quality, frequency, relationship, and child voice.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 5(a) alignment (Quality of relationships).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseKeyworking } from "@/lib/cara/keyworking-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { KeyworkingInput, KeyworkSession, SessionTopic } from "@/lib/cara/keyworking-intelligence";

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
    let input: KeyworkingInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseKeyworking(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/keyworking] Error:", err);
    return NextResponse.json(
      { error: "Keyworking intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<KeyworkingInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Keywork sessions (last 90 days)
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const { data: rawSessions } = await (sb.from("keywork_sessions") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const sessions: KeyworkSession[] = (rawSessions ?? []).map((s: any) => ({
    id: s.id,
    date: s.date,
    keyworkerName: s.keyworker_name ?? "Unknown",
    plannedDuration: s.planned_duration ?? 45,
    actualDuration: s.actual_duration ?? 0,
    occurred: s.occurred ?? true,
    cancelledBy: s.cancelled_by ?? undefined,
    topicsCovered: (s.topics ?? []) as SessionTopic[],
    childLed: s.child_led ?? false,
    wishesAndFeelingsRecorded: s.wishes_recorded ?? false,
    actionsAgreed: s.actions_agreed ?? 0,
    actionsCompleted: s.actions_completed ?? 0,
    childEngagement: s.engagement ?? "moderate",
    childFeedback: s.feedback ?? undefined,
    privateTime: s.private_time ?? true,
    location: s.location ?? "in_home",
  }));

  // Keywork config
  const { data: config } = await (sb.from("keywork_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    sessions,
    expectedFrequency: config?.expected_frequency ?? "weekly",
    expectedFrequencyPerMonth: config?.frequency_per_month ?? 4,
    currentKeyworkerName: config?.current_keyworker ?? "Unknown",
    keyworkerChangesLast12Months: config?.kw_changes_12m ?? 0,
    keyworkerRelationshipMonths: config?.relationship_months ?? 6,
    childCanChooseTopics: config?.child_chooses_topics ?? true,
    childKnowsKeyworker: config?.child_knows_kw ?? true,
    keyworkPolicyInPlace: config?.policy_in_place ?? true,
    reg44VisitorMeetsChild: config?.reg44_meets_child ?? true,
    reg44VisitsCurrent: config?.reg44_current ?? true,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): KeyworkingInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — good engagement
    return {
      childId,
      childName: "Sam",
      age: 14,
      sessions: [
        {
          id: "kw_1", date: "2026-03-07", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 40, occurred: true,
          topicsCovered: ["wellbeing", "education", "activities"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 2, actionsCompleted: 2,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "activity_based",
        },
        {
          id: "kw_2", date: "2026-03-14", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 45, occurred: true,
          topicsCovered: ["wellbeing", "goals", "independence"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 1, actionsCompleted: 1,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "in_home",
        },
        {
          id: "kw_3", date: "2026-03-21", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 45, occurred: true,
          topicsCovered: ["health", "contact", "wishes_feelings"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 2, actionsCompleted: 1,
          childEngagement: "moderate", childFeedback: "positive",
          privateTime: true, location: "in_home",
        },
        {
          id: "kw_4", date: "2026-03-28", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 0, occurred: false,
          topicsCovered: [], cancelledBy: "child",
          childLed: false, wishesAndFeelingsRecorded: false,
          actionsAgreed: 0, actionsCompleted: 0,
          childEngagement: "low", privateTime: false, location: "in_home",
        },
        {
          id: "kw_5", date: "2026-04-04", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 50, occurred: true,
          topicsCovered: ["wellbeing", "education", "identity"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 2, actionsCompleted: 2,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "out_of_home",
        },
        {
          id: "kw_6", date: "2026-04-11", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 45, occurred: true,
          topicsCovered: ["wellbeing", "behaviour", "wishes_feelings"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 1, actionsCompleted: 1,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "in_home",
        },
        {
          id: "kw_7", date: "2026-04-18", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 40, occurred: true,
          topicsCovered: ["education", "goals", "activities"],
          childLed: false, wishesAndFeelingsRecorded: true,
          actionsAgreed: 3, actionsCompleted: 2,
          childEngagement: "moderate", childFeedback: "neutral",
          privateTime: true, location: "in_home",
        },
        {
          id: "kw_8", date: "2026-04-25", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 45, occurred: true,
          topicsCovered: ["wellbeing", "safety", "wishes_feelings"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 2, actionsCompleted: 2,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "in_home",
        },
        {
          id: "kw_9", date: "2026-05-02", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 45, occurred: true,
          topicsCovered: ["wellbeing", "contact", "independence"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 2, actionsCompleted: 2,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "activity_based",
        },
        {
          id: "kw_10", date: "2026-05-09", keyworkerName: "Emma",
          plannedDuration: 45, actualDuration: 50, occurred: true,
          topicsCovered: ["wellbeing", "education", "goals"],
          childLed: true, wishesAndFeelingsRecorded: true,
          actionsAgreed: 1, actionsCompleted: 1,
          childEngagement: "high", childFeedback: "positive",
          privateTime: true, location: "in_home",
        },
      ],
      expectedFrequency: "weekly",
      expectedFrequencyPerMonth: 4,
      currentKeyworkerName: "Emma",
      keyworkerChangesLast12Months: 0,
      keyworkerRelationshipMonths: 10,
      childCanChooseTopics: true,
      childKnowsKeyworker: true,
      keyworkPolicyInPlace: true,
      reg44VisitorMeetsChild: true,
      reg44VisitsCurrent: true,
    };
  }

  // Jordan — mostly good, some sessions missed
  return {
    childId,
    childName: "Jordan",
    age: 15,
    sessions: [
      {
        id: "kw_1", date: "2026-03-06", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 35, occurred: true,
        topicsCovered: ["wellbeing", "education"],
        childLed: false, wishesAndFeelingsRecorded: true,
        actionsAgreed: 2, actionsCompleted: 1,
        childEngagement: "moderate", childFeedback: "neutral",
        privateTime: true, location: "in_home",
      },
      {
        id: "kw_2", date: "2026-03-13", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 0, occurred: false,
        topicsCovered: [], cancelledBy: "child",
        childLed: false, wishesAndFeelingsRecorded: false,
        actionsAgreed: 0, actionsCompleted: 0,
        childEngagement: "refused", privateTime: false, location: "in_home",
      },
      {
        id: "kw_3", date: "2026-03-20", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 45, occurred: true,
        topicsCovered: ["wellbeing", "behaviour", "wishes_feelings"],
        childLed: true, wishesAndFeelingsRecorded: true,
        actionsAgreed: 3, actionsCompleted: 2,
        childEngagement: "high", childFeedback: "positive",
        privateTime: true, location: "out_of_home",
      },
      {
        id: "kw_4", date: "2026-03-27", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 40, occurred: true,
        topicsCovered: ["education", "goals", "independence"],
        childLed: true, wishesAndFeelingsRecorded: true,
        actionsAgreed: 2, actionsCompleted: 2,
        childEngagement: "high", childFeedback: "positive",
        privateTime: true, location: "in_home",
      },
      {
        id: "kw_5", date: "2026-04-03", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 0, occurred: false,
        topicsCovered: [], cancelledBy: "staff",
        childLed: false, wishesAndFeelingsRecorded: false,
        actionsAgreed: 0, actionsCompleted: 0,
        childEngagement: "moderate", privateTime: false, location: "in_home",
      },
      {
        id: "kw_6", date: "2026-04-10", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 50, occurred: true,
        topicsCovered: ["wellbeing", "health", "contact"],
        childLed: true, wishesAndFeelingsRecorded: true,
        actionsAgreed: 2, actionsCompleted: 2,
        childEngagement: "high", childFeedback: "positive",
        privateTime: true, location: "activity_based",
      },
      {
        id: "kw_7", date: "2026-04-17", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 45, occurred: true,
        topicsCovered: ["wellbeing", "activities", "wishes_feelings"],
        childLed: true, wishesAndFeelingsRecorded: true,
        actionsAgreed: 1, actionsCompleted: 1,
        childEngagement: "high", childFeedback: "positive",
        privateTime: true, location: "in_home",
      },
      {
        id: "kw_8", date: "2026-04-24", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 40, occurred: true,
        topicsCovered: ["education", "goals"],
        childLed: false, wishesAndFeelingsRecorded: false,
        actionsAgreed: 2, actionsCompleted: 1,
        childEngagement: "moderate", childFeedback: "neutral",
        privateTime: true, location: "in_home",
      },
      {
        id: "kw_9", date: "2026-05-01", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 45, occurred: true,
        topicsCovered: ["wellbeing", "identity", "wishes_feelings"],
        childLed: true, wishesAndFeelingsRecorded: true,
        actionsAgreed: 2, actionsCompleted: 2,
        childEngagement: "high", childFeedback: "positive",
        privateTime: true, location: "in_home",
      },
      {
        id: "kw_10", date: "2026-05-08", keyworkerName: "Sarah",
        plannedDuration: 45, actualDuration: 45, occurred: true,
        topicsCovered: ["wellbeing", "education", "independence"],
        childLed: true, wishesAndFeelingsRecorded: true,
        actionsAgreed: 1, actionsCompleted: 1,
        childEngagement: "high", childFeedback: "positive",
        privateTime: true, location: "out_of_home",
      },
    ],
    expectedFrequency: "weekly",
    expectedFrequencyPerMonth: 4,
    currentKeyworkerName: "Sarah",
    keyworkerChangesLast12Months: 1,
    keyworkerRelationshipMonths: 6,
    childCanChooseTopics: true,
    childKnowsKeyworker: true,
    keyworkPolicyInPlace: true,
    reg44VisitorMeetsChild: true,
    reg44VisitsCurrent: true,
  };
}
