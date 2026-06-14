// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/key-work-quality
//
// GET — Analyse key work session quality for a home
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseKeyWork, type KeyWorkSession, type KeyWorkConfig } from "@/lib/cara/key-work-quality";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData() {
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

  const configs: KeyWorkConfig[] = [
    {
      childId: "child_jordan",
      childName: "Jordan P",
      keyWorker: "staff_sarah",
      keyWorkerName: "Sarah T",
      frequencyDays: 7,
      carePlanObjectiveIds: ["obj_emo", "obj_edu", "obj_ind", "obj_fam"],
      carePlanObjectiveTitles: ["Emotional regulation", "School attendance", "Independence (DofE)", "Family contact"],
    },
    {
      childId: "child_sam",
      childName: "Sam W",
      keyWorker: "staff_emma",
      keyWorkerName: "Emma L",
      frequencyDays: 7,
      carePlanObjectiveIds: ["obj_s_dofe", "obj_s_conf", "obj_s_sleep"],
      carePlanObjectiveTitles: ["DofE completion", "Social confidence", "Sleep routine"],
    },
    {
      childId: "child_alex",
      childName: "Alex R",
      keyWorker: "staff_mike",
      keyWorkerName: "Mike R",
      frequencyDays: 7,
      carePlanObjectiveIds: ["obj_a_anger", "obj_a_school", "obj_a_peer"],
      carePlanObjectiveTitles: ["Anger management", "School engagement", "Peer relationships"],
    },
  ];

  const sessions: KeyWorkSession[] = [
    // Jordan — good frequency, good voice
    { id: "kw_1", childId: "child_jordan", childName: "Jordan P", date: d(3), staffId: "staff_sarah", staffName: "Sarah T", durationMinutes: 35, topics: ["DofE progress", "feelings about school"], linkedObjectiveIds: ["obj_ind", "obj_edu"], hasChildVoice: true, childEngagement: "high", actionsSet: 2, actionsCompleted: 2, previousActionsTotal: 2 },
    { id: "kw_2", childId: "child_jordan", childName: "Jordan P", date: d(10), staffId: "staff_sarah", staffName: "Sarah T", durationMinutes: 25, topics: ["family contact", "weekend plans"], linkedObjectiveIds: ["obj_fam"], hasChildVoice: true, childEngagement: "moderate", actionsSet: 1, actionsCompleted: 1, previousActionsTotal: 2 },
    { id: "kw_3", childId: "child_jordan", childName: "Jordan P", date: d(17), staffId: "staff_mike", staffName: "Mike R", durationMinutes: 30, topics: ["emotional regulation", "coping strategies"], linkedObjectiveIds: ["obj_emo"], hasChildVoice: true, childEngagement: "high", actionsSet: 2, actionsCompleted: 1, previousActionsTotal: 1 },
    { id: "kw_4", childId: "child_jordan", childName: "Jordan P", date: d(24), staffId: "staff_sarah", staffName: "Sarah T", durationMinutes: 40, topics: ["school", "DofE", "independence goals"], linkedObjectiveIds: ["obj_edu", "obj_ind"], hasChildVoice: true, childEngagement: "high", actionsSet: 3, actionsCompleted: 2, previousActionsTotal: 2 },

    // Sam — slightly overdue, mixed engagement
    { id: "kw_5", childId: "child_sam", childName: "Sam W", date: d(5), staffId: "staff_emma", staffName: "Emma L", durationMinutes: 25, topics: ["DofE volunteering", "how feeling"], linkedObjectiveIds: ["obj_s_dofe"], hasChildVoice: true, childEngagement: "moderate", actionsSet: 1, actionsCompleted: 1, previousActionsTotal: 2 },
    { id: "kw_6", childId: "child_sam", childName: "Sam W", date: d(14), staffId: "staff_emma", staffName: "Emma L", durationMinutes: 30, topics: ["social group", "confidence building"], linkedObjectiveIds: ["obj_s_conf"], hasChildVoice: false, childEngagement: "low", actionsSet: 2, actionsCompleted: 0, previousActionsTotal: 1 },
    { id: "kw_7", childId: "child_sam", childName: "Sam W", date: d(21), staffId: "staff_emma", staffName: "Emma L", durationMinutes: 20, topics: ["sleep routine", "bedtime worries"], linkedObjectiveIds: ["obj_s_sleep"], hasChildVoice: true, childEngagement: "moderate", actionsSet: 1, actionsCompleted: 1, previousActionsTotal: 2 },

    // Alex — poor engagement, gaps
    { id: "kw_8", childId: "child_alex", childName: "Alex R", date: d(7), staffId: "staff_mike", staffName: "Mike R", durationMinutes: 15, topics: ["check in"], linkedObjectiveIds: ["obj_a_anger"], hasChildVoice: false, childEngagement: "low", actionsSet: 1, actionsCompleted: 0, previousActionsTotal: 2 },
    { id: "kw_9", childId: "child_alex", childName: "Alex R", date: d(18), staffId: "staff_mike", staffName: "Mike R", durationMinutes: 10, topics: ["brief check in"], linkedObjectiveIds: [], hasChildVoice: false, childEngagement: "refused", actionsSet: 0, actionsCompleted: 0, previousActionsTotal: 1 },
  ];

  return { sessions, configs };
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "28", 10);

    const { sessions, configs } = getDemoData();
    const analysis = analyseKeyWork(sessions, configs, homeId, days);

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/key-work-quality] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse key work quality" }, { status: 500 });
  }
}
